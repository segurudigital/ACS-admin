'use client';

import React, { useState, useEffect } from 'react';
import Modal, { ModalBody, ModalFooter } from './Modal';
import { rbacService } from '@/lib/rbac';
import { useToast } from '@/contexts/ToastContext';
import { Role } from '@/types/rbac';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (savedRole: Role, isEdit: boolean) => void;
  role?: Role | null;
  viewMode?: boolean;
}

export default function RoleModal({ 
  isOpen, 
  onClose, 
  onSave, 
  role,
  viewMode = false
}: RoleModalProps) {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    displayName: role?.displayName || '',
    level: (role?.level || 'church') as 'union' | 'conference' | 'church',
    description: role?.description || '',
    permissions: role?.permissions || [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Available permissions grouped by resource with descriptions
  const availablePermissions = {
    users: [
      { key: 'users.create', label: 'Create new users and add them to the system' },
      { key: 'users.read', label: 'View user profiles and information' },
      { key: 'users.update', label: 'Edit user profiles and personal information' },
      { key: 'users.delete', label: 'Remove users from the system' },
      { key: 'users.assign_role', label: 'Assign roles and permissions to users' }
    ],
    organizations: [
      { key: 'organizations.create', label: 'Create new churches, conferences, or unions' },
      { key: 'organizations.read', label: 'View organization details and structure' },
      { key: 'organizations.update', label: 'Edit organization information and settings' },
      { key: 'organizations.delete', label: 'Remove organizations from the system' }
    ],
    roles: [
      { key: 'roles.create', label: 'Create new roles with custom permissions' },
      { key: 'roles.read', label: 'View existing roles and their permissions' },
      { key: 'roles.update', label: 'Modify role permissions and settings' },
      { key: 'roles.delete', label: 'Remove roles from the system' }
    ],
    reports: [
      { key: 'reports.create', label: 'Generate new reports and analytics' },
      { key: 'reports.read', label: 'View existing reports and data' },
      { key: 'reports.export', label: 'Export reports to PDF, Excel, or other formats' }
    ],
    notifications: [
      { key: 'notifications.create', label: 'Create and compose new notifications' },
      { key: 'notifications.read', label: 'View notification history and content' },
      { key: 'notifications.send', label: 'Send notifications to users or groups' }
    ],
    settings: [
      { key: 'settings.read', label: 'View system configuration and settings' },
      { key: 'settings.update', label: 'Modify system settings and preferences' }
    ]
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const roleData = {
        name: formData.name,
        displayName: formData.displayName,
        level: formData.level,
        description: formData.description,
        permissions: formData.permissions
      };

      let response;
      if (role) {
        // Update existing role
        response = await rbacService.updateRole(role._id, roleData);
      } else {
        // Create new role
        response = await rbacService.createRole(roleData);
      }
      
      onSave(response, !!role);
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error(
        role ? 'Failed to update role' : 'Failed to create role',
        'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const toggleAllPermissions = (resource: string, permissions: { key: string; label: string }[]) => {
    const permissionKeys = permissions.map(p => p.key);
    const hasAllPermissions = permissionKeys.every(p => formData.permissions.includes(p));
    
    if (hasAllPermissions) {
      // Remove all permissions for this resource
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !permissionKeys.includes(p))
      }));
    } else {
      // Add all permissions for this resource
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...permissionKeys])]
      }));
    }
  };

  // Reset form when role changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: role?.name || '',
        displayName: role?.displayName || '',
        level: (role?.level || 'church') as 'union' | 'conference' | 'church',
        description: role?.description || '',
        permissions: role?.permissions || []
      });
    }
  }, [role, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={viewMode ? 'View Role Details' : (role ? 'Edit Role' : 'Create Role')}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  name: e.target.value.toLowerCase().replace(/\s+/g, '_') 
                }))}
                placeholder="e.g., custom_admin"
                required
                disabled={viewMode || role?.isSystem}
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">Lowercase, underscores only</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Display Name *
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="e.g., Custom Administrator"
                required
                disabled={viewMode || role?.isSystem}
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Level *
            </label>
            <select
              value={formData.level}
              onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as 'union' | 'conference' | 'church' }))}
              disabled={viewMode || role?.isSystem}
              className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
            >
              <option value="church">Church</option>
              <option value="conference">Conference</option>
              <option value="union">Union</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              required
              disabled={viewMode || role?.isSystem}
              className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              placeholder="Describe the role and its responsibilities..."
            />
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Permissions *
            </label>
            <div className="space-y-4">
              {Object.entries(availablePermissions).map(([resource, perms]) => {
                const permissionKeys = perms.map(p => p.key);
                const hasAllPermissions = permissionKeys.every(p => formData.permissions.includes(p));
                const hasSomePermissions = permissionKeys.some(p => formData.permissions.includes(p));
                
                return (
                  <div key={resource} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-gray-900 capitalize">
                        {resource}
                      </h5>
                      <button
                        type="button"
                        onClick={() => toggleAllPermissions(resource, perms)}
                        disabled={viewMode || role?.isSystem}
                        className={`text-xs px-3 py-1 rounded-md font-medium ${
                          hasAllPermissions 
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        {hasAllPermissions ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="space-y-3">
                      {perms.map((perm) => (
                        <label key={perm.key} className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(perm.key)}
                            onChange={() => togglePermission(perm.key)}
                            disabled={viewMode || role?.isSystem}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50 mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="text-sm text-gray-900">{perm.label}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {(role?.isSystem || viewMode) && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    {viewMode ? 'Read-Only View' : 'System Role'}
                  </h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>
                      {viewMode 
                        ? 'You are viewing this role in read-only mode. To make changes, use the edit button.'
                        : 'This is a system role and cannot be modified. You can view its permissions but cannot edit them.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
          >
            Cancel
          </button>
          {!viewMode && !role?.isSystem && (
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.displayName || formData.permissions.length === 0}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#F5821F] hover:bg-[#e0741c] disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (role ? 'Update Role' : 'Create Role')}
            </button>
          )}
        </ModalFooter>
      </form>
    </Modal>
  );
}