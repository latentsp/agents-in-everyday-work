'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, ChatConfig, ChatState, FunctionCall, FileAttachment } from '../types/chat';
import { apiClient, ApiError } from '../utils/api';
import toast from 'react-hot-toast';

const DEFAULT_CONFIG: ChatConfig = {
  model: 'gemini-2.5-flash',
  temperature: 0.7,
  maxTokens: 10_000,
  maxFunctionCalls: 5,
};

export const useChat = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    config: DEFAULT_CONFIG,
    connectionStatus: 'disconnected',
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Check API connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, connectionStatus: 'connecting' }));
      await apiClient.healthCheck();
      setState(prev => ({ ...prev, connectionStatus: 'connected' }));
    } catch (error) {
      console.error('API connection failed:', error);
      setState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      toast.error('Unable to connect to chat service');
    }
  }, []);

  const handleError = useCallback((error: unknown, userMessage: ChatMessage) => {
    console.error('Chat error:', error);

    let errorMessage = 'An unexpected error occurred. Please try again.';

    if (error instanceof ApiError) {
      if (error.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait a moment before sending another message.';
      } else if (error.status === 0) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = error.message;
      }
    }

    const errorResponse: ChatMessage = {
      role: 'assistant',
      content: `Sorry, I encountered an error: ${errorMessage}`,
      timestamp: new Date().toISOString(),
      message_id: `error-${Date.now()}`,
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, errorResponse],
      error: errorMessage,
    }));

    toast.error(errorMessage);
  }, []);

  const sendUnifiedMessage = useCallback(async (content: string, history: ChatMessage[], userMessage: ChatMessage, files?: FileAttachment[]) => {
    const request = {
      message: content,
      conversation_history: history,
      model: state.config.model,
      temperature: state.config.temperature,
      max_tokens: state.config.maxTokens,
      max_function_calls: state.config.maxFunctionCalls,
      attachments: files || [],
    };

    const response = await apiClient.sendMessage(request, files);

    let assistantContent = response.message;

    // Add function call information if any functions were called
    if (response.function_calls && response.function_calls.length > 0) {
      const functionCallsInfo = response.function_calls.map((fc: FunctionCall) =>
        `\n\n🔧 **Function Called: ${fc.name}**\n` +
        `Parameters: ${JSON.stringify(fc.arguments, null, 2)}\n` +
        `Result: ${JSON.stringify(fc.result, null, 2)}`
      ).join('');

      console.log(functionCallsInfo);
    }

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: assistantContent,
      timestamp: response.timestamp,
      message_id: `assistant-${Date.now()}`,
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, assistantMessage],
    }));
  }, [state.config]);

  const sendMessage = useCallback(async (content: string, files?: FileAttachment[], options?: { customHistory?: ChatMessage[] }) => {
    console.log('[useChat] sendMessage called with:', content, 'files:', files?.length || 0, 'isLoading:', state.isLoading);
    if ((!content.trim() && (!files || files.length === 0)) || state.isLoading) return;

    const history = options?.customHistory ?? state.messages;

    const userMessage: ChatMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      message_id: `user-${Date.now()}`,
      attachments: files || [],
    };

    setState(prev => ({
      ...prev,
      messages: [...history, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      await sendUnifiedMessage(content, history, userMessage, files);
    } catch (error) {
      handleError(error, userMessage);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.config, state.isLoading, state.messages, sendUnifiedMessage, handleError]);

  const testFunctionCalling = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await apiClient.testFunctionCalling();

      if (response.success) {
        toast.success('Function calling test successful!');

        // Add test messages to the chat
        const testUserMessage: ChatMessage = {
          role: 'user',
          content: 'Function calling test: What\'s the weather like in New York? Also, calculate 15 * 7 and tell me what time it is. Finally, convert 100 USD to EUR.',
          timestamp: new Date().toISOString(),
          message_id: `test-user-${Date.now()}`,
        };

        let assistantContent = response.response || '';

        // Add function call information if any functions were called
        if (response.function_calls && response.function_calls.length > 0) {
          const functionCallsInfo = response.function_calls.map((fc: FunctionCall) =>
            `\n\n🔧 **Function Called: ${fc.name}**\n` +
            `Parameters: ${JSON.stringify(fc.arguments, null, 2)}\n` +
            `Result: ${JSON.stringify(fc.result, null, 2)}`
          ).join('');

          assistantContent += functionCallsInfo;
        }

        const testAssistantMessage: ChatMessage = {
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date().toISOString(),
          message_id: `test-assistant-${Date.now()}`,
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, testUserMessage, testAssistantMessage],
        }));
      } else {
        toast.error(`Function calling test failed: ${response.error}`);
      }
    } catch (error) {
      console.error('Function calling test error:', error);
      toast.error('Function calling test failed');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      error: null,
    }));
  }, []);

  const updateConfig = useCallback((newConfig: Partial<ChatConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...newConfig },
    }));
  }, []);

  const retryLastMessage = useCallback(() => {
    const lastUserMessageIndex = state.messages.map(m => m.role).lastIndexOf('user');
    if (lastUserMessageIndex === -1) {
      return;
    }
    const lastUserMessage = state.messages[lastUserMessageIndex];
    const history = state.messages.slice(0, lastUserMessageIndex);

    sendMessage(lastUserMessage.content, lastUserMessage.attachments, { customHistory: history });
  }, [state.messages, sendMessage]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    config: state.config,
    connectionStatus: state.connectionStatus,
    sendMessage,
    clearMessages,
    updateConfig,
    retryLastMessage,
    stopGeneration,
    checkConnection,
    testFunctionCalling,
  };
};