import json
import logging
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.models.chat import (
    AvailableFunctionsResponse,
    ChatMessage,
    ChatWithFunctionsRequest,
    ChatWithFunctionsResponse,
    ErrorResponse,
    FileAttachment,
    FunctionInfo,
    TranscriptionResponse,
)
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
            "default_model": "gemini-2.5-flash",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get models: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve models")


@router.post("/chat", response_model=ChatWithFunctionsResponse)
@limiter.limit("60/minute")
async def chat(
    request: Request,
    message: str = Form(...),
    conversation_history: Optional[str] = Form(default="[]"),
    model: Optional[str] = Form(default="gemini-2.5-flash"),
    temperature: Optional[float] = Form(default=0.7),
    max_tokens: Optional[int] = Form(default=10000),
    max_function_calls: Optional[int] = Form(default=5),
    system_prompt: Optional[str] = Form(default=None),
    files: List[UploadFile] = File(default=[])
):
    """Chat endpoint with function calling support and file upload capability."""
    try:
        logger.info(f"Processing chat request with message: {len(message)} chars, files: {len(files)}")

        # Parse conversation history from JSON string
        try:
            parsed_history = json.loads(conversation_history) if conversation_history else []
            history_messages = [ChatMessage(**msg) for msg in parsed_history]
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Invalid conversation history format: {e}")
            raise HTTPException(status_code=400, detail="Invalid conversation history format")

        # Process uploaded files
        file_attachments = []
        for file in files:
            if file.filename:
                # Validate file type
                content_type = file.content_type or ""
                if not content_type.startswith(('image/', 'audio/')):
                    raise HTTPException(status_code=400, detail=f"Unsupported file type: {content_type}")

                # Create file attachment metadata
                attachment = FileAttachment(
                    id=str(uuid.uuid4()),
                    name=file.filename,
                    size=0,  # Will be set after reading
                    mime_type=content_type,
                    type="image" if content_type.startswith('image/') else "audio"
                )
                file_attachments.append(attachment)

        # Create request object
        chat_request = ChatWithFunctionsRequest(
            message=message,
            conversation_history=history_messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            max_function_calls=max_function_calls,
            attachments=file_attachments,
            system_prompt=system_prompt
        )

        response_data = await gemini_service.get_chat_response_with_functions(
            message=chat_request.message,
            conversation_history=chat_request.conversation_history,
            model=chat_request.model,
            temperature=chat_request.temperature,
            max_tokens=chat_request.max_tokens,
            max_function_calls=chat_request.max_function_calls,
            files=files,  # Pass the actual UploadFile objects
            system_prompt=chat_request.system_prompt
        )

        return ChatWithFunctionsResponse(
            message=response_data["message"],
            function_calls=response_data["function_calls"],
            timestamp=datetime.now(),
            model=response_data["model"],
            elapsed_time=response_data["elapsed_time"],
            usage={"model": response_data["model"]},
            finish_reason="stop"
        )

    except GeminiServiceError as e:
        logger.error(f"Gemini service error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/chat/transcribe", response_model=TranscriptionResponse)
@limiter.limit("60/minute")
async def transcribe_audio(
    request: Request,
    file: UploadFile = File(...)
):
    """Endpoint to transcribe audio files."""
    try:
        if not file.content_type or not file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload an audio file.")

        transcription = await gemini_service.transcribe_audio(file)

        return TranscriptionResponse(transcription=transcription)

    except GeminiServiceError as e:
        logger.error(f"Gemini service error during transcription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in transcribe endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/functions", response_model=AvailableFunctionsResponse)
async def get_available_functions():
    """Get list of available functions that can be called."""
    try:
        functions_data = await gemini_service.get_available_functions()

        functions_info = [
            FunctionInfo(
                name=func["name"],
                description=func["description"],
                parameters=func["parameters"]
            )
            for func in functions_data
        ]

        return AvailableFunctionsResponse(
            functions=functions_info,
            count=len(functions_info),
            timestamp=datetime.now()
        )

    except Exception as e:
        logger.error(f"Failed to get available functions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve available functions")


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