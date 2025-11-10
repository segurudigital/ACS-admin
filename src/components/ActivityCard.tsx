import Card from './Card';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  user?: string;
}

interface ActivityCardProps {
  title: string;
  activities: ActivityItem[];
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export default function ActivityCard({ 
  title, 
  activities, 
  showViewAll = false,
  onViewAll 
}: ActivityCardProps) {
  const typeColors = {
    info: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  };

  return (
    <Card padding="none">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {showViewAll && onViewAll && (
            <button 
              onClick={onViewAll}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All
            </button>
          )}
        </div>
      </div>
      
      <div className="p-6">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${typeColors[activity.type]}`}></div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm text-gray-600">
                    {activity.user && (
                      <span className="font-medium text-gray-900">{activity.user}</span>
                    )}
                    {activity.user ? ' ' : ''}
                    {activity.description}
                  </p>
                  {activity.title !== activity.description && (
                    <p className="text-sm font-medium text-gray-900 mt-1">{activity.title}</p>
                  )}
                </div>
                <span className="ml-3 text-xs text-gray-500 flex-shrink-0">{activity.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}