'use client';

import React, { useMemo } from 'react';
import { ChevronRight, Home, Building, Church, Users, HandHeart } from 'lucide-react';
import { useHierarchicalPermissions } from '@/contexts/HierarchicalPermissionContext';
import { parseHierarchyPath } from '@/lib/hierarchyUtils';

interface BreadcrumbItem {
  id: string;
  name: string;
  type: string;
  level: number;
  path: string;
  icon: React.ReactNode;
}

interface HierarchyBreadcrumbProps {
  className?: string;
  showIcons?: boolean;
  compact?: boolean;
  onNavigate?: (path: string, level: number) => void;
}

export const HierarchyBreadcrumb: React.FC<HierarchyBreadcrumbProps> = ({
  className = '',
  showIcons = true,
  compact = false,
  onNavigate
}) => {
  const { user, currentUnion, currentConference, currentChurch, currentTeam, currentPath } = useHierarchicalPermissions();

  const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
    if (!user || !currentPath) return [];

    const items: BreadcrumbItem[] = [];
    
    // Add root/home item for super admin
    if (user.hierarchyLevel === 0) {
      items.push({
        id: 'root',
        name: 'System',
        type: 'system',
        level: 0,
        path: '',
        icon: <Home className="w-4 h-4" />
      });
    }

    // Parse the current path to build breadcrumb
    const segments = parseHierarchyPath(currentPath);
    
    segments.forEach((segment, index) => {
      let name = segment.id;
      let icon: React.ReactNode = null;
      
      // Determine name and icon based on segment type
      switch (segment.type) {
        case 'conference':
          name = currentOrganization?.name || segment.id;
          icon = <Building className="w-4 h-4" />;
          break;
        case 'church':
          if (index === segments.length - 1 && currentOrganization?.hierarchyLevel === 'church') {
            name = currentOrganization.name;
          }
          icon = <Church className="w-4 h-4" />;
          break;
        case 'team':
          name = currentTeam?.name || segment.id.replace('team_', '');
          icon = <Users className="w-4 h-4" />;
          break;
        case 'service':
          name = segment.id.replace('service_', '');
          icon = <HandHeart className="w-4 h-4" />;
          break;
        default:
          icon = <Building className="w-4 h-4" />;
      }

      const path = segments.slice(0, index + 1).map(s => s.id).join('/');
      
      items.push({
        id: segment.id,
        name,
        type: segment.type || 'unknown',
        level: segment.level,
        path,
        icon
      });
    });

    return items;
  }, [user, currentOrganization, currentTeam, currentPath]);

  if (!user || breadcrumbItems.length === 0) {
    return null;
  }

  const handleClick = (item: BreadcrumbItem) => {
    if (onNavigate) {
      onNavigate(item.path, item.level);
    }
  };

  return (
    <nav 
      className={`flex items-center space-x-1 text-sm ${className}`}
      aria-label="Hierarchy breadcrumb"
    >
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          
          <button
            onClick={() => handleClick(item)}
            className={`
              flex items-center space-x-1 px-2 py-1 rounded-md
              transition-colors duration-150
              ${onNavigate 
                ? 'hover:bg-gray-100 hover:text-gray-900 cursor-pointer' 
                : 'cursor-default'
              }
              ${index === breadcrumbItems.length - 1 
                ? 'text-gray-900 font-medium' 
                : 'text-gray-600'
              }
            `}
            disabled={!onNavigate}
            title={`${item.type}: ${item.name}`}
          >
            {showIcons && item.icon}
            <span className={compact && index < breadcrumbItems.length - 1 ? 'hidden sm:inline' : ''}>
              {item.name}
            </span>
          </button>
        </React.Fragment>
      ))}
      
      {/* Show current level info */}
      {!compact && (
        <span className="ml-2 text-xs text-gray-500">
          (Level {user.hierarchyLevel})
        </span>
      )}
    </nav>
  );
};

// Compact version for mobile or limited space
export const CompactHierarchyBreadcrumb: React.FC<Omit<HierarchyBreadcrumbProps, 'compact'>> = (props) => {
  return <HierarchyBreadcrumb {...props} compact={true} />;
};

// Widget version for dashboard
export const HierarchyBreadcrumbWidget: React.FC = () => {
  const { user, currentLevel, availableLevels } = useHierarchicalPermissions();
  
  if (!user) return null;
  
  const levelNames = ['Super Admin', 'Conference', 'Church', 'Team', 'Service'];
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Hierarchy Context</h3>
      
      <HierarchyBreadcrumb className="mb-3" />
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Current Level:</span>
          <span className="font-medium text-gray-900">
            {levelNames[currentLevel] || `Level ${currentLevel}`}
          </span>
        </div>
        
        {availableLevels.length > 0 && (
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-gray-600">Can Manage:</span>
            <span className="font-medium text-gray-900">
              {availableLevels.map(l => levelNames[l] || `L${l}`).join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};