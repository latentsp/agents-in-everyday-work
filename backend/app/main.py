import logging
import os
import time
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.routes import chat_router
from app.routes.chat import general_exception_handler, ratelimit_handler

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("app.log")
        if os.getenv("LOG_TO_FILE", "false").lower() == "true"
        else logging.NullHandler(),
    ],
)

logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting LLM Chat API...")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"Debug mode: {os.getenv('DEBUG', 'false').lower() == 'true'}")

    yield

    # Shutdown
    logger.info("Shutting down LLM Chat API...")


# Create FastAPI app
app = FastAPI(
    title="LLM Chat API",
    description="A FastAPI-based chat service using Google's Gemini API with streaming support",
    version="1.0.0",
    docs_url="/docs"
    if os.getenv("ENVIRONMENT", "development") == "development"
    else None,
    redoc_url="/redoc"
    if os.getenv("ENVIRONMENT", "development") == "development"
    else None,
    lifespan=lifespan,
)

# Add rate limiter to app state
app.state.limiter = limiter

# CORS middleware
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted host middleware (for production)
if os.getenv("ENVIRONMENT") == "production":
    trusted_hosts = os.getenv("TRUSTED_HOSTS", "localhost,127.0.0.1").split(",")
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=trusted_hosts)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests."""
    start_time = time.time()

    # Log request
    logger.info(
        f"Request: {request.method} {request.url.path} from {request.client.host}"
    )

    response = await call_next(request)

    # Log response
    process_time = time.time() - start_time
    logger.info(f"Response: {response.status_code} in {process_time:.3f}s")

    return response


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time to response headers."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Include routers
app.include_router(chat_router, prefix="/api/v1")


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "LLM Chat API is running!",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health",
        "timestamp": time.time(),
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "llm-chat-api",
        "version": "1.0.0",
        "timestamp": time.time(),
    }


# Error handlers
app.add_exception_handler(RateLimitExceeded, ratelimit_handler)
app.add_exception_handler(Exception, general_exception_handler)


# 404 handler
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: Exception):
    """Handle 404 errors."""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not found",
            "detail": f"The requested resource {request.url.path} was not found",
            "timestamp": time.time(),
        },
    )


if __name__ == "__main__":
    import uvicorn

    # Get configuration from environment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "false").lower() == "true"

    logger.info(f"Starting server on {host}:{port}")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=debug,
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
    )
