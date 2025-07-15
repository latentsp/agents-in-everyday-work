'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChatConfig as ChatConfigType } from '../types/chat';
import { apiClient } from '../utils/api';
import { Settings, X, Zap } from 'lucide-react';

interface ChatConfigProps {
  config: ChatConfigType;
  onConfigChange: (config: Partial<ChatConfigType>) => void;
  onClose: () => void;
}

const ChatConfig: React.FC<ChatConfigProps> = ({ config, onConfigChange, onClose }) => {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableFunctions, setAvailableFunctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableModels();
    loadAvailableFunctions();
  }, []);

  const loadAvailableModels = async () => {
    try {
      const response = await apiClient.getAvailableModels();
      setAvailableModels(response.models);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const loadAvailableFunctions = async () => {
    try {
      const response = await apiClient.getAvailableFunctions();
      setAvailableFunctions(response.functions);
    } catch (error) {
      console.error('Failed to load functions:', error);
    }
  };

  const handleConfigChange = (key: keyof ChatConfigType, value: any) => {
    onConfigChange({ [key]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 bg-white border-b border-gray-200"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Chat Configuration</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model
          </label>
          <select
            value={config.model}
            onChange={(e) => handleConfigChange('model', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {availableModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
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
            onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Focused</span>
            <span>Balanced</span>
            <span>Creative</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Tokens
          </label>
          <select
            value={config.maxTokens}
            onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={1000}>1,000 tokens</option>
            <option value={5000}>5,000 tokens</option>
            <option value={10000}>10,000 tokens</option>
            <option value={20000}>20,000 tokens</option>
            <option value={28000}>28,000 tokens (max)</option>
          </select>
        </div>

        {/* Max Function Calls */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Function Calls: {config.maxFunctionCalls}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={config.maxFunctionCalls}
            onChange={(e) => handleConfigChange('maxFunctionCalls', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>
      </div>

      {/* System Prompt */}
      <div className="col-span-1 md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          System Prompt
        </label>
        <textarea
          value={config.systemPrompt || ''}
          onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
          placeholder="Enter system instructions to guide the AI's behavior..."
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
        />
        <p className="text-xs text-gray-500 mt-1">
          Optional instructions that define how the AI should behave and respond
        </p>
      </div>

      {/* Available Functions Section */}
      {availableFunctions.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Available Functions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
            {availableFunctions.map((func) => (
              <div
                key={func.name}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-mono text-blue-600">{func.name}</code>
                </div>
                <p className="text-xs text-gray-600">{func.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Current Configuration</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div>Model: <span className="font-mono">{config.model}</span></div>
          <div>Temperature: <span className="font-mono">{config.temperature}</span></div>
          <div>Max Tokens: <span className="font-mono">{config.maxTokens.toLocaleString()}</span></div>
          <div>Function Calling: <span className="font-mono">Always Enabled</span></div>
          <div>Max Function Calls: <span className="font-mono">{config.maxFunctionCalls}</span></div>
          <div>System Prompt: <span className="font-mono">{config.systemPrompt ? 'Configured' : 'None'}</span></div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatConfig;