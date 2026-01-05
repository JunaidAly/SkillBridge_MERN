"""
Collaborative Filtering using Surprise library (SVD)
NOTE: scikit-surprise is optional. If not installed, this module will be disabled.
"""
import logging
from typing import List, Dict, Optional, Tuple
import pandas as pd
import numpy as np
import joblib
import os
from config import settings

# Try to import Surprise, but don't fail if it's not available
try:
    from surprise import SVD, Dataset, Reader
    from surprise.model_selection import cross_validate
    SURPRISE_AVAILABLE = True
except ImportError:
    SURPRISE_AVAILABLE = False
    logging.warning("scikit-surprise not installed. Collaborative filtering will be disabled.")

logger = logging.getLogger(__name__)


class CollaborativeFilteringEngine:
    """
    Collaborative filtering recommendation engine using Matrix Factorization (SVD)
    """
    
    def __init__(self):
        self.model: Optional[SVD] = None
        self.trainset = None
        self.teacher_ids: List[str] = []
        self.student_ids: List[str] = []
        self.is_trained = False
        self.model_path = os.path.join(settings.models_storage_path, "collaborative_model.joblib")
        self.metadata_path = os.path.join(settings.models_storage_path, "collaborative_metadata.joblib")
    
    def prepare_data(self, ratings_data: List[Dict]) -> Optional[pd.DataFrame]:
        """
        Convert ratings data to DataFrame format for Surprise
        
        Args:
            ratings_data: List of rating documents from MongoDB
            
        Returns:
            DataFrame with columns: studentId, teacherId, rating
        """
        if not ratings_data:
            logger.warning("No ratings data provided for collaborative filtering")
            return None
        
        try:
            # Convert to DataFrame
            df = pd.DataFrame(ratings_data)
            
            # Convert ObjectId to string if needed
            if '_id' in df.columns:
                df['_id'] = df['_id'].astype(str)
            
            # Handle different ID formats
            if 'studentId' in df.columns:
                df['studentId'] = df['studentId'].astype(str)
            if 'teacherId' in df.columns:
                df['teacherId'] = df['teacherId'].astype(str)
            
            # Ensure required columns exist
            required_cols = ['studentId', 'teacherId', 'rating']
            if not all(col in df.columns for col in required_cols):
                logger.error(f"Missing required columns. Found: {df.columns.tolist()}")
                return None
            
            # Filter to required columns and remove NaN
            df = df[required_cols].dropna()
            
            # Validate ratings are in range 1-5
            df = df[(df['rating'] >= 1) & (df['rating'] <= 5)]
            
            if df.empty:
                logger.warning("No valid ratings data after filtering")
                return None
            
            logger.info(f"✅ Prepared {len(df)} ratings for collaborative filtering")
            logger.info(f"   Students: {df['studentId'].nunique()}, Teachers: {df['teacherId'].nunique()}")
            
            return df
            
        except Exception as e:
            logger.error(f"Error preparing collaborative filtering data: {e}")
            return None
    
    def train(self, ratings_data: List[Dict]) -> bool:
        """
        Train the SVD model on ratings data
        
        Args:
            ratings_data: List of rating documents
            
        Returns:
            bool: True if training successful
        """
        if not SURPRISE_AVAILABLE:
            logger.warning("Cannot train collaborative model: scikit-surprise not installed")
            return False
            
        try:
            # Prepare data
            df = self.prepare_data(ratings_data)
            if df is None or len(df) < 10:
                logger.warning("Insufficient data for collaborative filtering (need at least 10 ratings)")
                return False
            
            # Store unique IDs
            self.student_ids = df['studentId'].unique().tolist()
            self.teacher_ids = df['teacherId'].unique().tolist()
            
            # Define rating scale
            reader = Reader(rating_scale=(1, 5))
            
            # Load data into Surprise format
            data = Dataset.load_from_df(df[['studentId', 'teacherId', 'rating']], reader)
            
            # Train on full dataset
            self.trainset = data.build_full_trainset()
            
            # Initialize and train SVD model
            self.model = SVD(
                n_factors=50,  # Number of latent factors
                n_epochs=20,   # Number of training epochs
                lr_all=0.005,  # Learning rate
                reg_all=0.02,  # Regularization term
                random_state=42
            )
            
            logger.info("🔄 Training SVD model...")
            self.model.fit(self.trainset)
            
            # Evaluate with cross-validation (optional)
            cv_results = cross_validate(self.model, data, measures=['RMSE', 'MAE'], cv=3, verbose=False)
            rmse = np.mean(cv_results['test_rmse'])
            mae = np.mean(cv_results['test_mae'])
            
            logger.info(f"✅ Collaborative model trained successfully")
            logger.info(f"   RMSE: {rmse:.3f}, MAE: {mae:.3f}")
            
            self.is_trained = True
            
            # Save model
            self.save_model()
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error training collaborative model: {e}")
            return False
    
    def predict_for_student(self, student_id: str, limit: int = 10) -> List[Tuple[str, float]]:
        """
        Get top N teacher recommendations for a student
        
        Args:
            student_id: Student ID
            limit: Number of recommendations
            
        Returns:
            List of (teacher_id, predicted_rating) tuples
        """
        if not self.is_trained or self.model is None:
            logger.warning("Model not trained, cannot make predictions")
            return []
        
        try:
            # Get all teachers student hasn't rated yet
            rated_teachers = set()
            
            # Get student's existing ratings from trainset
            try:
                inner_id = self.trainset.to_inner_uid(student_id)
                rated_items = self.trainset.ur[inner_id]
                rated_teachers = {self.trainset.to_raw_iid(item[0]) for item in rated_items}
            except:
                # Student not in training set
                pass
            
            # Get unrated teachers
            unrated_teachers = [tid for tid in self.teacher_ids if tid not in rated_teachers]
            
            if not unrated_teachers:
                logger.info(f"Student {student_id} has rated all teachers")
                return []
            
            # Predict ratings for unrated teachers
            predictions = []
            for teacher_id in unrated_teachers:
                pred = self.model.predict(student_id, teacher_id)
                predictions.append((teacher_id, pred.est))
            
            # Sort by predicted rating (descending)
            predictions.sort(key=lambda x: x[1], reverse=True)
            
            # Return top N
            top_predictions = predictions[:limit]
            
            logger.info(f"✅ Generated {len(top_predictions)} collaborative predictions for student {student_id}")
            
            return top_predictions
            
        except Exception as e:
            logger.error(f"Error generating collaborative predictions: {e}")
            return []
    
    def save_model(self):
        """Save trained model to disk"""
        try:
            if self.model is None:
                logger.warning("No model to save")
                return
            
            joblib.dump(self.model, self.model_path)
            
            # Save metadata
            metadata = {
                'teacher_ids': self.teacher_ids,
                'student_ids': self.student_ids,
                'is_trained': self.is_trained
            }
            joblib.dump(metadata, self.metadata_path)
            
            logger.info(f"✅ Collaborative model saved to {self.model_path}")
            
        except Exception as e:
            logger.error(f"Error saving collaborative model: {e}")
    
    def load_model(self) -> bool:
        """Load trained model from disk"""
        try:
            if not os.path.exists(self.model_path) or not os.path.exists(self.metadata_path):
                logger.info("No saved collaborative model found")
                return False
            
            self.model = joblib.load(self.model_path)
            metadata = joblib.load(self.metadata_path)
            
            self.teacher_ids = metadata['teacher_ids']
            self.student_ids = metadata['student_ids']
            self.is_trained = metadata['is_trained']
            
            logger.info(f"✅ Collaborative model loaded from {self.model_path}")
            logger.info(f"   Teachers: {len(self.teacher_ids)}, Students: {len(self.student_ids)}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error loading collaborative model: {e}")
            return False
