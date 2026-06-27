import { useEffect, useState } from 'react';

interface TypingStatusProps {
  userName?: string;
  isTyping: boolean;
}

export function TypingStatus({ userName = 'Usuario', isTyping }: TypingStatusProps) {
  const [dots, setDots] = useState('.');

  useEffect(() => {
    if (!isTyping) return;
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.');
    }, 400);
    
    return () => clearInterval(interval);
  }, [isTyping]);

  if (!isTyping) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2">
      <span className="font-medium">{userName}</span>
      <span>está escribiendo{dots}</span>
    </div>
  );
}
