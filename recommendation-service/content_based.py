"""
Content-Based Filtering using TF-IDF and Cosine Similarity
"""
import logging
from typing import List, Dict, Optional, Tuple
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import joblib
import os
from config import settings

logger = logging.getLogger(__name__)


class ContentBasedEngine:
    """
    Content-based recommendation engine using TF-IDF and cosine similarity
    """
    
    def __init__(self):
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.teacher_features_matrix = None
        self.teacher_data: Dict[str, Dict] = {}
        self.teacher_ids: List[str] = []
        self.is_trained = False
        self.vectorizer_path = os.path.join(settings.models_storage_path, "tfidf_vectorizer.joblib")
        self.features_path = os.path.join(settings.models_storage_path, "teacher_features.joblib")
        self.metadata_path = os.path.join(settings.models_storage_path, "content_metadata.joblib")
    
    def prepare_teacher_text(self, teacher: Dict) -> str:
        """
        Create text representation of teacher for TF-IDF
        
        Combines: subjects, expertise, bio, courseDescriptions
        
        Args:
            teacher: Teacher document from MongoDB
            
        Returns:
            Combined text string
        """
        text_parts = []
        
        # Add subjects (with higher weight - repeat 3 times)
        subjects = teacher.get('subjects', [])
        if subjects:
            subjects_text = ' '.join(subjects)
            text_parts.extend([subjects_text] * 3)
        
        # Add expertise (with higher weight - repeat 2 times)
        expertise = teacher.get('expertise', [])
        if expertise:
            expertise_text = ' '.join(expertise)
            text_parts.extend([expertise_text] * 2)
        
        # Add bio
        bio = teacher.get('bio', '')
        if bio:
            text_parts.append(bio)
        
        # Add course descriptions
        course_descriptions = teacher.get('courseDescriptions', [])
        if course_descriptions:
            text_parts.extend(course_descriptions)
        
        # Skills teaching (if available from different schema)
        skills_teaching = teacher.get('skillsTeaching', [])
        if skills_teaching:
            skills_text = ' '.join([
                s if isinstance(s, str) else s.get('name', '')
                for s in skills_teaching
            ])
            if skills_text.strip():
                text_parts.extend([skills_text] * 2)
        
        combined_text = ' '.join(text_parts)
        
        return combined_text.lower().strip() if combined_text else "general teaching"
    
    def prepare_student_interests(self, student: Dict) -> str:
        """
        Create text representation of student interests
        
        Args:
            student: Student document from MongoDB
            
        Returns:
            Combined interests text
        """
        interests = student.get('interests', [])
        
        # Also check for skillsLearning
        skills_learning = student.get('skillsLearning', [])
        if skills_learning:
            skills_text = [
                s if isinstance(s, str) else s.get('name', '')
                for s in skills_learning
            ]
            interests.extend(skills_text)
        
        interest_text = ' '.join(interests) if interests else ""
        
        return interest_text.lower().strip() if interest_text else "general learning"
    
    def train(self, teachers_data: List[Dict]) -> bool:
        """
        Train TF-IDF vectorizer on teacher data
        
        Args:
            teachers_data: List of teacher documents from MongoDB
            
        Returns:
            bool: True if training successful
        """
        try:
            if not teachers_data or len(teachers_data) == 0:
                logger.warning("No teachers data provided for content-based filtering")
                return False
            
            logger.info(f"🔄 Training content-based model on {len(teachers_data)} teachers...")
            
            # Prepare teacher documents
            teacher_texts = []
            self.teacher_ids = []
            self.teacher_data = {}
            
            for teacher in teachers_data:
                # Get teacher ID (handle both _id and id fields)
                teacher_id = str(teacher.get('_id', teacher.get('id', '')))
                if not teacher_id:
                    continue
                
                text = self.prepare_teacher_text(teacher)
                teacher_texts.append(text)
                self.teacher_ids.append(teacher_id)
                
                # Store teacher metadata
                self.teacher_data[teacher_id] = {
                    'name': teacher.get('name', 'Unknown'),
                    'subjects': teacher.get('subjects', []),
                    'expertise': teacher.get('expertise', []),
                    'average_rating': teacher.get('averageRating', teacher.get('stats', {}).get('avgRating', 0)),
                    'years_of_experience': teacher.get('yearsOfExperience', 0),
                    'bio': teacher.get('bio', ''),
                    'skills_teaching': teacher.get('skillsTeaching', [])
                }
            
            if not teacher_texts:
                logger.warning("No valid teacher texts to train on")
                return False
            
            # Initialize TF-IDF vectorizer
            self.vectorizer = TfidfVectorizer(
                max_features=500,
                stop_words='english',
                ngram_range=(1, 2),  # Use unigrams and bigrams
                min_df=1,
                max_df=0.8
            )
            
            # Fit and transform teacher texts
            self.teacher_features_matrix = self.vectorizer.fit_transform(teacher_texts)
            
            self.is_trained = True
            
            logger.info(f"✅ Content-based model trained successfully")
            logger.info(f"   Teachers: {len(self.teacher_ids)}")
            logger.info(f"   Features: {self.teacher_features_matrix.shape[1]}")
            
            # Save model
            self.save_model()
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error training content-based model: {e}")
            return False
    
    def recommend_for_student(self, student: Dict, limit: int = 10) -> List[Tuple[str, float]]:
        """
        Get top N teacher recommendations for a student based on interests
        
        Args:
            student: Student document with interests
            limit: Number of recommendations
            
        Returns:
            List of (teacher_id, similarity_score) tuples
        """
        if not self.is_trained or self.vectorizer is None:
            logger.warning("Model not trained, cannot make predictions")
            return []
        
        try:
            # Prepare student interest vector
            student_text = self.prepare_student_interests(student)
            
            if not student_text or student_text == "general learning":
                logger.info("Student has no specific interests, using default recommendations")
                # Return teachers sorted by rating
                return self._get_default_recommendations(limit)
            
            # Transform student interests using trained vectorizer
            student_vector = self.vectorizer.transform([student_text])
            
            # Calculate cosine similarity with all teachers
            similarities = cosine_similarity(student_vector, self.teacher_features_matrix)[0]
            
            # Normalize scores to make them more realistic and varied
            # Apply a scaling function to spread out the scores
            normalized_similarities = self._normalize_scores(similarities)
            
            # Get teacher IDs with scores
            teacher_scores = list(zip(self.teacher_ids, normalized_similarities))
            
            # Sort by similarity (descending)
            teacher_scores.sort(key=lambda x: x[1], reverse=True)
            
            # Return top N
            top_recommendations = teacher_scores[:limit]
            
            logger.info(f"✅ Generated {len(top_recommendations)} content-based recommendations")
            
            return top_recommendations
            
        except Exception as e:
            logger.error(f"Error generating content-based recommendations: {e}")
            return []
    
    def _normalize_scores(self, scores: np.ndarray) -> np.ndarray:
        """
        Normalize similarity scores to make them more realistic and varied
        
        Uses a combination of min-max normalization and power scaling to:
        1. Spread out high similarity scores
        2. Penalize perfect matches slightly
        3. Create more realistic percentage ranges (30-85% instead of 85-95%)
        
        Args:
            scores: Raw cosine similarity scores (0-1)
            
        Returns:
            Normalized scores with better distribution
        """
        if len(scores) == 0:
            return scores
        
        # Apply power transformation to spread out high scores
        # Using power of 1.5 makes high scores (0.9) drop more than low scores (0.3)
        scores = np.power(scores, 1.5)
        
        # Apply min-max normalization to range [0.3, 0.85]
        # This ensures scores are in a more realistic range
        min_score = np.min(scores)
        max_score = np.max(scores)
        
        if max_score - min_score > 0:
            # Normalize to [0, 1] first
            normalized = (scores - min_score) / (max_score - min_score)
            # Scale to [0.3, 0.85] range
            normalized = 0.3 + (normalized * 0.55)
        else:
            # All scores are the same, return middle value
            normalized = np.full_like(scores, 0.65)
        
        return normalized
    
    def _get_default_recommendations(self, limit: int) -> List[Tuple[str, float]]:
        """
        Get default recommendations when student has no interests
        Returns teachers sorted by rating with default scores
        """
        teachers_with_scores = []
        
        for teacher_id in self.teacher_ids:
            teacher = self.teacher_data.get(teacher_id, {})
            rating = teacher.get('average_rating', 0)
            # Use rating as score (normalized to 0-1)
            score = min(rating / 5.0, 1.0) if rating > 0 else 0.5
            teachers_with_scores.append((teacher_id, score))
        
        # Sort by score
        teachers_with_scores.sort(key=lambda x: x[1], reverse=True)
        
        return teachers_with_scores[:limit]
    
    def get_teacher_info(self, teacher_id: str) -> Optional[Dict]:
        """Get stored teacher metadata"""
        return self.teacher_data.get(teacher_id)
    
    def save_model(self):
        """Save trained model to disk"""
        try:
            if self.vectorizer is None or self.teacher_features_matrix is None:
                logger.warning("No model to save")
                return
            
            joblib.dump(self.vectorizer, self.vectorizer_path)
            joblib.dump(self.teacher_features_matrix, self.features_path)
            
            # Save metadata
            metadata = {
                'teacher_ids': self.teacher_ids,
                'teacher_data': self.teacher_data,
                'is_trained': self.is_trained
            }
            joblib.dump(metadata, self.metadata_path)
            
            logger.info(f"✅ Content-based model saved")
            
        except Exception as e:
            logger.error(f"Error saving content-based model: {e}")
    
    def load_model(self) -> bool:
        """Load trained model from disk"""
        try:
            if not all(os.path.exists(p) for p in [self.vectorizer_path, self.features_path, self.metadata_path]):
                logger.info("No saved content-based model found")
                return False
            
            self.vectorizer = joblib.load(self.vectorizer_path)
            self.teacher_features_matrix = joblib.load(self.features_path)
            metadata = joblib.load(self.metadata_path)
            
            self.teacher_ids = metadata['teacher_ids']
            self.teacher_data = metadata['teacher_data']
            self.is_trained = metadata['is_trained']
            
            logger.info(f"✅ Content-based model loaded")
            logger.info(f"   Teachers: {len(self.teacher_ids)}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error loading content-based model: {e}")
            return False
