from typing import Optional

from pydantic import BaseModel


class ChatbotBase(BaseModel):
    name: str
    website: str


class ChatbotCreate(ChatbotBase):
    limit: Optional[int] = 10


class ChatbotSchema(ChatbotBase):
    id: str
    status: str
    free_trial: int
    pagesScraped: int
    monthlyMessages: int
    lastUpdated: str
    createdAt: str
    model: str
    color: Optional[str] = None
    shareSlug: Optional[str] = None
    isPublic: bool = False
    trainingError: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: Optional[str] = None


class WebhookPayload(BaseModel):
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    plan: str
    credits: int
    event_id: Optional[str] = None
