"""
Pydantic models for request/response validation (Pydantic v2)
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime


class RecommendationRequest(BaseModel):
    """Request model for getting recommendations"""
    student_id: str = Field(..., description="Student ID to get recommendations for")
    limit: int = Field(10, ge=1, le=50, description="Number of recommendations to return")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "student_id": "507f1f77bcf86cd799439011",
                "limit": 10
            }
        }
    )


class TeacherRecommendation(BaseModel):
    """Single teacher recommendation"""
    teacher_id: str = Field(..., description="Teacher ID")
    name: str = Field(..., description="Teacher name")
    score: float = Field(..., ge=0, le=100, description="Recommendation score (0-100)")
    reason: Optional[str] = Field(None, description="Reason for recommendation")
    subjects: List[str] = Field(default_factory=list, description="Subjects taught")
    expertise: List[str] = Field(default_factory=list, description="Areas of expertise")
    average_rating: Optional[float] = Field(None, description="Average rating from students")
    years_of_experience: Optional[int] = Field(None, description="Years of teaching experience")
    
    model_config = ConfigDict(from_attributes=True)


class RecommendationResponse(BaseModel):
    """Response model for recommendations"""
    recommendations: List[TeacherRecommendation]
    student_id: str
    method: str = Field(..., description="collaborative, content-based, or hybrid")
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "recommendations": [
                    {
                        "teacher_id": "507f1f77bcf86cd799439011",
                        "name": "John Doe",
                        "score": 85.5,
                        "reason": "High match based on your learning history",
                        "subjects": ["Python", "Machine Learning"],
                        "expertise": ["AI", "Data Science"],
                        "average_rating": 4.8,
                        "years_of_experience": 5
                    }
                ],
                "student_id": "507f1f77bcf86cd799439012",
                "method": "hybrid",
                "generated_at": "2026-01-05T10:30:00"
            }
        }
    )


class TrainRequest(BaseModel):
    """Request model for training models"""
    force_retrain: bool = Field(False, description="Force retraining even if models exist")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "force_retrain": False
            }
        }
    )


class TrainResponse(BaseModel):
    """Response model for training"""
    success: bool
    message: str
    models_trained: List[str]
    training_stats: Optional[Dict[str, Any]] = None
    trained_at: datetime = Field(default_factory=datetime.utcnow)


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    models_loaded: Dict[str, bool]
    database_connected: bool
