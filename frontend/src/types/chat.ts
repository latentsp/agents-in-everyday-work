export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  message_id?: string;
}

export interface ChatRequest {
  message: string;
  conversation_history: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatResponse {
  message: string;
  timestamp: string;
  model: string;
  usage?: {
    model: string;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  finish_reason?: string;
}

export interface ErrorResponse {
  error: string;
  detail?: string;
  timestamp: string;
  code?: string;
}

export interface ApiHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  gemini_connected?: boolean;
}

export interface AvailableModels {
  models: string[];
  default_model: string;
  timestamp: string;
}

export interface ChatConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface MessageStatus {
  id: string;
  status: 'sending' | 'sent' | 'error' | 'streaming';
  error?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  config: ChatConfig;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}