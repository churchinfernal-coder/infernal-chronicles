import { useContext } from 'react';
import { MessagingContext } from './MessagingProvider';

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
}