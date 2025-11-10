'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/contexts/PermissionContext';
import { rbacService } from '@/lib/rbac';
import { User, Organization, Role, OrganizationAssignment } from '@/types/rbac';
import DataTable, { Column, ActionCell, IconButton, StatusBadge } from '@/components/DataTable';
import { 
  UserIcon, 
  PencilIcon, 
  TrashIcon, 
  UserPlusIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/Button';
import UserModal from '@/components/UserModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useToast } from '@/contexts/ToastContext';

export default function Users() {
  const { hasPermission } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users...');
      const data = await rbacService.getUsers();
      console.log('Users data received:', data);
      console.log('Is data an array?', Array.isArray(data));
      console.log('Data length:', data?.length);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      toast.error('Failed to load users', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/users/${user._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        setUsers(prev => prev.filter(u => u._id !== user._id));
        toast.success('User deleted', `${user.name} has been successfully removed.`);
      } else {
        const error = await response.json();
        toast.error('Failed to delete user', error.message || 'An unexpected error occurred');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user', 'An unexpected error occurred');
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const handleUserSaved = (savedUser: User, isEdit: boolean) => {
    console.log('Saved user:', savedUser); // Debug log
    
    if (isEdit) {
      // Update existing user in the list
      setUsers(prev => 
        prev.map(user => user._id === savedUser._id ? savedUser : user)
      );
      toast.success('User updated', `${savedUser.name || 'User'} has been successfully updated.`);
    } else {
      // Add new user to the list
      setUsers(prev => [...prev, savedUser]);
      toast.success('User created', `${savedUser.name || 'User'} has been successfully created.`);
      
      // Refresh the user list to ensure it's up to date
      setTimeout(() => {
        fetchUsers();
      }, 500);
    }
    
    // Close modals and clear state
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(user => 
    (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Define table columns
  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name',
      accessor: (user) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-gray-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.name || 'Unnamed User'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      accessor: (user) => <div className="text-sm text-gray-900">{user.email || '-'}</div>
    },
    {
      key: 'phone',
      header: 'Phone',
      accessor: (user) => <div className="text-sm text-gray-900">{user.phone || '-'}</div>
    },
    {
      key: 'address',
      header: 'Address',
      accessor: (user) => (
        <div className="text-sm text-gray-900">
          {user.address ? (
            <div>
              <div>{user.address}</div>
              {(user.city || user.state || user.country) && (
                <div className="text-gray-500">
                  {[user.city, user.state, user.country].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          ) : (
            '-'
          )}
        </div>
      )
    },
    {
      key: 'verified',
      header: 'Verified',
      accessor: (user) => (
        <StatusBadge
          status={user.verified}
          trueLabel="Verified"
          falseLabel="Unverified"
          trueColor="green"
          falseColor="yellow"
        />
      )
    },
    {
      key: 'roles',
      header: 'Roles',
      accessor: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.organizations?.length > 0 ? (
            user.organizations.map((org) => (
              <span 
                key={`${org.organization}-${org.role}`}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
              >
                {typeof org.role === 'object' ? org.role.displayName : 'Role'}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-500">No roles</span>
          )}
        </div>
      ),
      className: 'px-6 py-4'
    },
    {
      key: 'createdAt',
      header: 'Joined',
      accessor: (user) => (
        <span className="text-sm text-gray-500">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider',
      className: 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium',
      accessor: (user) => (
        <ActionCell>
          <PermissionGate permission="users.assign_role">
            <IconButton
              onClick={() => {
                setSelectedUser(user);
                setShowRoleModal(true);
              }}
              title="Manage Roles"
              icon={<ShieldCheckIcon className="h-5 w-5" />}
            />
          </PermissionGate>
          
          <PermissionGate permission="users.update">
            <IconButton
              title="Edit User"
              icon={<PencilIcon className="h-5 w-5" />}
              onClick={() => {
                setSelectedUser(user);
                setShowEditModal(true);
              }}
            />
          </PermissionGate>
          
          <PermissionGate permission="users.delete">
            <IconButton
              title="Delete User"
              icon={<TrashIcon className="h-5 w-5" />}
              variant="danger"
              onClick={() => {
                setUserToDelete(user);
                setShowDeleteConfirm(true);
              }}
            />
          </PermissionGate>
        </ActionCell>
      )
    }
  ];

  return (
    <AdminLayout 
      title="Users" 
      description="Manage users and their role assignments"
    >
      <div className="space-y-6">
        {/* Table with custom header */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Custom header with search and button */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <div className="max-w-xs">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                />
              </div>
              <PermissionGate permission="users.create">
                <Button onClick={() => setShowCreateModal(true)} className="whitespace-nowrap" size="sm">
                  Add User
                </Button>
              </PermissionGate>
            </div>
          </div>
          
          {/* Table content */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="px-4 py-5 text-center">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                  <UserIcon />
                </div>
                <p className="text-sm text-gray-500">No users found</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        scope="col"
                        className={
                          column.headerClassName ||
                          'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                        }
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={column.className || 'px-6 py-4 whitespace-nowrap text-sm'}
                        >
                          {column.accessor(user)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Create/Edit User Modal */}
        <UserModal
          isOpen={showCreateModal || showEditModal}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSave={handleUserSaved}
          user={showEditModal ? selectedUser : null}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setUserToDelete(null);
          }}
          onConfirm={() => userToDelete && handleDeleteUser(userToDelete)}
          title="Delete User"
          message={`Are you sure you want to delete "${userToDelete?.name}"? This action cannot be undone.`}
          confirmLabel="Delete User"
          confirmButtonColor="red"
          icon={<TrashIcon className="h-6 w-6 text-red-600" />}
        />

        {/* Role Assignment Modal */}
        {showRoleModal && selectedUser && (
          <RoleAssignmentModal
            user={selectedUser}
            onClose={() => {
              setShowRoleModal(false);
              setSelectedUser(null);
            }}
            onUpdate={fetchUsers}
          />
        )}
      </div>
    </AdminLayout>
  );
}

interface RoleAssignmentModalProps {
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}

function RoleAssignmentModal({ user, onClose, onUpdate }: RoleAssignmentModalProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [userRoles, setUserRoles] = useState<OrganizationAssignment[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [orgs, systemRoles, userRoleData] = await Promise.all([
        rbacService.getOrganizations(),
        rbacService.getSystemRoles(),
        rbacService.getUserRoles(user._id)
      ]);
      
      setOrganizations(orgs);
      setRoles(systemRoles);
      setUserRoles(userRoleData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedOrg || !selectedRole) return;

    try {
      setLoading(true);
      await rbacService.assignUserRole(user._id, selectedOrg, selectedRole);
      await fetchData();
      setSelectedOrg('');
      setSelectedRole('');
      onUpdate();
    } catch (error) {
      console.error('Error assigning role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeRole = async (organizationId: string) => {
    try {
      setLoading(true);
      await rbacService.revokeUserRole(user._id, organizationId);
      await fetchData();
      onUpdate();
    } catch (error) {
      console.error('Error revoking role:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">Manage User Roles</h3>
          <p className="text-sm text-gray-500">{user.name} - {user.email}</p>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Current Roles */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Current Roles</h4>
            {userRoles.length === 0 ? (
              <p className="text-sm text-gray-500">No roles assigned</p>
            ) : (
              <ul className="space-y-2">
                {userRoles.map((assignment) => (
                  <li 
                    key={`${assignment.organization}-${assignment.role}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium">
                          {typeof assignment.organization === 'object' 
                            ? assignment.organization.name 
                            : 'Organization'}
                        </span>
                      </div>
                      <div className="ml-6 text-sm text-gray-500">
                        {typeof assignment.role === 'object' 
                          ? assignment.role.displayName 
                          : 'Role'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevokeRole(
                        typeof assignment.organization === 'object' 
                          ? assignment.organization._id 
                          : assignment.organization
                      )}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Assign New Role */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Assign New Role</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Organization
                </label>
                <select
                  value={selectedOrg}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select organization...</option>
                  {organizations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name} ({org.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={!selectedOrg}
                >
                  <option value="">Select role...</option>
                  {roles
                    .filter(role => {
                      // Filter roles based on selected organization type
                      const org = organizations.find(o => o._id === selectedOrg);
                      if (!org) return true;
                      
                      // Church can have all roles
                      if (org.type === 'church') return true;
                      // Conference can have conference and union roles
                      if (org.type === 'conference') return role.level ? ['conference', 'union'].includes(role.level) : false;
                      // Union can only have union roles
                      if (org.type === 'union') return role.level === 'union';
                      
                      return false;
                    })
                    .map((role) => (
                      <option key={role.name} value={role.name}>
                        {role.displayName} - {role.description}
                      </option>
                    ))}
                </select>
              </div>

              <button
                onClick={handleAssignRole}
                disabled={!selectedOrg || !selectedRole || loading}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Assign Role
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}