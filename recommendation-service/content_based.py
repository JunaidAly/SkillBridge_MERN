"""
Content-Based Filtering using TF-IDF and Cosine Similarity

Matching runs in BOTH directions off a single implementation:

  direction "learn"  query = my skillsLearning   corpus = teachers' skillsTeaching
                     -> "teachers I can learn from"
  direction "teach"  query = my skillsTeaching   corpus = students' skillsLearning
                     -> "students who want to learn what I teach"

There is deliberately only one vectorise/similarity/normalise code path
(_fit_corpus and _query_corpus). A direction is just a different corpus plus a
different query-text builder - the two text builders below are each used as a
corpus builder in one direction and as the query builder in the other.
"""
import logging
from typing import List, Dict, Optional, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from model_storage import model_storage

logger = logging.getLogger(__name__)

# Direction -> which corpus it searches.
LEARN = 'learn'   # searches the teacher corpus
TEACH = 'teach'   # searches the student corpus
DIRECTIONS = (LEARN, TEACH)

EMPTY_TEACHING_TEXT = "general teaching"
EMPTY_LEARNING_TEXT = "general learning"


class ContentBasedEngine:
    """
    Content-based recommendation engine using TF-IDF and cosine similarity.
    """

    def __init__(self):
        # One corpus per direction. Same structure, same code builds both.
        self.corpora: Dict[str, Optional[Dict]] = {LEARN: None, TEACH: None}

    # ------------------------------------------------------------------ #
    # Text preparation
    # ------------------------------------------------------------------ #

    def prepare_teacher_text(self, user: Dict) -> str:
        """
        Text representation of what a user TEACHES.

        Used as corpus text for the teacher corpus, and as the query text when
        finding students (direction "teach").
        """
        text_parts = []

        # Legacy fields, kept because older documents may still carry them.
        subjects = user.get('subjects', [])
        if subjects:
            text_parts.extend([' '.join(subjects)] * 3)

        expertise = user.get('expertise', [])
        if expertise:
            text_parts.extend([' '.join(expertise)] * 2)

        bio = user.get('bio', '')
        if bio:
            text_parts.append(bio)

        course_descriptions = user.get('courseDescriptions', [])
        if course_descriptions:
            text_parts.extend(course_descriptions)

        # The live schema: User.skillsTeaching
        skills_teaching = user.get('skillsTeaching', [])
        if skills_teaching:
            skills_text = ' '.join([
                s if isinstance(s, str) else s.get('name', '')
                for s in skills_teaching
            ])
            if skills_text.strip():
                text_parts.extend([skills_text] * 2)

        combined_text = ' '.join(text_parts)
        return combined_text.lower().strip() if combined_text else EMPTY_TEACHING_TEXT

    def prepare_student_interests(self, user: Dict) -> str:
        """
        Text representation of what a user wants to LEARN.

        Used as the query text when finding teachers (direction "learn"), and
        as corpus text for the student corpus.
        """
        # Copy: the legacy `interests` list must not be mutated in place.
        interests = list(user.get('interests', []) or [])

        skills_learning = user.get('skillsLearning', [])
        if skills_learning:
            interests.extend([
                s if isinstance(s, str) else s.get('name', '')
                for s in skills_learning
            ])

        interest_text = ' '.join([i for i in interests if i])
        return interest_text.lower().strip() if interest_text else EMPTY_LEARNING_TEXT

    # ------------------------------------------------------------------ #
    # Metadata stored alongside each corpus entry
    # ------------------------------------------------------------------ #

    @staticmethod
    def _teacher_meta(user: Dict) -> Dict:
        return {
            'name': user.get('name', 'Unknown'),
            'subjects': user.get('subjects', []),
            'expertise': user.get('expertise', []),
            'average_rating': user.get('averageRating', user.get('stats', {}).get('avgRating', 0)),
            'years_of_experience': user.get('yearsOfExperience', 0),
            'bio': user.get('bio', ''),
            'skills': user.get('skillsTeaching', []),
        }

    @staticmethod
    def _student_meta(user: Dict) -> Dict:
        return {
            'name': user.get('name', 'Unknown'),
            'bio': user.get('bio', ''),
            # What they want to learn - this is what the card shows.
            'skills': user.get('skillsLearning', []),
            'sessions_learned': user.get('stats', {}).get('sessionsLearned', 0),
        }

    # ------------------------------------------------------------------ #
    # The single shared TF-IDF / similarity implementation
    # ------------------------------------------------------------------ #

    def _fit_corpus(self, documents: List[Dict], text_fn, meta_fn) -> Optional[Dict]:
        """Vectorise a set of user documents into a searchable corpus."""
        texts, ids, data = [], [], {}

        for doc in documents:
            doc_id = str(doc.get('_id', doc.get('id', '')))
            if not doc_id:
                continue
            texts.append(text_fn(doc))
            ids.append(doc_id)
            data[doc_id] = meta_fn(doc)

        if not texts:
            return None

        vectorizer = TfidfVectorizer(
            max_features=500,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.8,
        )
        matrix = vectorizer.fit_transform(texts)

        return {'vectorizer': vectorizer, 'matrix': matrix, 'ids': ids, 'data': data}

    def _query_corpus(self, corpus: Dict, query_text: str, empty_text: str, limit: int) -> List[Tuple[str, float]]:
        """Score every entry in a corpus against one query text."""
        if not query_text or query_text == empty_text:
            # Nothing specific to match on - fall back to a sensible ordering
            # instead of returning noise.
            return self._default_recommendations(corpus, limit)

        query_vector = corpus['vectorizer'].transform([query_text])
        similarities = cosine_similarity(query_vector, corpus['matrix'])[0]

        # A raw score of 0 means the query and this entry share no vocabulary at
        # all. Keeping those just to fill `limit` hands back arbitrary people
        # under a fabricated match percentage - every result came back at an
        # identical 65% that way, because _normalize_scores collapses a flat
        # all-zero array to its midpoint. Dropping them is what makes a genuine
        # "no matches yet" answer possible.
        hits = [(uid, raw) for uid, raw in zip(corpus['ids'], similarities) if raw > 0]
        if not hits:
            return []

        scores = self._normalize_scores(np.array([raw for _, raw in hits]))
        ranked = list(zip([uid for uid, _ in hits], scores))
        ranked.sort(key=lambda x: x[1], reverse=True)
        return ranked[:limit]

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #

    async def train(self, teachers_data: List[Dict], students_data: Optional[List[Dict]] = None) -> bool:
        """
        Build both corpora. Succeeds if at least one direction is usable.

        Raises RuntimeError if the trained model cannot be persisted - see
        save_model below for why that is not swallowed.
        """
        try:
            students_data = students_data or []

            self.corpora[LEARN] = self._fit_corpus(
                teachers_data, self.prepare_teacher_text, self._teacher_meta
            )
            self.corpora[TEACH] = self._fit_corpus(
                students_data, self.prepare_student_interests, self._student_meta
            )

            for direction in DIRECTIONS:
                corpus = self.corpora[direction]
                if corpus:
                    logger.info(
                        f"✅ Trained '{direction}' corpus - "
                        f"{len(corpus['ids'])} users, {corpus['matrix'].shape[1]} features"
                    )
                else:
                    logger.warning(f"⚠️  No data to train the '{direction}' corpus")

        except Exception as e:
            logger.error(f"❌ Error training content-based model: {e}")
            return False

        if not self.is_trained:
            logger.warning("No corpus could be trained")
            return False

        # Deliberately outside the try above: a persistence failure must not be
        # reported as a successful train. The caller turns this into a failed
        # /train response rather than leaving the next restart to quietly load
        # a stale model.
        if not await self.save_model():
            raise RuntimeError(
                "Model trained but could not be saved to MongoDB - the next "
                "restart would load a stale model. Check the service logs."
            )

        return True

    @property
    def is_trained(self) -> bool:
        return any(self.corpora.get(d) for d in DIRECTIONS)

    def is_direction_trained(self, direction: str) -> bool:
        return bool(self.corpora.get(direction))

    def recommend(self, user: Dict, direction: str = LEARN, limit: int = 10) -> List[Tuple[str, float]]:
        """
        Top N matches for `user` in the given direction.

        direction "learn" -> teachers who teach what the user wants to learn
        direction "teach" -> students who want to learn what the user teaches
        """
        if direction not in DIRECTIONS:
            logger.warning(f"Unknown direction '{direction}'")
            return []

        corpus = self.corpora.get(direction)
        if not corpus:
            logger.warning(f"'{direction}' corpus is not trained")
            return []

        try:
            # The mirror: whichever text describes the user's side of the match.
            if direction == LEARN:
                query_text = self.prepare_student_interests(user)
                empty_text = EMPTY_LEARNING_TEXT
            else:
                query_text = self.prepare_teacher_text(user)
                empty_text = EMPTY_TEACHING_TEXT

            results = self._query_corpus(corpus, query_text, empty_text, limit)
            logger.info(f"✅ Generated {len(results)} '{direction}' recommendations")
            return results

        except Exception as e:
            logger.error(f"Error generating '{direction}' recommendations: {e}")
            return []

    def recommend_for_student(self, student: Dict, limit: int = 10) -> List[Tuple[str, float]]:
        """Backwards-compatible alias for the original one-directional call."""
        return self.recommend(student, direction=LEARN, limit=limit)

    def get_user_info(self, user_id: str, direction: str = LEARN) -> Optional[Dict]:
        corpus = self.corpora.get(direction)
        return corpus['data'].get(user_id) if corpus else None

    # ------------------------------------------------------------------ #
    # Scoring helpers
    # ------------------------------------------------------------------ #

    def _normalize_scores(self, scores: np.ndarray) -> np.ndarray:
        """
        Spread raw cosine scores into a more realistic 0.30-0.85 band.
        """
        if len(scores) == 0:
            return scores

        scores = np.power(scores, 1.5)

        min_score = np.min(scores)
        max_score = np.max(scores)

        if max_score - min_score > 0:
            normalized = (scores - min_score) / (max_score - min_score)
            normalized = 0.3 + (normalized * 0.55)
        else:
            normalized = np.full_like(scores, 0.65)

        return normalized

    @staticmethod
    def _default_recommendations(corpus: Dict, limit: int) -> List[Tuple[str, float]]:
        """
        Ordering used when the querying user has nothing specific to match on.
        Ranks by rating where one exists, otherwise leaves a neutral score.
        """
        scored = []
        for user_id in corpus['ids']:
            meta = corpus['data'].get(user_id, {})
            rating = meta.get('average_rating', 0) or 0
            scored.append((user_id, min(rating / 5.0, 1.0) if rating > 0 else 0.5))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:limit]

    # ------------------------------------------------------------------ #
    # Persistence
    # ------------------------------------------------------------------ #

    async def save_model(self) -> bool:
        """
        Persist every trained corpus. Returns False if any write failed.

        These writes are awaited rather than fired off as background tasks: a
        silent failure here (disk, permissions, a dropped Mongo connection)
        would leave the in-memory model working while the stored copy went
        stale or missing, and nobody would find out until a restart loaded the
        old model. model_storage.save_model swallows its own exceptions and
        reports a bool, so the result has to be checked explicitly.
        """
        all_saved = True

        for direction in DIRECTIONS:
            corpus = self.corpora.get(direction)
            if not corpus:
                continue

            try:
                written = [
                    await model_storage.save_model(
                        f'tfidf_vectorizer_{direction}',
                        corpus['vectorizer'],
                        {'type': 'TfidfVectorizer', 'users_count': len(corpus['ids'])},
                    ),
                    await model_storage.save_model(
                        f'features_{direction}',
                        corpus['matrix'],
                        {'shape': corpus['matrix'].shape},
                    ),
                    await model_storage.save_model(
                        f'metadata_{direction}',
                        {'ids': corpus['ids'], 'data': corpus['data']},
                        {'users_count': len(corpus['ids'])},
                    ),
                ]
            except Exception as e:
                logger.error(f"❌ Error saving the '{direction}' corpus: {e}")
                all_saved = False
                continue

            if all(written):
                logger.info(f"✅ Saved the '{direction}' corpus to MongoDB")
            else:
                logger.error(f"❌ Failed to persist the '{direction}' corpus")
                all_saved = False

        return all_saved

    async def load_model(self) -> bool:
        """Load whichever corpora are present in MongoDB."""
        try:
            for direction in DIRECTIONS:
                vectorizer = await model_storage.load_model(f'tfidf_vectorizer_{direction}')
                matrix = await model_storage.load_model(f'features_{direction}')
                metadata = await model_storage.load_model(f'metadata_{direction}')

                if vectorizer is None or matrix is None or metadata is None:
                    logger.info(f"No saved '{direction}' corpus found in MongoDB")
                    continue

                self.corpora[direction] = {
                    'vectorizer': vectorizer,
                    'matrix': matrix,
                    'ids': metadata['ids'],
                    'data': metadata['data'],
                }
                logger.info(f"✅ Loaded '{direction}' corpus - {len(metadata['ids'])} users")

            return self.is_trained

        except Exception as e:
            logger.error(f"Error loading content-based model: {e}")
            return False
