import { ReactNode } from 'react';
import Card from './Card';

interface ActionButton {
  id: string;
  label: string;
  icon: ReactNode;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'indigo';
  onClick: () => void;
}

interface ActionCardProps {
  title: string;
  description?: string;
  actions: ActionButton[];
  layout?: 'grid' | 'list';
}

export default function ActionCard({ 
  title, 
  description,
  actions, 
  layout = 'grid' 
}: ActionCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    green: 'bg-green-50 text-green-700 hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    yellow: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
    red: 'bg-red-50 text-red-700 hover:bg-red-100',
    indigo: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
  };

  const layoutClasses = {
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    list: 'space-y-2'
  };

  return (
    <Card padding="none">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      
      <div className="p-6">
        <div className={layoutClasses[layout]}>
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`
                flex items-center justify-center px-4 py-3 rounded-lg font-medium text-sm
                transition-colors duration-200
                ${colorClasses[action.color]}
                ${layout === 'list' ? 'justify-start' : 'justify-center'}
              `}
            >
              <div className="w-5 h-5 mr-2 flex-shrink-0">
                {action.icon}
              </div>
              <span className="truncate">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}