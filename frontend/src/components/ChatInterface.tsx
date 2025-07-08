'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../hooks/useChat';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import ChatConfig from './ChatConfig';
import ConnectionStatus from './ConnectionStatus';
import { Bot, Settings, X } from 'lucide-react';

const ChatInterface: React.FC = () => {
  const {
    messages,
    isLoading,
    error,
    config,
    connectionStatus,
    sendMessage,
    clearMessages,
    updateConfig,
    retryLastMessage,
    stopGeneration,
    checkConnection,
  } = useChat();

  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto bg-white border-x border-gray-200 shadow-lg">
      {/* Header */}
      <ChatHeader
        onClearChat={clearMessages}
        onShowConfig={() => setShowConfig(!showConfig)}
        showConfig={showConfig}
        connectionStatus={connectionStatus}
        onReconnect={checkConnection}
      />

      {/* Configuration Panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-b border-gray-200 bg-gray-50"
          >
            <ChatConfig
              config={config}
              onConfigChange={updateConfig}
              onClose={() => setShowConfig(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status */}
      {connectionStatus === 'disconnected' && (
        <ConnectionStatus
          status={connectionStatus}
          onReconnect={checkConnection}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-hidden relative">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onRetry={retryLastMessage}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2"
          >
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-lg border">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-sm text-gray-600 ml-2">AI is thinking...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <MessageInput
          onSendMessage={sendMessage}
          onStopGeneration={stopGeneration}
          disabled={isLoading}
          isLoading={isLoading}
        />
      </div>

      {/* Error Toast */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg"
        >
          <div className="flex items-center space-x-2">
            <X className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ChatInterface;