'use client';

import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, StopCircle, Paperclip } from 'lucide-react';
import { cn } from '../utils/cn';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onStopGeneration?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onStopGeneration,
  disabled = false,
  isLoading = false,
}) => {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled && !isComposing) {
      onSendMessage(message);
      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const isSendDisabled = !message.trim() || disabled || isComposing;

  return (
    <div className="flex items-end space-x-3">
      {/* Attachment button (placeholder for future feature) */}
      {/* (Remove this button entirely) */}

      {/* Text input */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
          disabled={disabled}
          className={cn(
            "w-full p-3 pr-12 border border-gray-300 rounded-lg resize-none",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "placeholder:text-gray-400",
            "transition-all duration-200"
          )}
          rows={1}
          style={{ minHeight: '44px', maxHeight: '120px' }}
          aria-label="Message input"
        />

        {/* Character count */}
        {message.length > 0 && (
          <div className="absolute bottom-1 right-2 text-xs text-gray-400">
            {message.length}/5000
          </div>
        )}
      </div>

      {/* Send/Stop button */}
      <button
        onClick={isLoading ? onStopGeneration : handleSend}
        disabled={isLoading ? false : isSendDisabled}
        className={cn(
          "p-3 rounded-lg transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          isLoading
            ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
            : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        aria-label={isLoading ? "Stop generation" : "Send message"}
      >
        {isLoading ? (
          <StopCircle className="w-5 h-5" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

export default MessageInput;