'use client';

import { ReactNode, createContext, useContext } from 'react';
import { ModalTheme, ModalThemeName, getModalTheme } from '../lib/modalThemes';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
  theme?: ModalThemeName;
  backgroundClass?: string; // For backward compatibility
}

// Context for sharing theme with child components
const ModalThemeContext = createContext<ModalTheme | null>(null);

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
  showCloseButton = true,
  theme = 'default',
  backgroundClass
}: ModalProps) {
  if (!isOpen) return null;

  // Get theme configuration
  const modalTheme = getModalTheme(theme);
  const finalBackgroundClass = backgroundClass || modalTheme.background;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalThemeContext.Provider value={modalTheme}>
      <div 
        className="fixed inset-0 backdrop-blur-md flex items-center justify-center p-4 z-50"
        onClick={handleBackdropClick}
      >
      <div className={`${finalBackgroundClass} rounded-lg ${maxWidthClasses[maxWidth]} w-full max-h-[90vh] overflow-hidden shadow-xl`}>
        {/* Header */}
        <div className={`px-6 py-4 ${modalTheme.removeBorder ? '' : 'border-b'} flex items-center justify-between`}>
          <h3 className={`text-lg font-medium ${modalTheme.textColor}`}>
            {title}
          </h3>
          {showCloseButton && (
            <button
              onClick={onClose}
              className={modalTheme.textColor === 'text-white' ? 'text-white hover:text-orange-200' : 'text-gray-400 hover:text-gray-600'}
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
    </ModalThemeContext.Provider>
  );
}

// Reusable modal sections
export function ModalBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

export function ModalFooter({ children }: { children: ReactNode }) {
  const theme = useContext(ModalThemeContext);
  const footerClass = theme?.removeBorder 
    ? `px-6 py-4 ${theme.background} flex justify-end space-x-3`
    : 'px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3';
  
  return (
    <div className={footerClass}>
      {children}
    </div>
  );
}

// Export the context hook for other components
export const useModalTheme = () => useContext(ModalThemeContext);