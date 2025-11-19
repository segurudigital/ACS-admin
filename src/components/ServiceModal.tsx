'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal, { ModalBody, ModalFooter } from './Modal';
import { useToast } from '@/contexts/ToastContext';
import { serviceManagement, Service } from '@/lib/serviceManagement';
import { serviceTypeAPI } from '@/lib/serviceTypes';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Service, isEdit: boolean) => void;
  service?: Service;
  organizationId?: string;
}


export default function ServiceModal({ 
  isOpen, 
  onClose, 
  onSave, 
  service,
  organizationId 
}: ServiceModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    organization: organizationId || '',
    descriptionShort: '',
    descriptionLong: '',
    status: 'active' as 'active' | 'paused' | 'archived',
    tags: [] as string[],
    locations: [{
      label: 'Main Location',
      address: {
        street: '',
        suburb: '',
        state: '',
        postcode: ''
      },
      isMobile: false,
      openingHours: []
    }],
    contactInfo: {
      email: '',
      phone: '',
      website: ''
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Array<{_id: string; name: string; type: string}>>([]);
  const [serviceTypes, setServiceTypes] = useState<Array<{value: string; label: string; description?: string}>>([]);
  const [tagInput, setTagInput] = useState('');
  const { error: showError } = useToast();

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        type: service.type || '',
        organization: typeof service.organization === 'object' ? service.organization._id : service.organization || '',
        descriptionShort: service.descriptionShort || '',
        descriptionLong: service.descriptionLong || '',
        status: service.status || 'active',
        tags: service.tags || [],
        locations: service.locations?.map(location => ({
          ...location,
          address: {
            street: location.address?.street || '',
            suburb: location.address?.suburb || '',
            state: location.address?.state || '',
            postcode: location.address?.postcode || ''
          },
          isMobile: false,
          openingHours: []
        })) || [{
          label: 'Main Location',
          address: {
            street: '',
            suburb: '',
            state: '',
            postcode: ''
          },
          isMobile: false,
          openingHours: []
        }],
        contactInfo: {
          email: service.contactInfo?.email || '',
          phone: service.contactInfo?.phone || '',
          website: service.contactInfo?.website || ''
        }
      });
    } else if (organizationId) {
      setFormData(prev => ({ ...prev, organization: organizationId }));
    }
  }, [service, organizationId]);

  const fetchOrganizations = useCallback(async () => {
    try {
      console.log('Fetching organizations...');
      const data = await serviceManagement.getServiceOrganizations();
      console.log('Organizations API response:', data);
      setOrganizations(data.organizations || []);
      console.log('Organizations set to state:', data.organizations || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      console.error('Failed to fetch organizations - 500 error');
    }
  }, []);

  const fetchServiceTypes = useCallback(async () => {
    try {
      const types = await serviceTypeAPI.getActive();
      
      // Check if response is an array
      if (!Array.isArray(types)) {
        showError('Invalid response format from service types API');
        return;
      }
      
      // Format types for dropdown
      const formattedTypes = types.map(type => ({
        value: type.value,
        label: type.name,
        description: type.description
      }));
      
      setServiceTypes(formattedTypes);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError(`Failed to fetch service types: ${errorMessage}`);
    }
  }, [showError]);

  useEffect(() => {
    if (isOpen) {
      fetchOrganizations();
      fetchServiceTypes();
    }
  }, [isOpen, fetchOrganizations, fetchServiceTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type || !formData.organization) {
      showError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let savedService;
      
      console.log('Submitting form data:', formData);
      console.log('Organization ID:', formData.organization);
      
      if (service) {
        // Update existing service
        const response = await serviceManagement.updateService(service._id, formData);
        savedService = response.service;
      } else {
        // Create new service
        const response = await serviceManagement.createService(formData);
        savedService = response.service;
      }

      onSave(savedService, !!service);
      onClose();
    } catch (error: unknown) {
      showError((error as Error)?.message || `Failed to ${service ? 'update' : 'create'} service`);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={service ? 'Edit Service' : 'Create Service'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Service Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter service name"
              required
              className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Service Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Choose Type</option>
                {serviceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Organization
              </label>
              <select
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                required
                disabled={!!service}
              >
                <option value="">Choose Organization</option>
                {organizations.map(org => (
                  <option key={org._id} value={org._id}>
                    {org.name} ({org.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Descriptions */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Description</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Short Description
              </label>
              <input
                type="text"
                value={formData.descriptionShort}
                onChange={(e) => setFormData({ ...formData, descriptionShort: e.target.value })}
                placeholder="Brief description (max 200 characters)"
                maxLength={200}
                required
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.descriptionShort.length}/200 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Detailed Description
              </label>
              <textarea
                value={formData.descriptionLong}
                onChange={(e) => setFormData({ ...formData, descriptionLong: e.target.value })}
                rows={4}
                placeholder="Provide a detailed description of the service..."
                required
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Location</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.locations[0].address.street}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    locations: [{
                      ...prev.locations[0],
                      address: { ...prev.locations[0].address, street: e.target.value }
                    }]
                  }))}
                  placeholder="123 Main Street"
                  className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Suburb
                </label>
                <input
                  type="text"
                  value={formData.locations[0].address.suburb}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    locations: [{
                      ...prev.locations[0],
                      address: { ...prev.locations[0].address, suburb: e.target.value }
                    }]
                  }))}
                  placeholder="Sydney"
                  className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  value={formData.locations[0].address.state}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    locations: [{
                      ...prev.locations[0],
                      address: { ...prev.locations[0].address, state: e.target.value }
                    }]
                  }))}
                  placeholder="NSW"
                  className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Postcode
                </label>
                <input
                  type="text"
                  value={formData.locations[0].address.postcode}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    locations: [{
                      ...prev.locations[0],
                      address: { ...prev.locations[0].address, postcode: e.target.value }
                    }]
                  }))}
                  placeholder="2000"
                  className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Contact Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={formData.contactInfo.email}
                onChange={(e) => setFormData({
                  ...formData,
                  contactInfo: { ...formData.contactInfo, email: e.target.value }
                })}
                placeholder="service@example.com"
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                value={formData.contactInfo.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  contactInfo: { ...formData.contactInfo, phone: e.target.value }
                })}
                placeholder="(02) 1234 5678"
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                type="url"
                value={formData.contactInfo.website}
                onChange={(e) => setFormData({
                  ...formData,
                  contactInfo: { ...formData.contactInfo, website: e.target.value }
                })}
                placeholder="https://example.com"
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Tags</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Add Tags
              </label>
              <div className="mt-1 flex">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Type a tag and press Enter"
                  className="block w-full px-4 py-3 text-base rounded-l-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add
                </button>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 inline-flex items-center justify-center w-4 h-4 text-indigo-400 hover:text-indigo-600"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Status (only for editing) */}
          {service && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'paused' | 'archived' })}
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="ml-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading}
          >
            {loading ? 'Saving...' : service ? 'Update' : 'Create'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}