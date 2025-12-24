import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  category?: string;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook for managing keyboard shortcuts
 * Supports modifier keys (Ctrl, Shift, Alt, Meta/Cmd)
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, preventDefault = true } = options;

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const metaMatch = shortcut.meta ? event.metaKey : true;

      return keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch;
    });

    if (matchingShortcut) {
      if (preventDefault) {
        event.preventDefault();
      }
      matchingShortcut.action();
    }
  }, [shortcuts, enabled, preventDefault]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress, enabled]);

  /**
   * Get formatted shortcut display text
   */
  const getShortcutDisplay = useCallback((shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];
    
    if (shortcut.ctrl) parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.meta && !shortcut.ctrl) parts.push('⌘');
    
    parts.push(shortcut.key.toUpperCase());
    
    return parts.join('+');
  }, []);

  /**
   * Get all shortcuts grouped by category
   */
  const getShortcutsByCategory = useCallback(() => {
    const grouped: Record<string, KeyboardShortcut[]> = {};
    
    shortcuts.forEach(shortcut => {
      const category = shortcut.category || 'General';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(shortcut);
    });
    
    return grouped;
  }, [shortcuts]);

  return {
    getShortcutDisplay,
    getShortcutsByCategory
  };
}

/**
 * Common design editor shortcuts
 */
export const DESIGN_EDITOR_SHORTCUTS: KeyboardShortcut[] = [
  // File operations
  { key: 's', ctrl: true, action: () => {}, description: 'Save project', category: 'File' },
  { key: 'o', ctrl: true, action: () => {}, description: 'Open project', category: 'File' },
  { key: 'e', ctrl: true, action: () => {}, description: 'Export image', category: 'File' },
  
  // Editing
  { key: 'z', ctrl: true, action: () => {}, description: 'Undo', category: 'Edit' },
  { key: 'z', ctrl: true, shift: true, action: () => {}, description: 'Redo', category: 'Edit' },
  { key: 'c', ctrl: true, action: () => {}, description: 'Copy', category: 'Edit' },
  { key: 'v', ctrl: true, action: () => {}, description: 'Paste', category: 'Edit' },
  { key: 'x', ctrl: true, action: () => {}, description: 'Cut', category: 'Edit' },
  { key: 'Delete', action: () => {}, description: 'Delete selected', category: 'Edit' },
  { key: 'Backspace', action: () => {}, description: 'Delete selected', category: 'Edit' },
  
  // Tools
  { key: 'v', action: () => {}, description: 'Select tool', category: 'Tools' },
  { key: 'b', action: () => {}, description: 'Brush tool', category: 'Tools' },
  { key: 'e', action: () => {}, description: 'Eraser tool', category: 'Tools' },
  { key: 't', action: () => {}, description: 'Text tool', category: 'Tools' },
  { key: 'r', action: () => {}, description: 'Rectangle tool', category: 'Tools' },
  { key: 'c', action: () => {}, description: 'Circle tool', category: 'Tools' },
  
  // View
  { key: '+', ctrl: true, action: () => {}, description: 'Zoom in', category: 'View' },
  { key: '-', ctrl: true, action: () => {}, description: 'Zoom out', category: 'View' },
  { key: '0', ctrl: true, action: () => {}, description: 'Reset zoom', category: 'View' },
  { key: '1', ctrl: true, action: () => {}, description: 'Fit to screen', category: 'View' },
  
  // Layers
  { key: 'ArrowUp', ctrl: true, action: () => {}, description: 'Move layer up', category: 'Layers' },
  { key: 'ArrowDown', ctrl: true, action: () => {}, description: 'Move layer down', category: 'Layers' },
  { key: 'g', ctrl: true, action: () => {}, description: 'Group layers', category: 'Layers' },
  { key: 'g', ctrl: true, shift: true, action: () => {}, description: 'Ungroup layers', category: 'Layers' },
  
  // Misc
  { key: '?', ctrl: true, action: () => {}, description: 'Show shortcuts', category: 'Help' },
  { key: 'h', ctrl: true, action: () => {}, description: 'Hide/Show panels', category: 'View' },
];
