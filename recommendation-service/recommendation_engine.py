"""
Content-Based Recommendation Engine
Matches students with teachers based on skills and interests
"""
import logging
from typing import List, Dict, Optional
from content_based import ContentBasedEngine
from models import TeacherRecommendation
from config import settings

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """
    Content-based recommendation system that matches students with teachers
    based on their skills, interests, and teaching expertise.
    """
    
    def __init__(self):
        self.content_based_engine = ContentBasedEngine()
    
    async def train(self, ratings_data: List[Dict], teachers_data: List[Dict]) -> Dict[str, bool]:
        """
        Train content-based recommendation model
        
        Args:
            ratings_data: List of rating documents (not used for content-based)
            teachers_data: List of teacher documents from MongoDB
            
        Returns:
            Dict with training success status
        """
        results = {'content_based': False}
        
        # Train content-based filtering
        if len(teachers_data) >= 1:
            logger.info("=" * 50)
            logger.info("Training Content-Based Filtering Model")
            logger.info("=" * 50)
            results['content_based'] = self.content_based_engine.train(teachers_data)
        else:
            logger.warning("No teacher data available for training")
        
        return results
    
    async def get_recommendations(
        self,
        student_id: str,
        student_data: Dict,
        limit: int = 10,
        excluded_teacher_ids: Optional[List[str]] = None
    ) -> List[TeacherRecommendation]:
        """
        Get content-based recommendations for a student
        
        Matches student interests and learning goals with teacher skills
        and expertise using TF-IDF vectorization and cosine similarity.
        
        Args:
            student_id: Student ID
            student_data: Student document from MongoDB
            limit: Number of recommendations to return
            excluded_teacher_ids: Teacher IDs to exclude
            
        Returns:
            List of TeacherRecommendation objects
        """
        excluded_teacher_ids = excluded_teacher_ids or []
        
        logger.info(f"Generating content-based recommendations for student {student_id}")
        
        # Get content-based recommendations
        recommendations = self.content_based_engine.recommend_for_student(
            student_data,
            limit=limit
        )
        
        # Filter out excluded teachers
        if excluded_teacher_ids:
            recommendations = [
                rec for rec in recommendations 
                if str(rec[0]) not in excluded_teacher_ids
            ]
            recommendations = recommendations[:limit]
        
        # Add reason for each recommendation
        enriched_recommendations = []
        for teacher_id, score in recommendations:
            # Fetch teacher details from content_based_engine.teacher_data
            teacher_data = self.content_based_engine.teacher_data.get(str(teacher_id))
            if teacher_data:
                # Get skills teaching - it's stored as 'skills_teaching' in metadata
                skills_teaching = teacher_data.get('skills_teaching', [])
                enriched_recommendations.append({
                    'teacher_id': str(teacher_id),
                    'name': teacher_data.get('name', 'Unknown'),
                    'score': float(score) * 100,  # Convert to percentage
                    'reason': self._generate_reason(score),
                    'subjects': [skill.get('name', '') if isinstance(skill, dict) else skill for skill in skills_teaching],
                    'expertise': [skill.get('name', '') if isinstance(skill, dict) else skill for skill in skills_teaching],
                    'average_rating': teacher_data.get('average_rating', 0),
                    'years_of_experience': teacher_data.get('years_of_experience')
                })
        
        return enriched_recommendations
    
    def _generate_reason(self, content_score: float) -> str:
        """
        Generate human-readable reason for recommendation
        """
        if content_score >= 0.7:
            return "Excellent match for your learning interests and goals"
        elif content_score >= 0.5:
            return "Good match based on your skills and interests"
        else:
            return "Matches some of your learning interests"
    
    def load_models(self) -> Dict[str, bool]:
        """
        Load pre-trained content-based model from disk
        
        Returns:
            Dict indicating if model was successfully loaded
        """
        results = {'content_based': self.content_based_engine.load_model()}
        return results
    
    def save_models(self) -> Dict[str, bool]:
        """
        Save trained content-based model to disk
        
        Returns:
            Dict indicating if model was successfully saved
        """
        results = {}
        if self.content_based_engine.is_trained:
            results['content_based'] = self.content_based_engine.save_model()
        return results


# Global instance
recommendation_engine = RecommendationEngine()
