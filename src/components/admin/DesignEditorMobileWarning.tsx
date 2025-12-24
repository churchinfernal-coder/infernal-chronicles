import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Smartphone, Info } from 'lucide-react';

export function DesignEditorMobileWarning() {
  const [show, setShow] = React.useState(true);
  const isMobile = window.innerWidth < 768;

  if (!isMobile || !show) return null;

  return (
    <Alert className="mb-4">
      <Info className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          Mobile Experience
        </span>
        <button 
          onClick={() => setShow(false)}
          className="text-sm underline"
          aria-label="Dismiss message"
        >
          Dismiss
        </button>
      </AlertTitle>
      <AlertDescription>
        For the best experience, we recommend using the Design Editor on a tablet or desktop. 
        Touch gestures: pinch to zoom, two fingers to pan.
      </AlertDescription>
    </Alert>
  );
}
