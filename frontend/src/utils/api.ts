import {
  ChatRequest,
  ChatResponse,
  ChatWithFunctionsRequest,
  ChatWithFunctionsResponse,
  AvailableFunctionsResponse,
  StreamChunk,
  ApiHealth,
  AvailableModels,
  ErrorResponse,
  FileAttachment
} from '@/types/chat';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorData: ErrorResponse | null = null;
        try {
          errorData = await response.json();
        } catch {
          // If we can't parse the error response, use default error
        }

        throw new ApiError(
          errorData?.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData?.code
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  async healthCheck(): Promise<ApiHealth> {
    return this.request<ApiHealth>('/health');
  }

  async getAvailableModels(): Promise<AvailableModels> {
    return this.request<AvailableModels>('/models');
  }

  async sendMessage(
    request: ChatWithFunctionsRequest,
    files?: FileAttachment[]
  ): Promise<ChatWithFunctionsResponse> {
    // If files are present, use multipart/form-data
    const formData = new FormData();

    // Add text fields
    formData.append('message', request.message);

    // Convert camelCase properties to snake_case for the backend
    const snakeCaseHistory = (request.conversation_history || []).map(msg => ({
      ...msg,
      attachments: msg.attachments?.map(att => ({
        id: att.id,
        name: att.name,
        size: att.size,
        mime_type: att.mimeType, // Convert to snake_case
        type: att.type,
      })),
    }));

    formData.append('conversation_history', JSON.stringify(snakeCaseHistory));
    formData.append('model', request.model || 'gemini-2.5-flash');
    formData.append('temperature', request.temperature?.toString() || '0.7');
    formData.append('max_tokens', request.max_tokens?.toString() || '10000');
    formData.append('max_function_calls', request.max_function_calls?.toString() || '5');

    // Add files from history
    if (request.conversation_history) {
      request.conversation_history.forEach(msg => {
        if (msg.attachments) {
          msg.attachments.forEach(attachment => {
            if (attachment.file) {
              formData.append('files', attachment.file);
            }
          });
        }
      });
    }

    // Add new files. The 'files' parameter contains files for the current message.
    if (files) {
      files.forEach((attachment) => {
        if (attachment.file) {
          // To avoid duplicates, we could check if the file is already in the form data.
          // However, for simplicity, we'll rely on the backend to handle potential duplicates
          // if the same file is re-attached. The main goal here is to ensure all context is sent.
          formData.append('files', attachment.file);
        }
      });
    }

    const url = `${this.baseUrl}/chat`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let the browser set it with boundary
      });

      if (!response.ok) {
        let errorData: ErrorResponse | null = null;
        try {
          errorData = await response.json();
        } catch {
          // If we can't parse the error response, use default error
        }

        throw new ApiError(
          errorData?.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData?.code
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  async sendTestMessage(): Promise<{ success: boolean; response?: string; error?: string }> {
    return this.request('/chat/test', {
      method: 'POST',
    });
  }



  async getAvailableFunctions(): Promise<AvailableFunctionsResponse> {
    return this.request<AvailableFunctionsResponse>('/functions');
  }

  async testFunctionCalling(): Promise<{ success: boolean; response?: string; function_calls?: any[]; error?: string }> {
    return this.request('/chat/test', {
      method: 'POST',
    });
  }

  async transcribeAudio(
    file: File
  ): Promise<{ transcription: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseUrl}/chat/transcribe`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorData: ErrorResponse | null = null;
        try {
          errorData = await response.json();
        } catch {}

        throw new ApiError(
          errorData?.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData?.code
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export types for convenience
export { ApiError };
export type { ApiClient };