"""
MongoDB Storage for ML Models
Stores trained models in MongoDB to persist across restarts
"""
import logging
import pickle
import base64
from typing import Optional, Dict, Any
from datetime import datetime
from database import db

logger = logging.getLogger(__name__)


class ModelStorage:
    """Store and retrieve ML models from MongoDB"""
    
    def __init__(self):
        self.collection_name = "ml_models"
    
    async def save_model(self, model_name: str, model_data: Any, metadata: Dict = None) -> bool:
        """
        Save a model to MongoDB
        
        Args:
            model_name: Name/identifier for the model (e.g., 'tfidf_vectorizer')
            model_data: The model object (will be pickled)
            metadata: Optional metadata about the model
            
        Returns:
            bool: Success status
        """
        try:
            # Serialize the model
            pickled_data = pickle.dumps(model_data)
            encoded_data = base64.b64encode(pickled_data).decode('utf-8')
            
            # Prepare document
            document = {
                'model_name': model_name,
                'data': encoded_data,
                'metadata': metadata or {},
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            # Upsert (update or insert)
            collection = db.client[db.db_name][self.collection_name]
            await collection.update_one(
                {'model_name': model_name},
                {'$set': document},
                upsert=True
            )
            
            logger.info(f"✅ Model '{model_name}' saved to MongoDB")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error saving model '{model_name}': {e}")
            return False
    
    async def load_model(self, model_name: str) -> Optional[Any]:
        """
        Load a model from MongoDB
        
        Args:
            model_name: Name/identifier for the model
            
        Returns:
            The model object or None if not found
        """
        try:
            collection = db.client[db.db_name][self.collection_name]
            document = await collection.find_one({'model_name': model_name})
            
            if not document:
                logger.info(f"Model '{model_name}' not found in MongoDB")
                return None
            
            # Decode and deserialize
            encoded_data = document['data']
            pickled_data = base64.b64decode(encoded_data.encode('utf-8'))
            model_data = pickle.loads(pickled_data)
            
            logger.info(f"✅ Model '{model_name}' loaded from MongoDB")
            return model_data
            
        except Exception as e:
            logger.error(f"❌ Error loading model '{model_name}': {e}")
            return None
    
    async def model_exists(self, model_name: str) -> bool:
        """Check if a model exists in MongoDB"""
        try:
            collection = db.client[db.db_name][self.collection_name]
            count = await collection.count_documents({'model_name': model_name})
            return count > 0
        except Exception as e:
            logger.error(f"Error checking model existence: {e}")
            return False
    
    async def delete_model(self, model_name: str) -> bool:
        """Delete a model from MongoDB"""
        try:
            collection = db.client[db.db_name][self.collection_name]
            result = await collection.delete_one({'model_name': model_name})
            logger.info(f"✅ Model '{model_name}' deleted from MongoDB")
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting model: {e}")
            return False
    
    async def get_model_metadata(self, model_name: str) -> Optional[Dict]:
        """Get metadata for a model"""
        try:
            collection = db.client[db.db_name][self.collection_name]
            document = await collection.find_one(
                {'model_name': model_name},
                {'metadata': 1, 'created_at': 1, 'updated_at': 1}
            )
            
            if document:
                return {
                    'metadata': document.get('metadata', {}),
                    'created_at': document.get('created_at'),
                    'updated_at': document.get('updated_at')
                }
            return None
            
        except Exception as e:
            logger.error(f"Error getting model metadata: {e}")
            return None


# Global instance
model_storage = ModelStorage()
