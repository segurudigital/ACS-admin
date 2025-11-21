import { useState, useCallback } from 'react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let toastCount = 0;

export function toast({ title, description, variant = 'default' }: {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}) {
  // Simple toast implementation - just console log for now
  // In a real implementation, this would add to a toast context/provider
  if (variant === 'destructive') {
    console.error(`Toast Error: ${title}`, description);
    alert(`Error: ${title}${description ? `\n${description}` : ''}`);
  } else {
    console.log(`Toast: ${title}`, description);
    // For success messages, could use a subtle notification
    if (typeof window !== 'undefined') {
      // Simple success feedback
      const successMsg = `${title}${description ? ` - ${description}` : ''}`;
      console.log(successMsg);
    }
  }
}

// Hook for managing toasts (simplified version)
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${++toastCount}`;
    setToasts((prev) => [...prev, { ...message, id }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    toast: addToast,
    dismiss: removeToast,
  };
}