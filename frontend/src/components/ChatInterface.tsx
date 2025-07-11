'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    testFunctionCalling,
  } = useChat();

  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto bg-white border-x border-gray-200 shadow-lg">
      {/* Header */}
      <ChatHeader
        onClearChat={clearMessages}
        onShowConfig={() => setShowConfig(!showConfig)}
        onTestFunctionCalling={testFunctionCalling}
        showConfig={showConfig}
        connectionStatus={connectionStatus}
        onReconnect={checkConnection}
        enableFunctionCalling={config.enableFunctionCalling}
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
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onRetry={retryLastMessage}
        />
      </div>

      {/* Input */}
      <MessageInput
        onSendMessage={sendMessage}
        disabled={isLoading || connectionStatus !== 'connected'}
        onStopGeneration={stopGeneration}
        isLoading={isLoading}
        enableFunctionCalling={config.enableFunctionCalling}
      />
    </div>
  );
};

export default ChatInterface;