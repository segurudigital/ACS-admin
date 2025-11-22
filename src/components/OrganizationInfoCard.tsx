'use client';

import { usePermissions } from '../contexts/HierarchicalPermissionContext';
import Card from './Card';

export default function OrganizationInfoCard() {
  const { user, currentOrganization, organizations, role, permissions } = usePermissions();

  if (!user) return null;

  const formatOrgType = (type: string | undefined) => {
    if (!type) return 'Unknown';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatPermissions = (perms: string[]) => {
    if (!perms || perms.length === 0) return [];
    
    // Group permissions by resource
    const grouped = perms.reduce((acc, perm) => {
      if (perm === '*' || perm === 'all') {
        return { ...acc, 'System': ['Full Access'] };
      }
      
      const [resource, action] = perm.split('.');
      if (!acc[resource]) {
        acc[resource] = [];
      }
      
      if (action === '*') {
        acc[resource] = ['Full Access'];
      } else {
        acc[resource].push(action);
      }
      
      return acc;
    }, {} as Record<string, string[]>);

    return Object.entries(grouped).map(([resource, actions]) => ({
      resource: resource.charAt(0).toUpperCase() + resource.slice(1),
      actions: [...new Set(actions)] // Remove duplicates
    }));
  };

  const formatRoleName = (roleName: string | null) => {
    if (!roleName) return 'No Role';
    return roleName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getRoleLevel = () => {
    if (!currentOrganization) return 'Unknown';
    return formatOrgType(currentOrganization.type);
  };

  const groupedPermissions = formatPermissions(permissions);

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Organization & Role</h2>
        <div className="text-right">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {getRoleLevel()} Level
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Current Organization */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Current Organization</h3>
          {currentOrganization ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{currentOrganization.name}</h4>
                  <p className="text-sm text-gray-600">{formatOrgType(currentOrganization.type)}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No organization assigned</p>
          )}
        </div>

        {/* Current Role */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Role & Responsibilities</h3>
          {role ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="font-medium text-gray-900">{formatRoleName(role)}</h4>
                  <p className="text-sm text-gray-600">
                    {permissions.length} permission{permissions.length !== 1 ? 's' : ''} granted
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No role assigned</p>
          )}
        </div>

        {/* All Organizations */}
        {organizations && organizations.length > 1 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">All Organizations</h3>
            <div className="space-y-2">
              {organizations.map((org) => (
                <div 
                  key={org._id} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    currentOrganization?._id === org._id 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900">{org.name}</p>
                    <p className="text-sm text-gray-600">{formatOrgType(org.type)}</p>
                  </div>
                  {currentOrganization?._id === org._id && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Current
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Permissions */}
        {groupedPermissions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedPermissions.map(({ resource, actions }) => (
                <div key={resource} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{resource}</h4>
                  <div className="flex flex-wrap gap-1">
                    {actions.map((action) => (
                      <span 
                        key={action}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {action === 'Full Access' ? action : action.charAt(0).toUpperCase() + action.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> Organization assignments and roles are managed by administrators. 
              If you need access to additional organizations or different permissions, please contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}