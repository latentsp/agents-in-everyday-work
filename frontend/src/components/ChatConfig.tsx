'use client';

import React from 'react';
import { X } from 'lucide-react';
import { ChatConfig } from '../types/chat';
import { cn } from '../utils/cn';

interface ChatConfigProps {
  config: ChatConfig;
  onConfigChange: (config: Partial<ChatConfig>) => void;
  onClose: () => void;
}

const ChatConfig: React.FC<ChatConfigProps> = ({
  config,
  onConfigChange,
  onClose,
}) => {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Chat Settings</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI Model
          </label>
          <select
            value={config.model}
            onChange={(e) => onConfigChange({ model: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="gemini-flash">Gemini Flash</option>
            <option value="gemini-pro">Gemini Pro</option>
          </select>
        </div>

        {/* Temperature */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temperature: {config.temperature}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={config.temperature}
            onChange={(e) => onConfigChange({ temperature: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Focused</span>
            <span>Creative</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Tokens: {config.maxTokens}
          </label>
          <input
            type="range"
            min="100"
            max="4000"
            step="100"
            value={config.maxTokens}
            onChange={(e) => onConfigChange({ maxTokens: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Short</span>
            <span>Long</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Temperature:</strong> Controls response creativity. Lower values (0-0.5) produce more focused,
          consistent responses. Higher values (1-2) produce more creative, varied responses.
        </p>
      </div>
    </div>
  );
};

export default ChatConfig;