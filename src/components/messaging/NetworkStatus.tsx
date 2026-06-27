// src/components/mensajes/NetworkStatus.tsx
import React from 'react';

interface NetworkStatusProps {
  status: 'connected' | 'connecting' | 'disconnected';
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return { text: 'Online', color: 'bg-green-500' };
      case 'connecting':
        return { text: 'Conectando...', color: 'bg-yellow-500' };
      case 'disconnected':
        return { text: 'Offline', color: 'bg-red-500' };
      default:
        return { text: 'Conectando...', color: 'bg-yellow-500' };
    }
  };

  const config = getStatusConfig();

  return (
    <span className="flex items-center space-x-1">
      <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
      <span>{config.text}</span>
    </span>
  );
};