"""
Content-Based Recommendation Engine

Matches users in both directions using one shared similarity engine:
  "learn" -> teachers who teach what this user wants to learn
  "teach" -> students who want to learn what this user teaches
"""
import logging
from typing import List, Dict, Optional
from content_based import ContentBasedEngine, LEARN, TEACH, DIRECTIONS

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """
    Content-based recommendation system built on TF-IDF + cosine similarity.
    """

    def __init__(self):
        self.content_based_engine = ContentBasedEngine()

    async def train(
        self,
        ratings_data: List[Dict],
        teachers_data: List[Dict],
        students_data: Optional[List[Dict]] = None,
    ) -> Dict[str, bool]:
        """
        Train both matching directions.

        `ratings_data` is unused by content-based filtering; it stays in the
        signature because the /train endpoint still reports on it.
        """
        results = {'content_based': False}
        students_data = students_data or []

        if len(teachers_data) >= 1 or len(students_data) >= 1:
            logger.info("=" * 50)
            logger.info("Training Content-Based Filtering Model (both directions)")
            logger.info("=" * 50)
            results['content_based'] = self.content_based_engine.train(teachers_data, students_data)
        else:
            logger.warning("No teacher or student data available for training")

        return results

    async def get_recommendations(
        self,
        student_id: str,
        student_data: Dict,
        limit: int = 10,
        excluded_teacher_ids: Optional[List[str]] = None,
        direction: str = LEARN,
    ) -> List[Dict]:
        """
        Recommendations for one user in one direction.

        Args:
            student_id: the requesting user's id
            student_data: their full user document
            limit: how many to return
            excluded_teacher_ids: ids to drop from the results
            direction: "learn" (find teachers) or "teach" (find students)
        """
        excluded = set(excluded_teacher_ids or [])
        # Never recommend the user to themselves - they sit in the opposite
        # corpus too as soon as they have skills on both sides.
        excluded.add(str(student_id))

        logger.info(f"Generating '{direction}' recommendations for user {student_id}")

        matches = self.content_based_engine.recommend(
            student_data, direction=direction, limit=limit + len(excluded)
        )

        matches = [m for m in matches if str(m[0]) not in excluded][:limit]

        enriched = []
        for user_id, score in matches:
            meta = self.content_based_engine.get_user_info(str(user_id), direction)
            if not meta:
                continue

            # `skills` holds skillsTeaching for the teacher corpus and
            # skillsLearning for the student corpus - the meaning flips with
            # the direction, the shape does not.
            skills = [
                s.get('name', '') if isinstance(s, dict) else s
                for s in meta.get('skills', [])
            ]

            enriched.append({
                'teacher_id': str(user_id),
                'name': meta.get('name', 'Unknown'),
                'score': float(score) * 100,
                'reason': self._generate_reason(score, direction),
                'subjects': skills,
                'expertise': skills,
                'average_rating': meta.get('average_rating', 0),
                'years_of_experience': meta.get('years_of_experience'),
                'sessions_learned': meta.get('sessions_learned'),
            })

        return enriched

    def _generate_reason(self, content_score: float, direction: str = LEARN) -> str:
        """Human-readable reason, worded for the direction being shown."""
        if direction == TEACH:
            if content_score >= 0.7:
                return "Wants to learn exactly what you teach"
            if content_score >= 0.5:
                return "Interested in skills close to what you teach"
            return "Shares some learning interests with your skills"

        if content_score >= 0.7:
            return "Excellent match for your learning interests and goals"
        if content_score >= 0.5:
            return "Good match based on your skills and interests"
        return "Matches some of your learning interests"

    async def load_models(self) -> Dict[str, bool]:
        """Load pre-trained corpora from MongoDB."""
        return {'content_based': await self.content_based_engine.load_model()}

    def save_models(self) -> Dict[str, bool]:
        """Save trained corpora."""
        results = {}
        if self.content_based_engine.is_trained:
            results['content_based'] = self.content_based_engine.save_model()
        return results

    def trained_directions(self) -> Dict[str, bool]:
        return {d: self.content_based_engine.is_direction_trained(d) for d in DIRECTIONS}


# Global instance
recommendation_engine = RecommendationEngine()
