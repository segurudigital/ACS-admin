import { ReactNode } from 'react';
import Card from './Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconColor?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  iconColor = 'blue',
  trend,
  onClick 
}: StatsCardProps) {
  const iconColorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600'
  };

  const handleClick = () => {
    if (onClick) onClick();
  };

  return (
    <Card 
      hover={!!onClick}
      className={onClick ? 'cursor-pointer' : ''}
      onClick={handleClick}
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${iconColorClasses[iconColor]}`}>
          <div className="w-6 h-6">
            {icon}
          </div>
        </div>
        
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span className={`ml-2 text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}