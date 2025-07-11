from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, validator


class FileAttachment(BaseModel):
    """Represents a file attachment in a chat message."""
    id: str = Field(..., description="Unique attachment identifier")
    name: str = Field(..., description="Original filename")
    size: int = Field(..., ge=0, description="File size in bytes")
    mime_type: str = Field(..., description="MIME type of the file")
    type: Literal["image", "audio"] = Field(..., description="Type of attachment")

    @validator('size')
    def validate_size(cls, v):
        """Validate file size (max 10MB)."""
        max_size = 10 * 1024 * 1024  # 10MB
        if v > max_size:
            raise ValueError(f'File size exceeds maximum limit of {max_size} bytes')
        return v

    @validator('mime_type')
    def validate_mime_type(cls, v):
        """Validate MIME type for supported formats."""
        allowed_types = {
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/webm'
        }
        if v not in allowed_types:
            raise ValueError(f'Unsupported MIME type: {v}')
        return v


class ChatMessage(BaseModel):
    """Represents a single message in a chat conversation."""
    role: Literal["user", "assistant"] = Field(..., description="Role of the message sender")
    content: str = Field(..., min_length=1, description="Message content")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now, description="Message timestamp")
    message_id: Optional[str] = Field(None, description="Unique message identifier")
    attachments: Optional[List[FileAttachment]] = Field(default=[], description="File attachments")

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
    message: str = Field(..., min_length=1, description="User message")
    conversation_history: Optional[List[ChatMessage]] = Field(default=[], description="Previous conversation messages")
    model: Optional[str] = Field(default="gemini-2.5-flash", description="AI model to use")
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0, description="Response creativity (0-2)")
    max_tokens: Optional[int] = Field(default=10_000, ge=1, le=28_000, description="Maximum response length")

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

class FunctionCall(BaseModel):
    """Function call information."""
    name: str
    arguments: Dict[str, Any]
    result: Dict[str, Any]

class ChatWithFunctionsRequest(BaseModel):
    """Request model for chat with function calling."""
    message: str = Field(..., min_length=1, description="User message")
    conversation_history: Optional[List[ChatMessage]] = Field(default=[], description="Previous conversation messages")
    model: Optional[str] = Field(default="gemini-2.5-flash", description="AI model to use")
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0, description="Response creativity (0-2)")
    max_tokens: Optional[int] = Field(default=10_000, ge=1, le=28_000, description="Maximum response length")
    max_function_calls: Optional[int] = Field(default=5, ge=1, le=10, description="Maximum function calls per message")
    attachments: Optional[List[FileAttachment]] = Field(default=[], description="File attachments")

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

class ChatWithFunctionsResponse(BaseModel):
    """Response model for chat with function calling."""
    message: str = Field(..., description="The response message from the AI model.")
    function_calls: Optional[List[dict]] = Field(default=None, description="List of function calls made during the conversation.")
    timestamp: datetime = Field(..., description="Timestamp of the response.")
    model: str = Field(..., description="The model used for the response.")
    elapsed_time: float = Field(..., description="Time taken to generate the response.")
    usage: Optional[Dict[str, Any]] = Field(default=None, description="Token usage information.")
    finish_reason: Optional[str] = Field(default=None, description="Reason the model stopped generating tokens.")

class TranscriptionResponse(BaseModel):
    """Response model for audio transcription."""
    transcription: str = Field(..., description="The transcribed text from the audio.")

class FunctionInfo(BaseModel):
    """Information about available functions."""
    name: str
    description: str
    parameters: Dict[str, Any]

class AvailableFunctionsResponse(BaseModel):
    """Response model for available functions."""
    functions: List[FunctionInfo]
    count: int
    timestamp: datetime = Field(default_factory=datetime.now)