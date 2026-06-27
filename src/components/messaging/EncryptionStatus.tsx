import React from 'react';

interface EncryptionStatusProps {
  status: 'verified' | 'verifying' | 'failed';
}

export const EncryptionStatus: React.FC<EncryptionStatusProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return { text: 'Encriptado', color: 'text-green-500' };
      case 'verifying':
        return { text: 'Verificando...', color: 'text-yellow-500' };
      case 'failed':
        return { text: 'No seguro', color: 'text-red-500' };
      default:
        return { text: 'Verificando...', color: 'text-yellow-500' };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`text-sm ${config.color}`}>
      {config.text}
    </span>
  );
};