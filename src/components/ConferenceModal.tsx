'use client';

import React, { useState } from 'react';
import Modal, { ModalBody, ModalFooter } from './Modal';
import { ConferenceService } from '@/lib/conferenceService';
import { Conference } from '@/types/rbac';
import { Union } from '@/types/hierarchy';
import { useToast } from '@/contexts/ToastContext';

interface ConferenceWithUnion extends Omit<Conference, 'unionId'> {
  unionId: Union | string;
}

interface ConferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (savedConference: ConferenceWithUnion, isEdit: boolean) => void;
  conference?: ConferenceWithUnion | null;
  unions: Union[];
}

export default function ConferenceModal({ 
  isOpen, 
  onClose, 
  onSave, 
  conference, 
  unions 
}: ConferenceModalProps) {
  const [formData, setFormData] = useState({
    name: conference?.name || '',
    unionId: (typeof conference?.unionId === 'string' ? conference.unionId : conference?.unionId?._id) || '',
    territory: {
      description: conference?.metadata?.territory?.join(', ') || ''
    },
    headquarters: {
      address: conference?.metadata?.address || '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    contact: {
      email: conference?.metadata?.email || '',
      phone: conference?.metadata?.phone || '',
      website: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Helper function to provide user-friendly error messages
  const getUserFriendlyErrorMessage = (errorMessage: string) => {
    const lowerMessage = errorMessage.toLowerCase();
    
    if (lowerMessage.includes('name') && lowerMessage.includes('required')) {
      return 'Conference name is required. Please enter a name for the conference.';
    }
    
    
    if (lowerMessage.includes('union') && lowerMessage.includes('required')) {
      return 'Please select a parent union for this conference.';
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
      
      // Prepare the data according to the backend Conference model schema
      const conferenceData = {
        name: formData.name,
        unionId: formData.unionId,
        territory: {
          description: formData.territory.description
        },
        headquarters: {
          address: formData.headquarters.address,
          city: formData.headquarters.city,
          state: formData.headquarters.state,
          country: formData.headquarters.country,
          postalCode: formData.headquarters.postalCode
        },
        contact: {
          email: formData.contact.email,
          phone: formData.contact.phone,
          website: formData.contact.website
        }
      };

      let response;
      if (conference) {
        // Update existing conference
        response = await ConferenceService.updateConference(conference._id, conferenceData);
      } else {
        // Create new conference
        response = await ConferenceService.createConference(conferenceData);
      }
      
      if (response.success && response.data) {
        onSave(response.data as ConferenceWithUnion, !!conference);
      } else {
        const errorMessage = response.message || 'An unknown error occurred';
        const userFriendlyMessage = getUserFriendlyErrorMessage(errorMessage);
        
        toast.error(
          conference ? 'Failed to update conference' : 'Failed to create conference',
          userFriendlyMessage
        );
      }
    } catch (error) {
      console.error('Error saving conference:', error);
      
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      const userFriendlyMessage = getUserFriendlyErrorMessage(errorMessage);
      
      toast.error(
        conference ? 'Failed to update conference' : 'Failed to create conference',
        userFriendlyMessage
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset form when conference changes or modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: conference?.name || '',
        unionId: (typeof conference?.unionId === 'string' ? conference.unionId : conference?.unionId?._id) || '',
        territory: {
          description: conference?.metadata?.territory?.join(', ') || ''
        },
        headquarters: {
          address: conference?.metadata?.address || '',
          city: '',
          state: '',
          country: '',
          postalCode: ''
        },
        contact: {
          email: conference?.metadata?.email || '',
          phone: conference?.metadata?.phone || '',
          website: ''
        }
      });
    }
  }, [conference, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={conference ? 'Edit Conference' : 'Create Conference'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-6">

          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Conference Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter conference name"
              required
              className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Parent Union */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Parent Union *
            </label>
            <select
              value={formData.unionId}
              onChange={(e) => setFormData(prev => ({ ...prev, unionId: e.target.value }))}
              required
              className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Select a union</option>
              {unions.map(union => (
                <option key={union._id} value={union._id}>
                  {union.name}
                </option>
              ))}
            </select>
          </div>

          {/* Territory */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Territory</h4>
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
                placeholder="Brief description of the conference's territory or regions"
                rows={2}
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
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
                  placeholder="contact@conference.org"
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
                  placeholder="https://www.conference.org"
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
            disabled={loading || !formData.name || !formData.unionId}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#F5821F] hover:bg-[#e0741c] disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (conference ? 'Update' : 'Create')} Conference
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}