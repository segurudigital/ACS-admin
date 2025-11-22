'use client';

import React from 'react';
import { Switch } from '@/components/ui/switch';

interface PermissionSwitchProps {
  permission: {
    key: string;
    label: string;
    description: string;
    scopes?: string[];
  };
  checked: boolean;
  onToggle: (permission: string) => void;
  disabled?: boolean;
  scope?: string;
  roleLevel?: string;
  saving?: boolean;
}

export function PermissionSwitch({ 
  permission, 
  checked, 
  onToggle, 
  disabled = false,
  scope,
  roleLevel = 'church',
  saving = false
}: PermissionSwitchProps) {
  
  const getScopeDescription = (permissionKey: string): string => {
    if (!scope && !permission.scopes) return '';
    
    const [resource, action] = permissionKey.split('.');
    const actionWithScope = scope ? `${action}:${scope}` : action;
    
    const scopeDescriptions: Record<string, string> = {
      'self': 'Own record only',
      'own': 'Own organization only',
      'subordinate': 'Own organization + sub-organizations',
      'all': 'All organizations (system-wide)',
      'acs_team': 'ACS team members only',
      'acs': 'ACS service context',
      'public': 'Public access',
      'team': 'Team level',
      'region': 'Regional scope'
    };
    
    return scope ? scopeDescriptions[scope] || scope : '';
  };

  const getScopeBadgeColor = (scope: string): string => {
    const colors: Record<string, string> = {
      'self': 'bg-gray-100 text-gray-700',
      'own': 'bg-blue-100 text-blue-700',
      'subordinate': 'bg-green-100 text-green-700',
      'all': 'bg-red-100 text-red-700',
      'acs_team': 'bg-purple-100 text-purple-700',
      'acs': 'bg-orange-100 text-orange-700',
      'public': 'bg-teal-100 text-teal-700',
      'team': 'bg-indigo-100 text-indigo-700',
      'region': 'bg-pink-100 text-pink-700'
    };
    
    return colors[scope] || 'bg-gray-100 text-gray-700';
  };

  const isPermissionElevated = (): boolean => {
    if (!scope) return false;
    
    // Check if this permission scope is above the current role level
    const hierarchyLevels = ['church', 'conference', 'union'];
    const currentLevelIndex = hierarchyLevels.indexOf(roleLevel);
    
    if (scope === 'all' && currentLevelIndex < 2) return true; // Union level required
    if (scope === 'subordinate' && currentLevelIndex < 1) return true; // Conference level required
    
    return false;
  };

  const formatActionName = (key: string): string => {
    const [resource, action] = key.split('.');
    
    const actionNames: Record<string, string> = {
      'create': 'Create',
      'read': 'View/Read',
      'update': 'Edit/Update', 
      'delete': 'Delete',
      'manage': 'Full Management',
      'assign_role': 'Assign Roles',
      'publish': 'Publish',
      'archive': 'Archive',
      'export': 'Export Data',
      'view': 'View Access',
      'configure': 'Configure',
      'backup': 'Backup',
      'audit': 'Audit Logs',
      'impersonate': 'User Impersonation',
      'maintenance': 'System Maintenance'
    };
    
    return actionNames[action] || action.charAt(0).toUpperCase() + action.slice(1);
  };

  const getDescription = (): string => {
    if (permission.description && permission.description !== permission.label) {
      return permission.description;
    }
    
    const [resource, action] = permission.key.split('.');
    const actionName = formatActionName(permission.key).toLowerCase();
    const resourceName = resource.replace('_', ' ');
    
    return `${actionName} ${resourceName}`;
  };

  const scopeDescription = getScopeDescription(permission.key);
  const isElevated = isPermissionElevated();

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
      checked 
        ? 'bg-green-50 border-green-200' 
        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
    } ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-medium text-gray-900">
                {formatActionName(permission.key)}
              </h4>
              
              {scope && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getScopeBadgeColor(scope)}`}>
                  {scope}
                </span>
              )}
              
              {isElevated && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                  ⚡ Elevated
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mt-1">
              {getDescription()}
              {scopeDescription && (
                <span className="text-gray-500"> • {scopeDescription}</span>
              )}
            </p>
            
            {isElevated && (
              <p className="text-xs text-amber-600 mt-1">
                This permission requires elevated role level access
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="ml-4 flex items-center space-x-2">
        {saving && (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
        <Switch
          checked={checked}
          onCheckedChange={() => onToggle(permission.key)}
          disabled={disabled || saving}
          aria-label={`Toggle ${permission.label}`}
        />
      </div>
    </div>
  );
}