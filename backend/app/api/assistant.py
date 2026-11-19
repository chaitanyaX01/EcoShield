"""Local context-grounded AI Assistant endpoints for EcoShield AI.
"""
from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..services.assistant import answer_assistant_query

router = APIRouter(prefix="/api/assistant", tags=["AI Assistant"])

class ChatMessage(BaseModel):
    query: str = Field(..., min_length=1, description="Question or prompt for the assistant")
    zone_id: Optional[str] = None

@router.post("/chat")
def assistant_chat(payload: ChatMessage) -> Dict[str, Any]:
    return answer_assistant_query(
        question=payload.query,
        zone_id=payload.zone_id
    )

@router.get("/quick-questions")
def quick_questions() -> Dict[str, Any]:
    return {
        "questions": [
            "Which area has the highest risk?",
            "What resources are available?",
            "Where is the safest shelter?",
            "What should we do now?",
            "What is the status in Katraj?",
            "What is the status in Sinhagad Road?"
        ]
    }
