'use client';

import React from 'react';
import { Settings, Trash2, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface ChatHeaderProps {
  onClearChat: () => void;
  onShowConfig: () => void;
  showConfig: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  onReconnect: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  onClearChat,
  onShowConfig,
  showConfig,
  connectionStatus,
  onReconnect,
}) => {
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center space-x-3">
        <h1 className="text-xl font-semibold text-gray-800">LLM Chat Demo</h1>

        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          {getConnectionIcon()}
          <span className={cn(
            "text-sm font-medium",
            connectionStatus === 'connected' && "text-green-600",
            connectionStatus === 'connecting' && "text-yellow-600",
            connectionStatus === 'disconnected' && "text-red-600"
          )}>
            {getConnectionText()}
          </span>

          {connectionStatus === 'disconnected' && (
            <button
              onClick={onReconnect}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Settings Button */}
        <button
          onClick={onShowConfig}
          className={cn(
            "p-2 rounded-lg transition-colors",
            showConfig
              ? "bg-blue-100 text-blue-600"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          )}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Clear Chat Button */}
        <button
          onClick={onClearChat}
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Clear chat"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;