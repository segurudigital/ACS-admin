import React from 'react';

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const Dialog = ({ children, open = false, onOpenChange }: DialogProps) => {
  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={() => onOpenChange?.(false)}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md" />
      <div 
        className="relative z-50 bg-white rounded-lg shadow-lg max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export const DialogContent = ({ children, className = '' }: DialogContentProps) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

export const DialogHeader = ({ children, className = '' }: DialogHeaderProps) => (
  <div className={`space-y-2 mb-4 ${className}`}>
    {children}
  </div>
);

export const DialogTitle = ({ children, className = '' }: DialogTitleProps) => (
  <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h2>
);

export const DialogDescription = ({ children, className = '' }: DialogDescriptionProps) => (
  <p className={`text-sm text-gray-600 ${className}`}>
    {children}
  </p>
);

export const DialogFooter = ({ children, className = '' }: DialogFooterProps) => (
  <div className={`flex justify-end space-x-2 mt-6 ${className}`}>
    {children}
  </div>
);