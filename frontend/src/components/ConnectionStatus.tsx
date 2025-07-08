'use client';

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'connecting';
  onReconnect: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  onReconnect,
}) => {
  if (status === 'connected') return null;

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <WifiOff className="w-5 h-5 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">
            {status === 'connecting' ? 'Connecting to chat service...' : 'Disconnected from chat service'}
          </span>
        </div>

        {status === 'disconnected' && (
          <button
            onClick={onReconnect}
            className="flex items-center space-x-1 text-sm text-yellow-700 hover:text-yellow-900 underline"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reconnect</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;