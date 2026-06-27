// FILE: src/components/messaging/NotificationPrompt.tsx
// Notification permission prompt component - FIXED VERSION
// Shows a friendly prompt to enable notifications

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { setupMessageListener } from '@/lib/notification-service';
import { toast } from 'sonner';

export function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkShouldShow();
  }, []);

  const checkShouldShow = () => {
    // ✅ FIXED: Simple, reliable check
    if (!('Notification' in window)) {
      console.log('🔔 [NotificationPrompt] Notifications not supported');
      return;
    }

    const permission = Notification.permission;
    const dismissed = sessionStorage.getItem('notification-prompt-dismissed');

    console.log('🔔 [NotificationPrompt] Permission:', permission, 'Dismissed:', dismissed);

    // Show if permission not asked yet AND user hasn't dismissed this session
    if (permission === 'default' && !dismissed) {
      console.log('🔔 [NotificationPrompt] Will show in 3 seconds');
      setTimeout(() => {
        setShow(true);
        console.log('🔔 [NotificationPrompt] Showing now! ');
      }, 3000);
    } else {
      console.log('🔔 [NotificationPrompt] Not showing:', { permission, dismissed });
    }
  };

  const handleEnable = async () => {
    setLoading(true);
    console.log('🔔 [NotificationPrompt] User clicked Enable');
    
    try {
      const permission = await Notification.requestPermission();
      console.log('🔔 [NotificationPrompt] Permission result:', permission);
      
      if (permission === 'granted') {
        setupMessageListener();
        setShow(false);
        toast.success('✅ Notificaciones activadas');
        console.log('✅ [NotificationPrompt] Success!');
      } else {
        toast.error('❌ Debes permitir notificaciones en tu navegador');
        console.log('❌ [NotificationPrompt] User denied');
      }
    } catch (error) {
      console.error('❌ [NotificationPrompt] Error:', error);
      toast.error('Error al activar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    console.log('🔔 [NotificationPrompt] User dismissed');
    setShow(false);
    sessionStorage.setItem('notification-prompt-dismissed', 'true');
  };

  // ✅ ADDED: Log when component renders
  console.log('🔔 [NotificationPrompt] Rendered - Show:', show);

  if (!show) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-2"
      data-notification-prompt="true"  // ✅ ADDED: For debugging
    >
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">
                Activa las notificaciones
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Recibe mensajes y llamadas al instante, como WhatsApp
              </p>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleEnable}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Activando...' : 'Activar'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  disabled={loading}
                >
                  Después
                </Button>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



export default NotificationPrompt;
