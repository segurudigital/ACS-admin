import React, { useState, useEffect } from 'react';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {serviceType ? 'Edit Service Type' : 'Create Service Type'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={isLoading}
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Food Pantry"
              disabled={isLoading}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Value
            </label>
            <input
              type="text"
              value={formData.value || ''}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., food_pantry (auto-generated if empty)"
              disabled={isLoading || !!serviceType}
            />
            {errors.value && <p className="mt-1 text-sm text-red-600">{errors.value}</p>}
            {serviceType && (
              <p className="mt-1 text-sm text-gray-500">Value cannot be changed for existing types</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Brief description of this service type"
              disabled={isLoading}
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                disabled={isLoading}
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
            <p className="mt-1 text-sm text-gray-500">
              Inactive service types won&apos;t appear in the dropdown when creating services
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : serviceType ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceTypeModal;