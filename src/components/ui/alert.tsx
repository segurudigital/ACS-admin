import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'warning' | 'info';
  className?: string;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const Alert = ({ 
  children, 
  variant = 'default', 
  className = '' 
}: AlertProps) => {
  const variantStyles = {
    default: 'border-gray-200 bg-white text-gray-900',
    destructive: 'border-red-200 bg-red-50 text-red-900',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    info: 'border-blue-200 bg-blue-50 text-blue-900'
  };

  return (
    <div className={`relative w-full rounded-lg border px-4 py-3 text-sm ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
};

export const AlertDescription = ({ 
  children, 
  className = '' 
}: AlertDescriptionProps) => (
  <div className={`text-sm [&_p]:leading-relaxed ${className}`}>
    {children}
  </div>
);