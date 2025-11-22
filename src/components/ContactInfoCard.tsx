'use client';

import { useState } from 'react';
import { usePermissions } from '../contexts/HierarchicalPermissionContext';
import { useToast } from '../contexts/ToastContext';
import Button from './Button';
import Card from './Card';

interface ContactInfo {
  address: string;
  city: string;
  state: string;
  country: string;
}

export default function ContactInfoCard() {
  const { user } = usePermissions();
  const { success, error } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ContactInfo>({
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    country: user?.country || 'Australia'
  });

  if (!user) return null;

  const handleEdit = () => {
    setFormData({
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      country: user.country || 'Australia'
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      country: user.country || 'Australia'
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to update contact information
      // const response = await AuthService.updateContactInfo(formData);
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsEditing(false);
      success('Contact information updated successfully');
    } catch (updateError) {
      console.error('Update error:', updateError);
      error('Failed to update contact information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ContactInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatAddress = () => {
    const parts = [
      user.address,
      user.city,
      user.state,
      user.country
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'Not provided';
  };

  // Australian states for dropdown
  const australianStates = [
    'Australian Capital Territory',
    'New South Wales',
    'Northern Territory',
    'Queensland',
    'South Australia',
    'Tasmania',
    'Victoria',
    'Western Australia'
  ];

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
        {!isEditing ? (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleEdit}
            leftIcon={({ className }) => (
              <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            )}
          >
            Edit
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleSave}
              loading={isLoading}
              leftIcon={({ className }) => (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            >
              Save
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="grid grid-cols-1 gap-6">
          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your street address"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your city"
                disabled={isLoading}
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State/Territory
              </label>
              <select
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value="">Select state/territory</option>
                {australianStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="Australia">Australia</option>
              <option value="New Zealand">New Zealand</option>
              <option value="Papua New Guinea">Papua New Guinea</option>
              <option value="Fiji">Fiji</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Address</h3>
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                {formatAddress()}
              </p>
            </div>
          </div>

          {(user.address || user.city || user.state || user.country) && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">City:</span>{' '}
                  <span className="text-gray-600">{user.city || 'Not specified'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">State:</span>{' '}
                  <span className="text-gray-600">{user.state || 'Not specified'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="font-medium text-gray-700">Country:</span>{' '}
                  <span className="text-gray-600">{user.country || 'Not specified'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isEditing && (
        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Privacy:</strong> Your address information is kept secure and is only used for 
                organizational communication and service coordination purposes.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}