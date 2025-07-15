import asyncio
import logging
import os
import random
import time
from typing import Any, Dict, List

from dotenv import load_dotenv
from fastapi import UploadFile
from google import genai
from google.genai import types

from app.models.chat import ChatMessage
from app.services.tools import FunctionTools

load_dotenv()

logger = logging.getLogger(__name__)


class GeminiServiceError(Exception):
    """Custom exception for Gemini service errors."""
    pass


class GeminiService:
    """Service for interacting with Google's Gemini API using the official SDK."""

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")

        # Initialize GenAI client
        self.client = genai.Client(api_key=self.api_key)

        # Initialize function tools
        self.function_tools = FunctionTools()

        # Available models - will be populated dynamically
        self.models = {}

        # Model name mapping for easier access
        self.model_aliases = {
            "gemini-pro": None,  # Will be set to the latest pro model
            "gemini-flash": None,  # Will be set to the latest flash model
        }

        # Default configuration
        self.default_config = {
            "temperature": 0.7,
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": 1000,
            "candidate_count": 1,
        }

        # Initialize models
        self._initialize_models()

        logger.info("GeminiService initialized successfully (SDK client)")

    def _initialize_models(self):
        """Initialize available models by fetching from the API."""
        try:
            # Fetch all available models from the API
            models_list = list(self.client.models.list())

            # Filter and populate models dictionary with stable Gemini models only
            for model in models_list:
                model_name = model.name
                # Extract the short name (after the last '/')
                short_name = model_name.split('/')[-1] if '/' in model_name else model_name

                # Filter criteria: only include stable Gemini models
                if self._is_stable_gemini_model(short_name):
                    self.models[short_name] = model_name

                    # Set up aliases for common model types (prefer stable models)
                    if 'pro' in short_name.lower() and self.model_aliases["gemini-pro"] is None:
                        self.model_aliases["gemini-pro"] = short_name
                    elif 'flash' in short_name.lower() and self.model_aliases["gemini-flash"] is None:
                        self.model_aliases["gemini-flash"] = short_name

            # Log available models
            logger.info(f"Found {len(self.models)} stable Gemini models: {list(self.models.keys())}")

        except Exception as e:
            logger.warning(f"Failed to fetch models dynamically, using fallback: {str(e)}")
            # Fallback to hardcoded stable models if API call fails
            self.models = {
                "gemini-2.5-pro": "gemini-2.5-pro",
                "gemini-2.5-flash": "gemini-2.5-flash",
                "gemini-2.0-pro": "gemini-2.0-pro",
                "gemini-2.0-flash": "gemini-2.0-flash",
                "gemini-1.5-pro": "gemini-1.5-pro",
                "gemini-1.5-flash": "gemini-1.5-flash",
            }
            self.model_aliases = {
                "gemini-pro": "gemini-2.5-pro",
                "gemini-flash": "gemini-2.5-flash",
            }

    def _is_stable_gemini_model(self, model_name: str) -> bool:
        """Check if a model is a stable Gemini model (not preview/experimental)."""
        model_lower = model_name.lower()

        # Must be a Gemini model
        if not model_lower.startswith('gemini-'):
            return False

        # Exclude preview, experimental, and other unstable variants
        excluded_keywords = [
            'preview', 'exp', 'experimental', 'thinking', 'live',
            'tts', 'native-audio', 'dialog', 'image-generation'
        ]

        for keyword in excluded_keywords:
            if keyword in model_lower:
                return False

        # Exclude vision-only models for chat use
        if 'vision' in model_lower and 'pro-vision' not in model_lower:
            return False

        return True

    def _get_model_name(self, model_name: str = "gemini-flash"):
        """Get the specified model name."""
        # Check if it's an alias first
        if model_name in self.model_aliases and self.model_aliases[model_name]:
            model_name = self.model_aliases[model_name]

        # Check if the model exists
        if model_name not in self.models:
            # Try to find a similar model
            available_models = list(self.models.keys())
            similar_models = [m for m in available_models if model_name.lower() in m.lower()]

            if similar_models:
                logger.warning(f"Model '{model_name}' not found, using '{similar_models[0]}' instead")
                model_name = similar_models[0]
            else:
                raise GeminiServiceError(f"Model '{model_name}' not supported. Available models: {available_models}")

        return self.models[model_name]

    def _format_conversation_history(
        self,
        messages: List[ChatMessage],
        file_content_map: Dict[str, Any] = None
    ) -> (List[types.Content], set):  # type: ignore
        """Convert ChatMessage objects to SDK Content format, including files."""
        formatted = []
        processed_filenames = set()
        file_content_map = file_content_map or {}

        for msg in messages:
            role = "user" if msg.role == "user" else "model"
            parts = []
            if msg.content:
                parts.append(types.Part.from_text(text=msg.content))

            if msg.attachments:
                for attachment in msg.attachments:
                    if attachment.name in file_content_map:
                        content, mime_type = file_content_map[attachment.name]

                        # Add the file part
                        parts.append(types.Part.from_bytes(data=content, mime_type=mime_type))
                        processed_filenames.add(attachment.name)
                        logger.info(f"Added historical attachment '{attachment.name}' to message.")

            if parts:
                formatted.append(types.Content(role=role, parts=parts))

        return formatted, processed_filenames

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
                wait_time = (2 ** attempt) + random.uniform(0, 1)
                logger.warning(f"Attempt {attempt + 1} failed, retrying in {wait_time:.2f}s: {str(e)}")
                await asyncio.sleep(wait_time)

    async def get_chat_response(
        self,
        message: str,
        conversation_history: List[ChatMessage] = None,
        model: str = "gemini-2.5-flash",
        temperature: float = 0.7,
        max_tokens: int = 1000,
        system_prompt: str = None
    ) -> str:
        """Get complete chat response from Gemini API using the SDK."""
        start_time = time.time()

        try:
            if not message.strip():
                raise GeminiServiceError("Message cannot be empty")

            if conversation_history is None:
                conversation_history = []

            model_name = self._get_model_name(model)
            history, _ = self._format_conversation_history(conversation_history)
            generation_config = self._create_generation_config(temperature, max_tokens)

            logger.info(f"Starting chat with model {model_name}, history length: {len(history)}")

            # Prepare contents: history + new message as user
            contents = history + [
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=message)]
                )
            ]

            # Call the SDK's generate_content with proper config
            config_params = {
                "temperature": generation_config["temperature"],
                "top_p": generation_config["top_p"],
                "top_k": generation_config["top_k"],
                "max_output_tokens": generation_config["max_output_tokens"],
                "candidate_count": generation_config["candidate_count"],
            }
            
            # Only add system_instruction if system_prompt is provided
            if system_prompt is not None:
                config_params["system_instruction"] = system_prompt.strip()
            
            response = self.client.models.generate_content(
                model=model_name,
                contents=contents,
                config=types.GenerateContentConfig(**config_params)
            )

            elapsed_time = time.time() - start_time
            logger.info(f"Chat completed in {elapsed_time:.2f}s")

            return response.text

        except Exception as e:
            logger.error(f"Error in get_chat_response: {str(e)}")
            raise GeminiServiceError(f"Failed to get response: {str(e)}")

    async def get_chat_response_with_functions(
        self,
        message: str,
        conversation_history: List[ChatMessage] = None,
        model: str = "gemini-2.5-flash",
        temperature: float = 0.7,
        max_tokens: int = 1000,
        max_function_calls: int = 5,
        files: List[UploadFile] = None,
        system_prompt: str = None
    ) -> Dict[str, Any]:
        """Get chat response with function calling support and file attachments."""
        start_time = time.time()

        try:
            if not message.strip():
                raise GeminiServiceError("Message cannot be empty")

            if conversation_history is None:
                conversation_history = []

            if files is None:
                files = []

            # Create a lookup map for file content from all uploaded files
            file_content_map = {}
            if files:
                for file in files:
                    if file.filename:
                        content = await file.read()
                        await file.seek(0)  # Reset pointer
                        file_content_map[file.filename] = (content, file.content_type)

            model_name = self._get_model_name(model)
            history, processed_filenames = self._format_conversation_history(conversation_history, file_content_map)
            generation_config = self._create_generation_config(temperature, max_tokens)

            logger.info(f"Starting function calling chat with model {model_name}, files: {len(files)}")

            # Prepare the user message parts for the new message
            user_parts = [types.Part.from_text(text=message)]

            # Process file attachments for the new message, skipping those already in history
            for file in files:
                if file.filename and file.filename not in processed_filenames:
                    content, mime_type = file_content_map[file.filename]
                    file_size = len(content)

                    # Validate file size (max 10MB)
                    max_size = 10 * 1024 * 1024
                    if file_size > max_size:
                        raise GeminiServiceError(f"File {file.filename} exceeds maximum size of {max_size} bytes")

                    # Create appropriate part based on file type
                    if mime_type and (mime_type.startswith('image/') or mime_type.startswith('audio/')):
                        part = types.Part.from_bytes(data=content, mime_type=mime_type)
                        user_parts.append(part)
                        logger.info(f"Added new attachment: {file.filename} ({file_size} bytes)")
                    else:
                        logger.warning(f"Unsupported file type for new attachment: {mime_type} for {file.filename}")

            # Prepare contents: history + new message with attachments
            contents = history + [
                types.Content(
                    role="user",
                    parts=user_parts
                )
            ]

            # Get function declarations
            function_declarations = self.function_tools.get_function_declarations()

            # Create the tool
            tool = types.Tool(function_declarations=function_declarations)

            function_calls_made = []
            response_parts = []

            # Main conversation loop with function calling
            for call_count in range(max_function_calls):
                # Call the model with tools
                config_params = {
                    "temperature": generation_config["temperature"],
                    "top_p": generation_config["top_p"],
                    "top_k": generation_config["top_k"],
                    "max_output_tokens": generation_config["max_output_tokens"],
                    "candidate_count": generation_config["candidate_count"],
                    "tools": [tool]
                }

                # Only add system_instruction if system_prompt is provided
                if system_prompt is not None:
                    config_params["system_instruction"] = system_prompt.strip()

                response = self.client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(**config_params)
                )

                # Check if the model wants to call functions
                if response.candidates and response.candidates[0].content.parts:
                    parts = response.candidates[0].content.parts

                    # Check for function calls
                    function_calls_in_response = []
                    text_parts = []

                    for part in parts:
                        if hasattr(part, 'function_call') and part.function_call:
                            function_calls_in_response.append(part.function_call)
                        elif hasattr(part, 'text') and part.text:
                            text_parts.append(part.text)

                    # If there are function calls, execute them
                    if function_calls_in_response:
                        # Add the assistant's response to contents
                        contents.append(
                            types.Content(
                                role="model",
                                parts=parts
                            )
                        )

                        # Execute function calls and prepare responses
                        function_responses = []
                        for func_call in function_calls_in_response:
                            logger.info(f"Executing function: {func_call.name}")

                            # Execute the function
                            function_result = self.function_tools.execute_function(
                                func_call.name,
                                dict(func_call.args) if func_call.args else {}
                            )

                            # Store the function call info
                            function_calls_made.append({
                                "name": func_call.name,
                                "arguments": dict(func_call.args) if func_call.args else {},
                                "result": function_result
                            })

                            # Create function response
                            function_response = types.FunctionResponse(
                                name=func_call.name,
                                response=function_result
                            )
                            function_responses.append(function_response)

                        # Add function responses to contents
                        if function_responses:
                            contents.append(
                                types.Content(
                                    role="user",
                                    parts=[types.Part.from_function_response(name=fr.name, response=fr.response) for fr in function_responses]
                                )
                            )

                        # Continue the loop to get the final response
                        continue

                    else:
                        # No function calls, this is the final response
                        if text_parts:
                            response_parts.extend(text_parts)
                        break

                else:
                    # No response parts, break
                    break

            # Combine all response parts
            final_response = " ".join(response_parts) if response_parts else "I apologize, but I couldn't generate a response."

            elapsed_time = time.time() - start_time
            logger.info(f"Function calling chat completed in {elapsed_time:.2f}s with {len(function_calls_made)} function calls")

            return {
                "message": final_response,
                "function_calls": function_calls_made,
                "model": model,
                "elapsed_time": elapsed_time
            }

        except Exception as e:
            logger.error(f"Error in get_chat_response_with_functions: {str(e)}")
            raise GeminiServiceError(f"Failed to get response with functions: {str(e)}")

    async def transcribe_audio(self, file: UploadFile) -> str:
        """Transcribes an audio file using Gemini."""
        try:
            logger.info(f"Transcribing audio file: {file.filename}")

            file_content = await file.read()

            # Use a model that is known to be good for transcription.
            # We bypass the regular model fetching to ensure we use a capable model.
            model_name = "gemini-2.5-pro"

            audio_part = types.Part.from_bytes(
                data=file_content,
                mime_type=file.content_type
            )

            prompt = "Please transcribe the following audio: "

            contents = [
                types.Content(role="user", parts=[types.Part.from_text(text=prompt)]),
                types.Content(role="user", parts=[audio_part])
            ]

            # Using the synchronous client method as the SDK doesn't have async for this yet
            # in the same way as the rest of the library.
            # The FastAPI endpoint is async, so this will run in a threadpool.
            response = self.client.models.generate_content(
                model=model_name,
                contents=contents
            )

            if response.text:
                logger.info("Successfully transcribed audio.")
                return response.text
            else:
                logger.error("Transcription failed: No text in response.")
                raise GeminiServiceError("Transcription failed: No text in response.")

        except Exception as e:
            logger.error(f"Error in transcribe_audio: {str(e)}")
            raise GeminiServiceError(f"Failed to transcribe audio: {str(e)}")

    async def get_available_models(self) -> List[str]:
        """Get list of available models."""
        # Return both the full model names and aliases for user convenience
        all_models = list(self.models.keys())

        # Add aliases that are set
        for alias, model_name in self.model_aliases.items():
            if model_name and alias not in all_models:
                all_models.append(alias)

        return sorted(all_models)

    async def refresh_models(self):
        """Refresh the list of available models."""
        logger.info("Refreshing available models...")
        self._initialize_models()

    async def test_connection(self) -> bool:
        """Test the connection to Gemini API."""
        try:
            response = await self.get_chat_response("Hello", model="gemini-flash")
            return bool(response and len(response) > 0)
        except Exception as e:
            logger.error(f"Connection test failed: {str(e)}")
            return False

    async def get_available_functions(self) -> List[Dict[str, Any]]:
        """Get list of available functions that can be called."""
        function_declarations = self.function_tools.get_function_declarations()

        functions_info = []
        for func_decl in function_declarations:
            func_info = {
                "name": func_decl.name,
                "description": func_decl.description,
                "parameters": {}
            }

            if func_decl.parameters and func_decl.parameters.properties:
                for param_name, param_schema in func_decl.parameters.properties.items():
                    func_info["parameters"][param_name] = {
                        "type": param_schema.type.name if hasattr(param_schema.type, 'name') else str(param_schema.type),
                        "description": param_schema.description,
                        "required": param_name in (func_decl.parameters.required or [])
                    }

                    # Add enum values if they exist
                    if hasattr(param_schema, 'enum') and param_schema.enum:
                        func_info["parameters"][param_name]["enum"] = param_schema.enum

            functions_info.append(func_info)

        return functions_info