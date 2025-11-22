'use client';

import React from 'react';

interface PermissionBreadcrumbProps {
  roleLevel: string;
  permissionCount: number;
  totalAvailable: number;
}

export function PermissionBreadcrumb({ 
  roleLevel, 
  permissionCount, 
  totalAvailable 
}: PermissionBreadcrumbProps) {
  
  const hierarchyLevels = [
    { id: 'union', name: 'Union', icon: '🏛️', color: 'purple' },
    { id: 'conference', name: 'Conference', icon: '🏢', color: 'blue' },
    { id: 'church', name: 'Church', icon: '⛪', color: 'green' },
    { id: 'team', name: 'Team', icon: '👥', color: 'orange' },
    { id: 'service', name: 'Service', icon: '🤝', color: 'teal' }
  ];

  const getCurrentLevelIndex = () => {
    return hierarchyLevels.findIndex(level => level.id === roleLevel);
  };

  const getLevelColor = (levelId: string, isActive: boolean) => {
    const level = hierarchyLevels.find(l => l.id === levelId);
    const color = level?.color || 'gray';
    
    if (!isActive) {
      return 'bg-gray-100 text-gray-400 border-gray-200';
    }

    const colorMap: Record<string, string> = {
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200', 
      green: 'bg-green-100 text-green-700 border-green-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      teal: 'bg-teal-100 text-teal-700 border-teal-200'
    };

    return colorMap[color] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const currentLevelIndex = getCurrentLevelIndex();
  const completionPercentage = totalAvailable > 0 ? Math.round((permissionCount / totalAvailable) * 100) : 0;

  return (
    <div className="mt-3 space-y-3">
      {/* Hierarchy Breadcrumb */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Hierarchy Level:</span>
        <div className="flex items-center space-x-1">
          {hierarchyLevels.map((level, index) => {
            const isActive = index <= currentLevelIndex;
            const isCurrent = level.id === roleLevel;
            
            return (
              <React.Fragment key={level.id}>
                <div 
                  className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 ${
                    getLevelColor(level.id, isActive)
                  } ${isCurrent ? 'ring-2 ring-offset-1 ring-current ring-opacity-20' : ''}`}
                >
                  <span>{level.icon}</span>
                  <span>{level.name}</span>
                </div>
                
                {index < hierarchyLevels.length - 1 && (
                  <span className="text-gray-300">→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Permission Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Permissions:</span>
            <span className="text-sm font-medium text-gray-900">
              {permissionCount} of {totalAvailable} enabled
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  completionPercentage === 100 
                    ? 'bg-green-500' 
                    : completionPercentage > 50 
                    ? 'bg-blue-500' 
                    : completionPercentage > 0 
                    ? 'bg-yellow-500' 
                    : 'bg-gray-300'
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${
              completionPercentage === 100 
                ? 'text-green-600' 
                : completionPercentage > 50 
                ? 'text-blue-600' 
                : completionPercentage > 0 
                ? 'text-yellow-600' 
                : 'text-gray-500'
            }`}>
              {completionPercentage}%
            </span>
          </div>
        </div>

        {/* Permission Status Badge */}
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          completionPercentage === 100
            ? 'bg-green-100 text-green-800'
            : completionPercentage > 50
            ? 'bg-blue-100 text-blue-800'
            : completionPercentage > 0
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {completionPercentage === 100 
            ? '✅ Fully Configured' 
            : completionPercentage > 50 
            ? '🔧 Partially Configured' 
            : completionPercentage > 0 
            ? '⚠️ Minimally Configured'
            : '❌ Not Configured'}
        </div>
      </div>
    </div>
  );
}