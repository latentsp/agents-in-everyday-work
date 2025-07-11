export interface FileAttachment {
  id: string;
  file: File;
  type: 'image' | 'audio';
  url?: string; // For displaying previews
  name: string;
  size: number;
  mimeType: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  message_id: string;
  attachments?: FileAttachment[]; // Added support for file attachments
}

export interface ChatConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  maxFunctionCalls?: number;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  config: ChatConfig;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

export interface ChatRequest {
  message: string;
  conversation_history?: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatResponse {
  message: string;
  timestamp: string;
  model: string;
  usage?: Record<string, any>;
  finish_reason?: string;
}

export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
}

export interface ChatWithFunctionsRequest {
  message: string;
  conversation_history?: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  max_function_calls?: number;
  attachments?: FileAttachment[]; // Added support for file attachments
}

export interface ChatWithFunctionsResponse {
  message: string;
  function_calls: FunctionCall[];
  timestamp: string;
  model: string;
  elapsed_time: number;
  usage?: Record<string, any>;
  finish_reason?: string;
}

export interface FunctionInfo {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface AvailableFunctionsResponse {
  functions: FunctionInfo[];
  count: number;
  timestamp: string;
}

export interface StreamChunk {
  text: string;
  isComplete: boolean;
}

export interface ApiHealth {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  gemini_connected: boolean;
}

export interface AvailableModels {
  models: string[];
  default_model: string;
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
  code?: string;
  timestamp?: string;
}

export interface MessageStatus {
  id: string;
  status: 'sending' | 'sent' | 'error' | 'streaming';
  error?: string;
}