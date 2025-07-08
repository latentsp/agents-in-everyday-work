import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.models.chat import ChatRequest, ChatResponse, ErrorResponse
from app.services.gemini_service import GeminiService, GeminiServiceError

logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

router = APIRouter()
gemini_service = GeminiService()

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Test Gemini connection
        is_connected = await gemini_service.test_connection()
        return {
            "status": "healthy" if is_connected else "degraded",
            "timestamp": datetime.now().isoformat(),
            "service": "llm-chat-api",
            "version": "1.0.0",
            "gemini_connected": is_connected
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@router.get("/models")
async def get_available_models():
    """Get list of available AI models."""
    try:
        models = await gemini_service.get_available_models()
        return {
            "models": models,
            "default_model": "gemini-flash",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get models: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve models")

@router.post("/chat", response_model=ChatResponse)
@limiter.limit("60/minute")
async def chat(
    request: Request,
    chat_request: ChatRequest
):
    """Non-streaming chat endpoint with rate limiting."""
    try:
        logger.info(f"Processing chat request: {len(chat_request.message)} chars")

        response_text = await gemini_service.get_chat_response(
            message=chat_request.message,
            conversation_history=chat_request.conversation_history,
            model=chat_request.model,
            temperature=chat_request.temperature,
            max_tokens=chat_request.max_tokens
        )

        return ChatResponse(
            message=response_text,
            timestamp=datetime.now(),
            model=chat_request.model,
            usage={"model": chat_request.model},
            finish_reason="stop"
        )

    except GeminiServiceError as e:
        logger.error(f"Gemini service error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/chat/test")
async def test_chat():
    """Test endpoint for quick API verification."""
    try:
        test_message = "Hello! This is a test message. Please respond with a simple greeting."
        response_text = await gemini_service.get_chat_response(test_message)

        return {
            "success": True,
            "test_message": test_message,
            "response": response_text,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Test chat failed: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# Error handlers
async def ratelimit_handler(request: Request, exc: RateLimitExceeded):
    """Handle rate limit exceeded errors."""
    return _rate_limit_exceeded_handler(request, exc)

async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    logger.error(f"Unhandled exception: {str(exc)}")
    return ErrorResponse(
        error="Internal server error",
        detail="An unexpected error occurred",
        timestamp=datetime.now(),
        code="INTERNAL_ERROR"
    )