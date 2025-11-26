'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal, { ModalBody, ModalFooter } from './Modal';
import Button from './Button';
import { useToast } from '@/contexts/ToastContext';
import { serviceManagement } from '@/lib/serviceManagement';
import { UserGroupIcon, PlusIcon, PencilIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';

interface VolunteerRole {
  _id: string;
  title: string;
  description: string;
  requirements?: string;
  timeCommitment?: string;
  isActive: boolean;
  volunteersNeeded?: number;
  currentVolunteers?: number;
}

interface VolunteerRolesResponse {
  roles: VolunteerRole[];
}

interface VolunteersModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  permissions: {
    canManage: boolean;
  };
}

export default function VolunteersModal({ isOpen, onClose, serviceId, permissions }: VolunteersModalProps) {
  const [roles, setRoles] = useState<VolunteerRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRole, setEditingRole] = useState<VolunteerRole | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    timeCommitment: '',
    volunteersNeeded: '',
    isActive: true
  });

  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const fetchVolunteerRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await serviceManagement.getServiceVolunteerRoles(serviceId) as VolunteerRolesResponse;
      setRoles(response.roles || []);
    } catch (error) {
      console.error('Failed to fetch volunteer roles:', error);
      showErrorToast('Failed to load volunteer roles');
    } finally {
      setLoading(false);
    }
  }, [serviceId, showErrorToast]);

  useEffect(() => {
    if (isOpen) {
      fetchVolunteerRoles();
    }
  }, [isOpen, serviceId, fetchVolunteerRoles]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      requirements: '',
      timeCommitment: '',
      volunteersNeeded: '',
      isActive: true
    });
    setShowAddForm(false);
    setEditingRole(null);
  };

  const handleEdit = (role: VolunteerRole) => {
    setEditingRole(role);
    setFormData({
      title: role.title,
      description: role.description,
      requirements: role.requirements || '',
      timeCommitment: role.timeCommitment || '',
      volunteersNeeded: role.volunteersNeeded ? role.volunteersNeeded.toString() : '',
      isActive: role.isActive
    });
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      showErrorToast('Please fill in the required fields');
      return;
    }

    try {
      const roleData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
        timeCommitment: formData.timeCommitment.trim(),
        volunteersNeeded: formData.volunteersNeeded ? parseInt(formData.volunteersNeeded) : undefined,
        isActive: formData.isActive
      };

      if (editingRole) {
        await serviceManagement.updateServiceVolunteerRole(serviceId, editingRole._id, roleData);
        showSuccessToast('Volunteer role updated successfully');
      } else {
        await serviceManagement.createServiceVolunteerRole(serviceId, roleData);
        showSuccessToast('Volunteer role created successfully');
      }

      fetchVolunteerRoles();
      resetForm();
    } catch (error) {
      console.error('Failed to save volunteer role:', error);
      showErrorToast('Failed to save volunteer role');
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this volunteer role?')) {
      return;
    }

    try {
      await serviceManagement.deleteServiceVolunteerRole(serviceId, roleId);
      showSuccessToast('Volunteer role deleted successfully');
      fetchVolunteerRoles();
    } catch (error) {
      console.error('Failed to delete volunteer role:', error);
      showErrorToast('Failed to delete volunteer role');
    }
  };

  const toggleRoleStatus = async (roleId: string, currentStatus: boolean) => {
    try {
      await serviceManagement.updateServiceVolunteerRole(serviceId, roleId, {
        isActive: !currentStatus
      });
      showSuccessToast(`Role ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchVolunteerRoles();
    } catch (error) {
      console.error('Failed to update role status:', error);
      showErrorToast('Failed to update role status');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Volunteer Opportunities" maxWidth="2xl" theme="orange">
      <ModalBody>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5821F]"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Add Role Button */}
            {permissions.canManage && !showAddForm && (
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  leftIcon={PlusIcon}
                  onClick={() => setShowAddForm(true)}
                >
                  Add Volunteer Role
                </Button>
              </div>
            )}

            {/* Add/Edit Role Form */}
            {showAddForm && permissions.canManage && (
              <div className="bg-gray-50 rounded-lg p-6 border">
                <h4 className="text-lg font-medium text-gray-800 mb-4">
                  {editingRole ? 'Edit Volunteer Role' : 'Add New Volunteer Role'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Role Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5821F] focus:border-transparent"
                      placeholder="Enter role title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Time Commitment
                    </label>
                    <input
                      type="text"
                      value={formData.timeCommitment}
                      onChange={(e) => setFormData({ ...formData, timeCommitment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5821F] focus:border-transparent"
                      placeholder="e.g., 2 hours per week"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Volunteers Needed
                    </label>
                    <input
                      type="number"
                      value={formData.volunteersNeeded}
                      onChange={(e) => setFormData({ ...formData, volunteersNeeded: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5821F] focus:border-transparent"
                      placeholder="Number of volunteers"
                      min="1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5821F] focus:border-transparent"
                      placeholder="Describe the volunteer role and responsibilities"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Requirements
                    </label>
                    <textarea
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5821F] focus:border-transparent"
                      placeholder="Any specific skills, experience, or requirements"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="rounded border-gray-300 text-[#F5821F] focus:ring-[#F5821F]"
                      />
                      <span className="ml-2 text-sm text-gray-800">Active role (accepting applications)</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSave}>
                    {editingRole ? 'Update Role' : 'Add Role'}
                  </Button>
                </div>
              </div>
            )}

            {/* Roles List */}
            <div>
              <h4 className="text-lg font-medium text-gray-800 mb-4">
                Volunteer Roles ({roles.length})
              </h4>
              {roles.length > 0 ? (
                <div className="space-y-3">
                  {roles.map((role) => (
                    <div
                      key={role._id}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        role.isActive ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <UserGroupIcon className="h-5 w-5 text-gray-400" />
                            <h5 className="font-medium text-gray-800">{role.title}</h5>
                            {!role.isActive && (
                              <span className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded-full">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                            {role.timeCommitment && (
                              <div className="flex items-center space-x-1">
                                <span>⏰</span>
                                <span>{role.timeCommitment}</span>
                              </div>
                            )}
                            {role.volunteersNeeded && (
                              <div className="flex items-center space-x-1">
                                <UserIcon className="h-4 w-4" />
                                <span>
                                  {role.currentVolunteers || 0}/{role.volunteersNeeded} volunteers
                                </span>
                              </div>
                            )}
                            {role.isActive && (
                              <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span>Accepting applications</span>
                              </div>
                            )}
                          </div>
                          
                          {role.requirements && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-800 mb-1">Requirements:</p>
                              <p className="text-xs text-gray-600">{role.requirements}</p>
                            </div>
                          )}
                        </div>
                        
                        {permissions.canManage && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleRoleStatus(role._id, role.isActive)}
                              className={`p-1 rounded ${
                                role.isActive 
                                  ? 'text-yellow-600 hover:text-yellow-800' 
                                  : 'text-green-600 hover:text-green-800'
                              }`}
                              title={role.isActive ? 'Deactivate role' : 'Activate role'}
                            >
                              {role.isActive ? '⏸️' : '▶️'}
                            </button>
                            <button
                              onClick={() => handleEdit(role)}
                              className="text-gray-400 hover:text-[#F5821F] p-1"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(role._id)}
                              className="text-gray-400 hover:text-red-600 p-1"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No volunteer opportunities available.</p>
                  {permissions.canManage && (
                    <p className="text-sm text-gray-400 mt-1">
                      Click &quot;Add Volunteer Role&quot; to create your first opportunity.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}