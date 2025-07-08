'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, ChatConfig, ChatState } from '../types/chat';
import { apiClient, ApiError } from '../utils/api';
import toast from 'react-hot-toast';

const DEFAULT_CONFIG: ChatConfig = {
  model: 'gemini-flash',
  temperature: 0.7,
  maxTokens: 1000,
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

  const sendMessage = useCallback(async (content: string) => {
    console.log('[useChat] sendMessage called with:', content, 'isLoading:', state.isLoading);
    if (!content.trim() || state.isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      message_id: `user-${Date.now()}`,
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      await sendRegularMessage(content, userMessage);
    } catch (error) {
      handleError(error, userMessage);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.messages, state.config, state.isLoading]);

  const sendRegularMessage = useCallback(async (content: string, userMessage: ChatMessage) => {
    const request = {
      message: content,
      conversation_history: state.messages,
      model: state.config.model,
      temperature: state.config.temperature,
      max_tokens: state.config.maxTokens,
    };

    const response = await apiClient.sendMessage(request);

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: response.message,
      timestamp: response.timestamp,
      message_id: `assistant-${Date.now()}`,
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, assistantMessage],
    }));
  }, [state.messages, state.config]);

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

  const retryLastMessage = useCallback(async () => {
    const lastUserMessage = state.messages
      .filter(msg => msg.role === 'user')
      .pop();

    if (lastUserMessage) {
      // Remove the last assistant message (if it's an error)
      const messagesWithoutLastAssistant = state.messages.filter((msg, index) => {
        if (index === state.messages.length - 1 && msg.role === 'assistant') {
          return false;
        }
        return true;
      });

      setState(prev => ({
        ...prev,
        messages: messagesWithoutLastAssistant,
      }));

      await sendMessage(lastUserMessage.content);
    }
  }, [state.messages, sendMessage]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({ ...prev, isLoading: false }));
  }, []);

  return {
    // State
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    config: state.config,
    connectionStatus: state.connectionStatus,

    // Actions
    sendMessage,
    clearMessages,
    updateConfig,
    retryLastMessage,
    stopGeneration,
    checkConnection,
  };
};