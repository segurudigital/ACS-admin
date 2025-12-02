import React, { useState, useEffect } from 'react';
import Modal, { ModalBody, ModalFooter } from './Modal';
import { ServiceType, ServiceTypeFormData } from '../lib/serviceTypes';

interface ServiceTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ServiceTypeFormData) => Promise<void>;
  serviceType?: ServiceType | null;
  isLoading?: boolean;
}

const ServiceTypeModal: React.FC<ServiceTypeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  serviceType,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<ServiceTypeFormData>({
    name: '',
    description: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when serviceType changes or modal opens
  useEffect(() => {
    if (!isOpen) return;
    
    // Use a timeout to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      const initialFormData = serviceType ? {
        name: serviceType.name,
        value: serviceType.value,
        description: serviceType.description || '',
        isActive: serviceType.isActive,
        displayOrder: serviceType.displayOrder,
      } : {
        name: '',
        description: '',
        isActive: true,
      };
      
      setFormData(initialFormData);
      setErrors({});
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [serviceType, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.value && !/^[a-z_]+$/.test(formData.value)) {
      newErrors.value = 'Value must contain only lowercase letters and underscores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={serviceType ? 'Edit Service Type' : 'Create Service Type'}
      maxWidth="md"
      removeBorder={true}
    >
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Food Pantry"
              disabled={isLoading}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Value
            </label>
            <input
              type="text"
              value={formData.value || ''}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., food_pantry (auto-generated if empty)"
              disabled={isLoading || !!serviceType}
            />
            {errors.value && <p className="mt-1 text-sm text-red-600">{errors.value}</p>}
            {serviceType && (
              <p className="mt-1 text-sm text-gray-500">Value cannot be changed for existing types</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              placeholder="Brief description of this service type"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2 rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                disabled={isLoading}
              />
              <span className="text-sm font-medium text-gray-800">Active</span>
            </label>
            <p className="mt-1 text-sm text-gray-500">
              Inactive service types won&apos;t appear in the dropdown when creating services
            </p>
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-800 hover:text-gray-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#F25F29] hover:bg-[#F23E16] disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : serviceType ? 'Update' : 'Create'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default ServiceTypeModal;