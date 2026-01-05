"""
MongoDB database connection and operations
"""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, List, Dict, Any
import logging
from config import settings

logger = logging.getLogger(__name__)


class MongoDB:
    """MongoDB connection manager"""
    
    client: Optional[AsyncIOMotorClient] = None
    db = None
    
    async def connect(self):
        """Establish MongoDB connection"""
        try:
            self.client = AsyncIOMotorClient(settings.mongodb_uri)
            self.db = self.client[settings.mongodb_db_name]
            # Test connection
            await self.client.admin.command('ping')
            logger.info("✅ Connected to MongoDB successfully")
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            raise
    
    async def disconnect(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    async def get_all_ratings(self) -> List[Dict[str, Any]]:
        """Fetch all ratings from database"""
        try:
            cursor = self.db.ratings.find({})
            ratings = await cursor.to_list(length=None)
            return ratings
        except Exception as e:
            logger.error(f"Error fetching ratings: {e}")
            return []
    
    async def get_all_teachers(self) -> List[Dict[str, Any]]:
        """Fetch all users who have skillsTeaching (teachers)"""
        try:
            # Teachers are users with skillsTeaching array populated
            cursor = self.db.users.find({
                "skillsTeaching": {"$exists": True, "$ne": []}
            })
            teachers = await cursor.to_list(length=None)
            
            logger.info(f"Found {len(teachers)} teachers with skillsTeaching")
            return teachers
        except Exception as e:
            logger.error(f"Error fetching teachers: {e}")
            return []
    
    async def get_student_by_id(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Fetch student by ID (users with skillsLearning)"""
        try:
            # Try ObjectId conversion
            from bson import ObjectId
            if ObjectId.is_valid(student_id):
                student = await self.db.users.find_one({
                    "_id": ObjectId(student_id),
                    "skillsLearning": {"$exists": True}
                })
                if student:
                    return student
            
            # Try string ID
            student = await self.db.users.find_one({
                "_id": student_id,
                "skillsLearning": {"$exists": True}
            })
            return student
        except Exception as e:
            logger.error(f"Error fetching student {student_id}: {e}")
            return None
    
    async def get_teacher_by_id(self, teacher_id: str) -> Optional[Dict[str, Any]]:
        """Fetch teacher by ID (users with skillsTeaching)"""
        try:
            from bson import ObjectId
            
            # Teachers are users with skillsTeaching array
            if ObjectId.is_valid(teacher_id):
                teacher = await self.db.users.find_one({
                    "_id": ObjectId(teacher_id),
                    "skillsTeaching": {"$exists": True, "$ne": []}
                })
                if teacher:
                    return teacher
            
            teacher = await self.db.users.find_one({
                "_id": teacher_id,
                "skillsTeaching": {"$exists": True, "$ne": []}
            })
            return teacher
        except Exception as e:
            logger.error(f"Error fetching teacher {teacher_id}: {e}")
            return None
    
    async def get_student_ratings(self, student_id: str) -> List[Dict[str, Any]]:
        """Get all ratings given by a specific student"""
        try:
            from bson import ObjectId
            
            query = {"studentId": ObjectId(student_id) if ObjectId.is_valid(student_id) else student_id}
            cursor = self.db.ratings.find(query)
            ratings = await cursor.to_list(length=None)
            return ratings
        except Exception as e:
            logger.error(f"Error fetching student ratings: {e}")
            return []


# Global database instance
db = MongoDB()
