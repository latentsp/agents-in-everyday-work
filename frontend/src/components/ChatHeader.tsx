'use client';

import React from 'react';
import { Bot, Trash2, Settings, Wifi, WifiOff, RefreshCw, Zap } from 'lucide-react';
import { cn } from '../utils/cn';

interface ChatHeaderProps {
  onClearChat: () => void;
  onShowConfig: () => void;
  onTestFunctionCalling?: () => void;
  showConfig: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  onReconnect: () => void;
  enableFunctionCalling?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  onClearChat,
  onShowConfig,
  onTestFunctionCalling,
  showConfig,
  connectionStatus,
  onReconnect,
  enableFunctionCalling = false,
}) => {
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-full">
          <Bot className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">AI Chat Assistant</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
            {enableFunctionCalling && (
              <>
                <span className="text-gray-300">•</span>
                <Zap className="w-3 h-3 text-blue-500" />
                <span className="text-blue-600">Functions Enabled</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Connection Status Button */}
        {connectionStatus === 'disconnected' && (
          <button
            onClick={onReconnect}
            className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
            title="Reconnect"
          >
            <RefreshCw className="w-4 h-4" />
            Reconnect
          </button>
        )}

        {/* Settings Button */}
        <button
          onClick={onShowConfig}
          className={`p-2 rounded-lg transition-colors ${
            showConfig
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Clear Chat Button */}
        <button
          onClick={onClearChat}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Clear Chat"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;