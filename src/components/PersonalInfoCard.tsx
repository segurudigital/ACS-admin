'use client';

import { useState } from 'react';
import { usePermissions } from '../contexts/PermissionContext';
import { useToast } from '../contexts/ToastContext';
import Button from './Button';
import Card from './Card';

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
}

export default function PersonalInfoCard() {
  const { user } = usePermissions();
  const { success, error } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<PersonalInfo>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  if (!user) return null;

  const handleEdit = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || ''
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to update personal information
      // const response = await AuthService.updateProfile(formData);
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsEditing(false);
      success('Personal information updated successfully');
    } catch (updateError) {
      console.error('Update error:', updateError);
      error('Failed to update personal information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof PersonalInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatPhone = (phone: string) => {
    if (!phone) return 'Not provided';
    // Basic phone formatting - can be enhanced based on requirements
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your full name"
              disabled={isLoading}
            />
          ) : (
            <p className="text-gray-900 py-2">{user.name || 'Not provided'}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          {isEditing ? (
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email address"
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {user.verified ? (
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center py-2">
              <span className="text-gray-900">{user.email}</span>
              <div className="ml-2">
                {user.verified ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Unverified
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your phone number"
              disabled={isLoading}
            />
          ) : (
            <p className="text-gray-900 py-2">{formatPhone(user.phone || '')}</p>
          )}
        </div>
      </div>

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
                <strong>Note:</strong> Changing your email address will require re-verification. 
                You&apos;ll receive a verification email at the new address.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}