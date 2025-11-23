'use client';

import React, { useState } from 'react';
import Modal, { ModalBody, ModalFooter } from './Modal';
import { UnionService } from '@/lib/unionService';
import { Union } from '@/types/hierarchy';
import { useToast } from '@/contexts/ToastContext';

interface UnionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (savedUnion: Union, isEdit: boolean) => void;
  union?: Union | null;
  unions: Union[];
}

export default function UnionModal({ 
  isOpen, 
  onClose, 
  onSave, 
  union, 
  unions 
}: UnionModalProps) {
  const [formData, setFormData] = useState({
    name: union?.name || '',
    territory: {
      description: union?.territory?.description || ''
    },
    headquarters: {
      address: union?.headquarters?.address || '',
      city: union?.headquarters?.city || '',
      state: union?.headquarters?.state || '',
      country: union?.headquarters?.country || '',
      postalCode: union?.headquarters?.postalCode || ''
    },
    contact: {
      email: union?.contact?.email || '',
      phone: union?.contact?.phone || '',
      website: union?.contact?.website || ''
    }
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Helper function to provide user-friendly error messages
  const getUserFriendlyErrorMessage = (errorMessage: string) => {
    const lowerMessage = errorMessage.toLowerCase();
    
    if (lowerMessage.includes('name') && lowerMessage.includes('required')) {
      return 'Union name is required. Please enter a name for the union.';
    }
    
    if (lowerMessage.includes('code') && lowerMessage.includes('required')) {
      return 'Union code is required. Please enter a unique code for the union.';
    }
    
    if (lowerMessage.includes('code') && lowerMessage.includes('exist')) {
      return 'A union with this code already exists. Please choose a different code.';
    }
    
    if (lowerMessage.includes('email') && lowerMessage.includes('invalid')) {
      return 'Please enter a valid email address.';
    }
    
    if (lowerMessage.includes('permission') || lowerMessage.includes('authorized')) {
      return 'You do not have permission to perform this action. Please contact your administrator.';
    }
    
    return errorMessage || 'An unexpected error occurred. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const unionData = {
        name: formData.name,
        territory: formData.territory,
        headquarters: formData.headquarters,
        contact: formData.contact
      };

      let response;
      if (union) {
        // Update existing union
        response = await UnionService.updateUnion(union._id, unionData);
      } else {
        // Create new union
        response = await UnionService.createUnion(unionData);
      }
      
      if (response.success && response.data) {
        onSave(response.data, !!union);
      } else {
        const errorMessage = response.message || 'An unknown error occurred';
        const userFriendlyMessage = getUserFriendlyErrorMessage(errorMessage);
        
        toast.error(
          union ? 'Failed to update union' : 'Failed to create union',
          userFriendlyMessage
        );
      }
    } catch (error) {
      console.error('Error saving union:', error);
      
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      const userFriendlyMessage = getUserFriendlyErrorMessage(errorMessage);
      
      toast.error(
        union ? 'Failed to update union' : 'Failed to create union',
        userFriendlyMessage
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset form when union changes or modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: union?.name || '',
        territory: {
          description: union?.territory?.description || ''
        },
        headquarters: {
          address: union?.headquarters?.address || '',
          city: union?.headquarters?.city || '',
          state: union?.headquarters?.state || '',
          country: union?.headquarters?.country || '',
          postalCode: union?.headquarters?.postalCode || ''
        },
        contact: {
          email: union?.contact?.email || '',
          phone: union?.contact?.phone || '',
          website: union?.contact?.website || ''
        }
      });
    }
  }, [union, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={union ? 'Edit Union' : 'Create Union'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Union Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter union name"
              required
              className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Territory */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Territory</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Territory Description
                </label>
                <textarea
                  value={formData.territory.description}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    territory: { ...prev.territory, description: e.target.value }
                  }))}
                  placeholder="Brief description of the union's territory"
                  rows={2}
                  className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Headquarters */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Headquarters</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.headquarters.address}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    headquarters: { ...prev.headquarters, address: e.target.value }
                  }))}
                  placeholder="Street address"
                  className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  value={formData.headquarters.city}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    headquarters: { ...prev.headquarters, city: e.target.value }
                  }))}
                  placeholder="City"
                  className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State/Province
                </label>
                <input
                  type="text"
                  value={formData.headquarters.state}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    headquarters: { ...prev.headquarters, state: e.target.value }
                  }))}
                  placeholder="State or Province"
                  className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.headquarters.country}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    headquarters: { ...prev.headquarters, country: e.target.value }
                  }))}
                  placeholder="Country"
                  className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.headquarters.postalCode}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    headquarters: { ...prev.headquarters, postalCode: e.target.value }
                  }))}
                  placeholder="Postal/ZIP code"
                  className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Contact Information</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    contact: { ...prev.contact, email: e.target.value }
                  }))}
                  placeholder="contact@union.org"
                  className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.contact.phone}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    contact: { ...prev.contact, phone: e.target.value }
                  }))}
                  placeholder="(123) 456-7890"
                  className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.contact.website}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    contact: { ...prev.contact, website: e.target.value }
                  }))}
                  placeholder="https://www.union.org"
                  className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
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
            {union ? 'Update' : 'Create'} Union
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}