from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, validator


class ChatMessage(BaseModel):
    """Represents a single message in a chat conversation."""
    role: Literal["user", "assistant"] = Field(..., description="Role of the message sender")
    content: str = Field(..., min_length=1, max_length=10000, description="Message content")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now, description="Message timestamp")
    message_id: Optional[str] = Field(None, description="Unique message identifier")

    @validator('content')
    def validate_content(cls, v):
        """Validate message content."""
        if not v.strip():
            raise ValueError('Message content cannot be empty')
        return v.strip()

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ChatRequest(BaseModel):
    """Request model for chat API endpoints."""
    message: str = Field(..., min_length=1, max_length=5000, description="User message")
    conversation_history: Optional[List[ChatMessage]] = Field(default=[], description="Previous conversation messages")
    model: Optional[str] = Field(default="gemini-flash", description="AI model to use")
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0, description="Response creativity (0-2)")
    max_tokens: Optional[int] = Field(default=1000, ge=1, le=8000, description="Maximum response length")

    @validator('message')
    def validate_message(cls, v):
        """Validate user message."""
        if not v.strip():
            raise ValueError('Message cannot be empty')
        return v.strip()

    @validator('conversation_history')
    def validate_history(cls, v):
        """Validate conversation history."""
        if v is None:
            return []
        if len(v) > 50:  # Limit conversation history to prevent token overflow
            raise ValueError('Conversation history too long (max 50 messages)')
        return v

class ChatResponse(BaseModel):
    """Response model for chat API endpoints."""
    message: str = Field(..., description="AI response message")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")
    model: str = Field(..., description="Model used for response")
    usage: Optional[dict] = Field(None, description="Token usage information")
    finish_reason: Optional[str] = Field(None, description="Reason for response completion")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ErrorResponse(BaseModel):
    """Error response model."""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    timestamp: datetime = Field(default_factory=datetime.now, description="Error timestamp")
    code: Optional[str] = Field(None, description="Error code")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }