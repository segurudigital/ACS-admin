import { ReactNode } from 'react';
import Card from './Card';

interface PlaceholderCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export default function PlaceholderCard({ 
  title, 
  description, 
  icon,
  actionLabel,
  onAction 
}: PlaceholderCardProps) {
  return (
    <Card>
      <div className="text-center py-12">
        {icon ? (
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            {icon}
          </div>
        ) : (
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )}
        
        <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">{description}</p>
        
        {actionLabel && onAction && (
          <div className="mt-6">
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}