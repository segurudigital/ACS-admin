'use client';

import React from 'react';
import { PermissionSwitch } from './PermissionSwitch';
import { Switch } from '@/components/ui/switch';

interface Permission {
  key: string;
  label: string;
  description: string;
  scopes?: string[];
}

interface Category {
  id: string;
  name: string;
  description: string;
  level: string;
}

interface PermissionCategoryProps {
  category: Category;
  permissions: Permission[];
  hasPermission: (permission: string) => boolean;
  togglePermission: (permission: string) => void;
  toggleCategoryPermissions: (category: string, enable: boolean) => void;
  hasAnyPermission: boolean;
  hasAllPermissions: boolean;
  isReadOnly: boolean;
  savingPermissions?: Set<string>;
}

export function PermissionCategory({
  category,
  permissions,
  hasPermission,
  togglePermission,
  toggleCategoryPermissions,
  hasAnyPermission,
  hasAllPermissions,
  isReadOnly,
  savingPermissions = new Set()
}: PermissionCategoryProps) {

  // Simplified styling without colors
  const getSimpleClasses = () => ({
    border: 'border-gray-200',
    bg: 'bg-white', 
    header: 'bg-gray-50'
  });

  const getLevelBadgeColor = () => 'bg-gray-100 text-gray-700 border-gray-200';

  // Group permissions by action type
  const groupedPermissions = permissions.reduce((groups, permission) => {
    const [, actionWithScope] = permission.key.split('.');
    const [action, scope] = actionWithScope?.includes(':') 
      ? actionWithScope.split(':') 
      : [actionWithScope, null];
    
    if (!groups[action]) {
      groups[action] = [];
    }
    
    groups[action].push({
      ...permission,
      scope: scope || undefined
    });
    
    return groups;
  }, {} as Record<string, Array<Permission & { scope?: string }>>);

  const actionOrder = ['read', 'create', 'update', 'delete', 'manage', 'assign_role', 'publish', 'archive', 'export', 'view', 'configure', 'backup', 'audit', 'impersonate', 'maintenance'];
  const sortedActions = Object.keys(groupedPermissions).sort((a, b) => {
    const indexA = actionOrder.indexOf(a);
    const indexB = actionOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const styles = getSimpleClasses();

  const enabledCount = permissions.filter(p => hasPermission(p.key)).length;
  const totalCount = permissions.length;

  return (
    <div className={`rounded-lg border transition-all duration-200 ${styles.border} ${styles.bg}`}>
      {/* Category Header */}
      <div className={`${styles.header} p-4 border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getLevelBadgeColor()}`}>
                {category.level}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{category.description}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-xs text-gray-500">
                {enabledCount} of {totalCount} permissions enabled
              </span>
              <div className="w-24 bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-gray-400 h-1.5 rounded-full transition-all duration-200" 
                  style={{ width: `${(enabledCount / totalCount) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {!isReadOnly && (
            <div className="ml-4 flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {hasAllPermissions ? 'All enabled' : hasAnyPermission ? 'Partial' : 'None'}
              </span>
              <Switch
                checked={hasAllPermissions}
                onCheckedChange={(checked) => toggleCategoryPermissions(category.id, checked)}
                disabled={isReadOnly}
                aria-label={`Toggle all ${category.name} permissions`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Permissions List */}
      <div className="p-4">
        <div className="space-y-4">
          {sortedActions.map((action) => {
            const actionPermissions = groupedPermissions[action];
            
            return (
              <div key={action} className="space-y-2">
                {actionPermissions.length > 1 && (
                  <h4 className="text-sm font-medium text-gray-800 capitalize mb-2">
                    {action.replace('_', ' ')} Actions
                  </h4>
                )}
                
                {actionPermissions.map((permission) => (
                  <PermissionSwitch
                    key={permission.key}
                    permission={permission}
                    checked={hasPermission(permission.key)}
                    onToggle={togglePermission}
                    disabled={isReadOnly}
                    scope={permission.scope}
                    saving={savingPermissions.has(permission.key)}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {permissions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No permissions available for this category at the current role level.</p>
          </div>
        )}
      </div>
    </div>
  );
}