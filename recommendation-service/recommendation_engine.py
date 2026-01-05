"""
Hybrid Recommendation Engine
Combines Collaborative Filtering and Content-Based Filtering
"""
import logging
from typing import List, Dict, Optional
from collaborative_filtering import CollaborativeFilteringEngine
from content_based import ContentBasedEngine
from models import TeacherRecommendation
from config import settings

logger = logging.getLogger(__name__)


class HybridRecommendationEngine:
    """
    Hybrid recommendation system combining collaborative and content-based approaches
    """
    
    def __init__(self):
        self.collaborative_engine = CollaborativeFilteringEngine()
        self.content_based_engine = ContentBasedEngine()
    
    async def train(self, ratings_data: List[Dict], teachers_data: List[Dict]) -> Dict[str, bool]:
        """
        Train both collaborative and content-based models
        
        Args:
            ratings_data: List of rating documents
            teachers_data: List of teacher documents
            
        Returns:
            Dict with training status for each model
        """
        results = {
            'collaborative': False,
            'content_based': False
        }
        
        # Train collaborative filtering
        logger.info("=" * 50)
        logger.info("Training Collaborative Filtering Model")
        logger.info("=" * 50)
        results['collaborative'] = self.collaborative_engine.train(ratings_data)
        
        # Train content-based filtering
        logger.info("=" * 50)
        logger.info("Training Content-Based Filtering Model")
        logger.info("=" * 50)
        results['content_based'] = self.content_based_engine.train(teachers_data)
        
        return results
    
    def load_models(self) -> Dict[str, bool]:
        """
        Load pre-trained models from disk
        
        Returns:
            Dict with load status for each model
        """
        results = {
            'collaborative': self.collaborative_engine.load_model(),
            'content_based': self.content_based_engine.load_model()
        }
        
        logger.info(f"Models loaded - Collaborative: {results['collaborative']}, Content-Based: {results['content_based']}")
        
        return results
    
    async def get_recommendations(
        self,
        student_id: str,
        student_data: Optional[Dict],
        limit: int = 10,
        excluded_teacher_ids: Optional[List[str]] = None
    ) -> List[TeacherRecommendation]:
        """
        Get hybrid recommendations for a student
        
        Strategy:
        1. If student has >= min_ratings: Use hybrid (weighted collaborative + content-based)
        2. If student has < min_ratings: Use content-based only (cold start)
        3. If new teacher: Content-based will handle it naturally
        
        Args:
            student_id: Student ID
            student_data: Student document (with interests)
            limit: Number of recommendations to return
            excluded_teacher_ids: Teacher IDs to exclude (e.g., already rated)
            
        Returns:
            List of TeacherRecommendation objects
        """
        try:
            if excluded_teacher_ids is None:
                excluded_teacher_ids = []
            
            # Check if student has enough ratings for collaborative filtering
            student_rating_count = 0
            if self.collaborative_engine.is_trained:
                try:
                    if student_id in self.collaborative_engine.student_ids:
                        # Student exists in training data
                        inner_id = self.collaborative_engine.trainset.to_inner_uid(student_id)
                        student_rating_count = len(self.collaborative_engine.trainset.ur[inner_id])
                except:
                    pass
            
            logger.info(f"Student {student_id} has {student_rating_count} ratings")
            
            # Decide on recommendation method
            use_collaborative = (
                self.collaborative_engine.is_trained and
                student_rating_count >= settings.min_ratings_for_collaborative
            )
            
            if use_collaborative and self.content_based_engine.is_trained:
                # HYBRID APPROACH
                logger.info("Using HYBRID approach (collaborative + content-based)")
                recommendations = self._hybrid_recommendations(
                    student_id, student_data, limit * 2, excluded_teacher_ids
                )
                method = "hybrid"
            elif self.content_based_engine.is_trained:
                # CONTENT-BASED ONLY (cold start)
                logger.info("Using CONTENT-BASED approach (cold start)")
                recommendations = self._content_based_recommendations(
                    student_data, limit * 2, excluded_teacher_ids
                )
                method = "content-based"
            elif use_collaborative:
                # COLLABORATIVE ONLY (fallback)
                logger.info("Using COLLABORATIVE approach only")
                recommendations = self._collaborative_recommendations(
                    student_id, limit * 2, excluded_teacher_ids
                )
                method = "collaborative"
            else:
                logger.warning("No trained models available")
                return []
            
            # Limit results
            recommendations = recommendations[:limit]
            
            # Add method info to each recommendation
            for rec in recommendations:
                if not rec.reason:
                    rec.reason = self._generate_reason(method, rec.score)
            
            logger.info(f"✅ Returning {len(recommendations)} recommendations using {method}")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return []
    
    def _hybrid_recommendations(
        self,
        student_id: str,
        student_data: Optional[Dict],
        limit: int,
        excluded_ids: List[str]
    ) -> List[TeacherRecommendation]:
        """
        Generate hybrid recommendations by combining scores
        """
        # Get collaborative predictions
        collab_predictions = self.collaborative_engine.predict_for_student(student_id, limit=limit)
        collab_dict = {tid: score for tid, score in collab_predictions}
        
        # Get content-based predictions
        if student_data:
            content_predictions = self.content_based_engine.recommend_for_student(student_data, limit=limit)
        else:
            content_predictions = []
        content_dict = {tid: score for tid, score in content_predictions}
        
        # Combine scores
        all_teacher_ids = set(collab_dict.keys()) | set(content_dict.keys())
        all_teacher_ids -= set(excluded_ids)
        
        hybrid_scores = []
        for teacher_id in all_teacher_ids:
            # Normalize collaborative score (1-5 scale) to 0-1
            collab_score = (collab_dict.get(teacher_id, 2.5) - 1) / 4.0
            # Content-based score is already 0-1
            content_score = content_dict.get(teacher_id, 0.5)
            
            # Weighted combination
            hybrid_score = (
                settings.collaborative_weight * collab_score +
                settings.content_weight * content_score
            )
            
            hybrid_scores.append((teacher_id, hybrid_score))
        
        # Sort by hybrid score
        hybrid_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Convert to TeacherRecommendation objects
        recommendations = []
        for teacher_id, score in hybrid_scores[:limit]:
            rec = self._create_recommendation(teacher_id, score * 100, "hybrid")
            if rec:
                recommendations.append(rec)
        
        return recommendations
    
    def _collaborative_recommendations(
        self,
        student_id: str,
        limit: int,
        excluded_ids: List[str]
    ) -> List[TeacherRecommendation]:
        """Generate collaborative-only recommendations"""
        predictions = self.collaborative_engine.predict_for_student(student_id, limit=limit * 2)
        
        # Filter excluded IDs
        predictions = [(tid, score) for tid, score in predictions if tid not in excluded_ids]
        
        # Convert to recommendations
        recommendations = []
        for teacher_id, rating in predictions[:limit]:
            # Convert rating (1-5) to score (0-100)
            score = ((rating - 1) / 4.0) * 100
            rec = self._create_recommendation(teacher_id, score, "collaborative")
            if rec:
                recommendations.append(rec)
        
        return recommendations
    
    def _content_based_recommendations(
        self,
        student_data: Optional[Dict],
        limit: int,
        excluded_ids: List[str]
    ) -> List[TeacherRecommendation]:
        """Generate content-based-only recommendations"""
        if not student_data:
            student_data = {'interests': []}
        
        predictions = self.content_based_engine.recommend_for_student(student_data, limit=limit * 2)
        
        # Filter excluded IDs
        predictions = [(tid, score) for tid, score in predictions if tid not in excluded_ids]
        
        # Convert to recommendations
        recommendations = []
        for teacher_id, similarity in predictions[:limit]:
            # Convert similarity (0-1) to score (0-100)
            score = similarity * 100
            rec = self._create_recommendation(teacher_id, score, "content-based")
            if rec:
                recommendations.append(rec)
        
        return recommendations
    
    def _create_recommendation(
        self,
        teacher_id: str,
        score: float,
        method: str
    ) -> Optional[TeacherRecommendation]:
        """
        Create TeacherRecommendation object from teacher ID and score
        """
        # Get teacher info from content-based engine (has metadata)
        teacher_info = self.content_based_engine.get_teacher_info(teacher_id)
        
        if not teacher_info:
            logger.warning(f"No info found for teacher {teacher_id}")
            return None
        
        # Extract skills teaching
        skills_teaching = teacher_info.get('skills_teaching', [])
        subjects = teacher_info.get('subjects', [])
        
        # Combine subjects
        all_subjects = list(subjects)
        for skill in skills_teaching:
            if isinstance(skill, str):
                all_subjects.append(skill)
            elif isinstance(skill, dict):
                all_subjects.append(skill.get('name', ''))
        
        return TeacherRecommendation(
            teacher_id=teacher_id,
            name=teacher_info.get('name', 'Unknown'),
            score=round(score, 2),
            reason=self._generate_reason(method, score),
            subjects=all_subjects,
            expertise=teacher_info.get('expertise', []),
            average_rating=teacher_info.get('average_rating'),
            years_of_experience=teacher_info.get('years_of_experience')
        )
    
    def _generate_reason(self, method: str, score: float) -> str:
        """Generate explanation for recommendation"""
        if method == "hybrid":
            if score >= 80:
                return "Excellent match based on your learning history and interests"
            elif score >= 60:
                return "Good match based on your preferences and similar students"
            else:
                return "Recommended based on your profile"
        elif method == "collaborative":
            if score >= 80:
                return "Highly rated by students with similar interests"
            elif score >= 60:
                return "Recommended based on similar students' choices"
            else:
                return "Popular among learners like you"
        elif method == "content-based":
            if score >= 80:
                return "Excellent match for your learning interests"
            elif score >= 60:
                return "Good match based on your interests"
            else:
                return "Matches some of your learning goals"
        return "Recommended for you"


# Global engine instance
recommendation_engine = HybridRecommendationEngine()
