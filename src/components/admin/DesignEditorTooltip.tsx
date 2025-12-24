import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface DesignEditorTooltipProps {
  children: React.ReactNode;
  content: string;
  shortcut?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  showIcon?: boolean;
}

export function DesignEditorTooltip({
  children,
  content,
  shortcut,
  side = 'top',
  showIcon = false
}: DesignEditorTooltipProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1">
            {children}
            {showIcon && (
              <HelpCircle className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <div className="space-y-1">
            <p className="text-sm">{content}</p>
            {shortcut && (
              <p className="text-xs text-muted-foreground">
                Shortcut: <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded">{shortcut}</kbd>
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
