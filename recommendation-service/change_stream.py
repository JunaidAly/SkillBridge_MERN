"""
MongoDB Change Stream Watcher for Auto-Training
Monitors users collection and triggers model retraining when relevant changes occur
"""
import asyncio
import logging
import threading
from datetime import datetime, timedelta
from typing import Optional
from pymongo import MongoClient
from pymongo.errors import PyMongoError

logger = logging.getLogger(__name__)


class ChangeStreamWatcher:
    """Watch MongoDB changes and trigger model retraining"""
    
    def __init__(self, mongo_uri: str, database_name: str):
        self.mongo_uri = mongo_uri
        self.database_name = database_name
        self.client: Optional[MongoClient] = None
        self.is_running = False
        self.last_retrain_time: Optional[datetime] = None
        self.retrain_cooldown = timedelta(minutes=5)  # Don't retrain more often than every 5 minutes
        self.pending_retrain = False
        self._thread: Optional[threading.Thread] = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        
    async def start(self, recommendation_engine):
        """Start watching for changes"""
        self.recommendation_engine = recommendation_engine
        self.is_running = True
        self._loop = asyncio.get_event_loop()
        
        # Run change stream in separate thread to avoid blocking
        self._thread = threading.Thread(target=self._watch_changes_sync, daemon=True)
        self._thread.start()
        
        logger.info("🔍 Change stream watcher started")
        
    async def stop(self):
        """Stop watching for changes"""
        self.is_running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=5)
        if self.client:
            self.client.close()
        logger.info("🛑 Change stream watcher stopped")
        
    def _watch_changes_sync(self):
        """Watch MongoDB users collection for changes (runs in separate thread)"""
        try:
            # Create synchronous MongoDB client for change streams
            self.client = MongoClient(self.mongo_uri)
            db = self.client[self.database_name]
            collection = db.users
            
            logger.info("👀 Watching users collection for changes...")
            
            # Watch for insert, update, and replace operations
            pipeline = [
                {
                    '$match': {
                        'operationType': {'$in': ['insert', 'update', 'replace']}
                    }
                }
            ]
            
            # Start watching with timeout
            with collection.watch(pipeline, max_await_time_ms=1000) as stream:
                while self.is_running:
                    try:
                        change = stream.try_next()
                        if change is not None:
                            # Schedule async handler in main event loop
                            asyncio.run_coroutine_threadsafe(
                                self._handle_change(change),
                                self._loop
                            )
                            
                    except StopIteration:
                        continue
                    except Exception as e:
                        logger.error(f"❌ Error in change stream: {e}")
                        
        except PyMongoError as e:
            logger.error(f"❌ MongoDB change stream error: {e}")
        except Exception as e:
            logger.error(f"❌ Unexpected error in change stream: {e}", exc_info=True)
        finally:
            if self.client:
                self.client.close()
                
    async def _handle_change(self, change):
        """Handle a change event"""
        try:
            operation = change.get('operationType')
            document_key = change.get('documentKey', {})
            
            # Check if the change is relevant (involves skillsTeaching or skillsLearning)
            update_description = change.get('updateDescription', {})
            updated_fields = update_description.get('updatedFields', {})
            full_document = change.get('fullDocument', {})
            
            # Check if user has teaching skills (is a teacher)
            is_teacher_related = (
                'skillsTeaching' in updated_fields or
                full_document.get('skillsTeaching') or
                operation == 'insert' and full_document.get('skillsTeaching')
            )
            
            if is_teacher_related:
                logger.info(f"📝 Detected relevant change: {operation} on user {document_key}")
                await self._schedule_retrain()
            
        except Exception as e:
            logger.error(f"❌ Error handling change: {e}", exc_info=True)
            
    async def _schedule_retrain(self):
        """Schedule a model retraining with cooldown"""
        now = datetime.now()
        
        # Check if we're in cooldown period
        if self.last_retrain_time and (now - self.last_retrain_time) < self.retrain_cooldown:
            if not self.pending_retrain:
                logger.info(f"⏳ Retraining scheduled (cooldown: {self.retrain_cooldown.seconds}s)")
                self.pending_retrain = True
                
                # Schedule for after cooldown
                wait_time = (self.last_retrain_time + self.retrain_cooldown - now).total_seconds()
                asyncio.create_task(self._delayed_retrain(wait_time))
            return
            
        # Retrain immediately
        await self._trigger_retrain()
        
    async def _delayed_retrain(self, delay: float):
        """Retrain after a delay"""
        await asyncio.sleep(delay)
        if self.pending_retrain:
            await self._trigger_retrain()
            
    async def _trigger_retrain(self):
        """Trigger actual model retraining (non-blocking)"""
        # Run retraining in background to avoid blocking
        asyncio.create_task(self._retrain_background())
        
    async def _retrain_background(self):
        """Background task for retraining"""
        try:
            logger.info("🎓 Auto-retraining models due to database changes...")
            self.pending_retrain = False
            self.last_retrain_time = datetime.now()
            
            # Import here to avoid circular dependency
            from database import db
            
            # Fetch latest data
            teachers_data = await db.get_all_teachers()
            ratings_data = []  # No ratings needed for content-based
            
            if not teachers_data:
                logger.warning("⚠️  No teachers found, skipping retrain")
                return
                
            # Train models (this happens in background)
            results = await self.recommendation_engine.train(ratings_data, teachers_data)
            
            if results.get('content_based'):
                logger.info(f"✅ Auto-retrain successful: {len(teachers_data)} teachers")
            else:
                logger.warning("⚠️  Auto-retrain completed but model may not be trained")
                
        except Exception as e:
            logger.error(f"❌ Auto-retrain failed: {e}", exc_info=True)


# Global instance
change_watcher: Optional[ChangeStreamWatcher] = None


def get_change_watcher(mongo_uri: str, database_name: str) -> ChangeStreamWatcher:
    """Get or create change watcher instance"""
    global change_watcher
    if change_watcher is None:
        change_watcher = ChangeStreamWatcher(mongo_uri, database_name)
    return change_watcher
