'use client';

import React, { useState } from 'react';
import Modal, { ModalBody, ModalFooter } from './Modal';
import { OrganizationService } from '@/lib/organizationService';
import { useToast } from '@/contexts/ToastContext';

interface Organization {
  _id: string;
  name: string;
  type: 'union' | 'conference' | 'church';
  parentOrganization?: {
    _id: string;
    name: string;
    type: string;
  };
  metadata: {
    address?: string;
    phone?: string;
    territory?: string[];
    email?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (savedOrganization: Organization, isEdit: boolean) => void;
  organization?: Organization | null;
  organizations: Organization[];
}

export default function OrganizationModal({ 
  isOpen, 
  onClose, 
  onSave, 
  organization, 
  organizations 
}: OrganizationModalProps) {
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    type: organization?.type || '',
    parentOrganization: typeof organization?.parentOrganization === 'object' 
      ? organization.parentOrganization._id 
      : organization?.parentOrganization || '',
    metadata: {
      address: organization?.metadata?.address || '',
      phone: organization?.metadata?.phone || '',
      email: organization?.metadata?.email || '',
      territory: organization?.metadata?.territory || []
    }
  });
  const [loading, setLoading] = useState(false);
  const [territoryInput, setTerritoryInput] = useState('');
  const toast = useToast();

  // Helper function to provide user-friendly error messages
  const getUserFriendlyErrorMessage = (errorMessage: string, orgType: string) => {
    const lowerMessage = errorMessage.toLowerCase();
    
    // Common validation error patterns
    if (lowerMessage.includes('parent') && lowerMessage.includes('required')) {
      if (orgType === 'church') {
        return 'Churches must have a parent organization. Please select a Conference as the parent organization.';
      } else if (orgType === 'conference') {
        return 'Conferences must have a parent organization. Please select a Union as the parent organization.';
      }
    }
    
    if (lowerMessage.includes('name') && lowerMessage.includes('required')) {
      return 'Organization name is required. Please enter a name for the organization.';
    }
    
    if (lowerMessage.includes('name') && lowerMessage.includes('exist')) {
      return 'An organization with this name already exists. Please choose a different name.';
    }
    
    if (lowerMessage.includes('invalid') && lowerMessage.includes('type')) {
      return 'Invalid organization type selected. Please choose Union, Conference, or Church.';
    }
    
    if (lowerMessage.includes('email') && lowerMessage.includes('invalid')) {
      return 'Please enter a valid email address.';
    }
    
    if (lowerMessage.includes('permission') || lowerMessage.includes('authorized')) {
      return 'You do not have permission to perform this action. Please contact your administrator.';
    }
    
    // Return the original message if no pattern matches, but clean it up
    return errorMessage || 'An unexpected error occurred. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const organizationData = {
        name: formData.name,
        type: formData.type as 'union' | 'conference' | 'church',
        parentOrganization: formData.parentOrganization || undefined,
        metadata: formData.metadata
      };

      let response;
      if (organization) {
        // Update existing organization
        response = await OrganizationService.updateOrganization(organization._id, organizationData);
      } else {
        // Create new organization
        response = await OrganizationService.createOrganization(organizationData);
      }
      
      if (response.success && response.data) {
        onSave(response.data, !!organization);
      } else {
        // Debug: Log the full response from service
        console.log('OrganizationModal received error response:', response);
        
        // Provide user-friendly error messages
        const errorMessage = response.message || response.error || 'An unknown error occurred';
        const userFriendlyMessage = getUserFriendlyErrorMessage(errorMessage, formData.type);
        
        console.log('Error message extracted:', errorMessage);
        console.log('User-friendly message:', userFriendlyMessage);
        
        toast.error(
          organization ? 'Failed to update organization' : 'Failed to create organization',
          userFriendlyMessage
        );
      }
    } catch (error) {
      console.error('Error saving organization:', error);
      
      // Try to extract a meaningful error message
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      const userFriendlyMessage = getUserFriendlyErrorMessage(errorMessage, formData.type);
      
      toast.error(
        organization ? 'Failed to update organization' : 'Failed to create organization',
        userFriendlyMessage
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset form when organization changes or modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: organization?.name || '',
        type: organization?.type || '',
        parentOrganization: typeof organization?.parentOrganization === 'object' 
          ? organization.parentOrganization._id 
          : organization?.parentOrganization || '',
        metadata: {
          address: organization?.metadata?.address || '',
          phone: organization?.metadata?.phone || '',
          email: organization?.metadata?.email || '',
          territory: organization?.metadata?.territory || []
        }
      });
    }
  }, [organization, isOpen]);

  const addTerritory = () => {
    if (territoryInput.trim()) {
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          territory: [...prev.metadata.territory, territoryInput.trim()]
        }
      }));
      setTerritoryInput('');
    }
  };

  const removeTerritory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        territory: prev.metadata.territory.filter((_, i) => i !== index)
      }
    }));
  };

  // Get all available organizations as potential parents (excluding the current organization being edited)
  const getAvailableParents = () => {
    return organizations.filter(org => {
      // Exclude the current organization being edited to prevent self-parenting
      if (organization && org._id === organization._id) return false;
      return true;
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={organization ? 'Edit Organization' : 'Create Organization'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Organization Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter organization name"
              required
              className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  type: e.target.value as 'union' | 'conference' | 'church',
                  parentOrganization: '' // Reset parent when type changes
                }))}
                disabled={!!organization}
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              >
                <option value="">Choose Type</option>
                <option value="union">Union</option>
                <option value="conference">Conference</option>
                <option value="church">Church</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Parent Organization <span className="text-gray-500">(Optional)</span>
              </label>
              <select
                value={formData.parentOrganization}
                onChange={(e) => setFormData(prev => ({ ...prev, parentOrganization: e.target.value }))}
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">No parent (Top-level organization)</option>
                {getAvailableParents().map(org => (
                  <option key={org._id} value={org._id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Contact Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={formData.metadata.email}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  metadata: { ...prev.metadata, email: e.target.value }
                }))}
                placeholder="organization@example.com"
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                value={formData.metadata.phone}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  metadata: { ...prev.metadata, phone: e.target.value }
                }))}
                placeholder="(123) 456-7890"
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                value={formData.metadata.address}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  metadata: { ...prev.metadata, address: e.target.value }
                }))}
                placeholder="Street address, city, state, zip code"
                rows={3}
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Territory for Union/Conference */}
            {(formData.type === 'union' || formData.type === 'conference') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Territory
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={territoryInput}
                    onChange={(e) => setTerritoryInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTerritory())}
                    placeholder="Add territory (e.g., California)"
                    className="flex-1 px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={addTerritory}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.metadata.territory.map((territory, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {territory}
                      <button
                        type="button"
                        onClick={() => removeTerritory(index)}
                        className="ml-1 text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.name}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#F5821F] hover:bg-[#e0741c] disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {organization ? 'Update' : 'Create'} Organization
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}