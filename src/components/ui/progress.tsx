import React from 'react';

interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export const Progress = ({ 
  value = 0, 
  max = 100, 
  className = '',
  indicatorClassName = ''
}: ProgressProps) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className={`relative w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div 
        className={`h-2 rounded-full transition-all duration-300 ease-in-out ${
          indicatorClassName || 'bg-blue-600'
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};