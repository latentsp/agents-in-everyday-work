import asyncio
import logging
import os
import random
import time
from typing import Any, Dict, List

import google.generativeai as genai
from dotenv import load_dotenv

from app.models.chat import ChatMessage

load_dotenv()

logger = logging.getLogger(__name__)


class GeminiServiceError(Exception):
    """Custom exception for Gemini service errors."""
    pass

class GeminiService:
    """Service for interacting with Google's Gemini API."""

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")

        # Configure Gemini
        genai.configure(api_key=self.api_key)

        # for model in genai.list_models():
        #     print(model.name)

        # Available models
        self.models = {
            "gemini-pro": genai.GenerativeModel('models/gemini-2.5-pro'),
            "gemini-flash": genai.GenerativeModel('models/gemini-2.5-flash')
        }

        # Default configuration
        self.default_config = {
            "temperature": 0.7,
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": 1000,
            "candidate_count": 1,
        }

        logger.info("GeminiService initialized successfully")

    def _get_model(self, model_name: str = "gemini-flash"):
        """Get the specified model instance."""
        if model_name not in self.models:
            raise GeminiServiceError(f"Model '{model_name}' not supported")
        return self.models[model_name]

    def _format_conversation_history(self, messages: List[ChatMessage]) -> List[dict]:
        """Convert ChatMessage objects to Gemini API format."""
        formatted_messages = []
        for msg in messages:
            role = "user" if msg.role == "user" else "model"
            formatted_messages.append({
                "role": role,
                "parts": [msg.content]
            })
        return formatted_messages

    def _create_generation_config(self, temperature: float = 0.7, max_tokens: int = 1000) -> Dict[str, Any]:
        """Create generation configuration for the model."""
        return {
            "temperature": temperature,
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": max_tokens,
            "candidate_count": 1,
        }

    async def _retry_with_backoff(self, func, *args, max_retries: int = 3, **kwargs):
        """Retry function with exponential backoff."""
        for attempt in range(max_retries):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e

                # Exponential backoff with jitter
                wait_time = (2 ** attempt) + random.uniform(0, 1)
                logger.warning(f"Attempt {attempt + 1} failed, retrying in {wait_time:.2f}s: {str(e)}")
                await asyncio.sleep(wait_time)

    async def get_chat_response(
        self,
        message: str,
        conversation_history: List[ChatMessage] = None,
        model: str = "gemini-flash",
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> str:
        """Get complete chat response from Gemini API."""
        start_time = time.time()

        try:
            # Validate inputs
            if not message.strip():
                raise GeminiServiceError("Message cannot be empty")

            if conversation_history is None:
                conversation_history = []

            # Get model instance
            model_instance = self._get_model(model)

            # Format conversation history
            history = self._format_conversation_history(conversation_history)

            # Create generation config
            generation_config = self._create_generation_config(temperature, max_tokens)

            logger.info(f"Starting chat with model {model}, history length: {len(history)}")

            # Start chat with history
            chat = model_instance.start_chat(history=history)

            # Send message and get response
            response = chat.send_message(message, generation_config=generation_config)

            elapsed_time = time.time() - start_time
            logger.info(f"Chat completed in {elapsed_time:.2f}s")

            return response.text

        except Exception as e:
            logger.error(f"Error in get_chat_response: {str(e)}")
            raise GeminiServiceError(f"Failed to get response: {str(e)}")

    async def get_available_models(self) -> List[str]:
        """Get list of available models."""
        return list(self.models.keys())

    async def test_connection(self) -> bool:
        """Test the connection to Gemini API."""
        try:
            # Simple test with a short message
            response = await self.get_chat_response("Hello", model="gemini-flash")
            return bool(response and len(response) > 0)
        except Exception as e:
            logger.error(f"Connection test failed: {str(e)}")
            return False