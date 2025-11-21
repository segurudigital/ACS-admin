import React, { useState } from 'react';
import Modal, { ModalBody, ModalFooter } from './Modal';
import { OrganizationService } from '../lib/organizationService';
import { Organization } from '../types/rbac';
import { useToast } from '../contexts/ToastContext';

interface QuickSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentOrganization?: Organization;
  onSuccess: (result: { organization: Organization; user: unknown }) => void;
}

interface QuickSetupData {
  organization: {
    name: string;
    type: 'union' | 'conference' | 'church';
    parentId?: string;
    metadata?: {
      email?: string;
      phone?: string;
      address?: string;
    };
  };
  adminUser: {
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
  };
  sendInvitation: boolean;
}

export default function QuickSetupModal({
  isOpen,
  onClose,
  parentOrganization,
  onSuccess,
}: QuickSetupModalProps) {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Helper function to determine the appropriate admin role based on organization type
  const getAdminRoleForOrgType = (orgType: 'union' | 'conference' | 'church') => {
    switch (orgType) {
      case 'union':
        return 'union_admin';
      case 'conference':
        return 'conference_admin';
      case 'church':
        return 'church_pastor';
      default:
        return 'church_pastor';
    }
  };

  const initialOrgType = parentOrganization ? (parentOrganization.type === 'union' ? 'conference' : 'church') : 'union';
  
  const [formData, setFormData] = useState<QuickSetupData>({
    organization: {
      name: '',
      type: initialOrgType,
      parentId: parentOrganization?._id,
      metadata: {
        email: '',
        phone: '',
        address: '',
      },
    },
    adminUser: {
      firstName: '',
      lastName: '',
      email: '',
      role: getAdminRoleForOrgType(initialOrgType),
    },
    sendInvitation: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Organization validation
      if (!formData.organization.name.trim()) {
        newErrors['org.name'] = 'Organization name is required';
      }
      if (!formData.organization.type) {
        newErrors['org.type'] = 'Organization type is required';
      }
      if (formData.organization.type !== 'union' && !formData.organization.parentId) {
        newErrors['org.parent'] = 'Parent organization is required';
      }
      if (formData.organization.metadata?.email && 
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.organization.metadata.email)) {
        newErrors['org.email'] = 'Invalid email address';
      }
    } else if (step === 2) {
      // Admin user validation
      if (!formData.adminUser.firstName.trim()) {
        newErrors['user.firstName'] = 'First name is required';
      }
      if (!formData.adminUser.lastName.trim()) {
        newErrors['user.lastName'] = 'Last name is required';
      }
      if (!formData.adminUser.email.trim()) {
        newErrors['user.email'] = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminUser.email)) {
        newErrors['user.email'] = 'Invalid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await OrganizationService.quickSetup(formData);
      toast.success('Organization and admin user created successfully!');
      onSuccess(result as { organization: Organization; user: unknown });
      onClose();
    } catch (error: unknown) {
      console.error('Quick setup error:', error);
      // Extract error message from the Error object
      const errorMessage = error instanceof Error ? error.message : 'Failed to create organization and user';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Organization Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.organization.name}
                onChange={(e) => setFormData({
                  ...formData,
                  organization: { ...formData.organization, name: e.target.value }
                })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['org.name'] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter organization name"
              />
              {errors['org.name'] && (
                <p className="mt-1 text-sm text-red-600">{errors['org.name']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.organization.type}
                onChange={(e) => {
                  const newType = e.target.value as 'union' | 'conference' | 'church';
                  setFormData({
                    ...formData,
                    organization: { 
                      ...formData.organization, 
                      type: newType,
                      parentId: newType === 'union' ? undefined : formData.organization.parentId
                    },
                    adminUser: {
                      ...formData.adminUser,
                      role: getAdminRoleForOrgType(newType)
                    }
                  });
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['org.type'] ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={!!parentOrganization}
              >
                <option value="union">Union</option>
                <option value="conference">Conference</option>
                <option value="church">Church</option>
              </select>
              {errors['org.type'] && (
                <p className="mt-1 text-sm text-red-600">{errors['org.type']}</p>
              )}
            </div>

            {formData.organization.type !== 'union' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Organization
                </label>
                <input
                  type="text"
                  value={parentOrganization?.name || 'Not selected'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
                {errors['org.parent'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['org.parent']}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Email
              </label>
              <input
                type="email"
                value={formData.organization.metadata?.email || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  organization: {
                    ...formData.organization,
                    metadata: { ...formData.organization.metadata, email: e.target.value }
                  }
                })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['org.email'] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="org@example.com"
              />
              {errors['org.email'] && (
                <p className="mt-1 text-sm text-red-600">{errors['org.email']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.organization.metadata?.phone || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  organization: {
                    ...formData.organization,
                    metadata: { ...formData.organization.metadata, phone: e.target.value }
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+61 2 1234 5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={formData.organization.metadata?.address || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  organization: {
                    ...formData.organization,
                    metadata: { ...formData.organization.metadata, address: e.target.value }
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="123 Main St, Sydney NSW 2000"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Administrator Details</h3>
            <p className="text-sm text-gray-600">
              This user will be the primary administrator for {formData.organization.name || 'the organization'}.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.adminUser.firstName}
                onChange={(e) => setFormData({
                  ...formData,
                  adminUser: { ...formData.adminUser, firstName: e.target.value }
                })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['user.firstName'] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="John"
              />
              {errors['user.firstName'] && (
                <p className="mt-1 text-sm text-red-600">{errors['user.firstName']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.adminUser.lastName}
                onChange={(e) => setFormData({
                  ...formData,
                  adminUser: { ...formData.adminUser, lastName: e.target.value }
                })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['user.lastName'] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Smith"
              />
              {errors['user.lastName'] && (
                <p className="mt-1 text-sm text-red-600">{errors['user.lastName']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.adminUser.email}
                onChange={(e) => setFormData({
                  ...formData,
                  adminUser: { ...formData.adminUser, email: e.target.value }
                })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['user.email'] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="admin@example.com"
              />
              {errors['user.email'] && (
                <p className="mt-1 text-sm text-red-600">{errors['user.email']}</p>
              )}
            </div>

            <div className="pt-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.sendInvitation}
                  onChange={(e) => setFormData({
                    ...formData,
                    sendInvitation: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Send invitation email to administrator
                </span>
              </label>
              <p className="ml-7 text-xs text-gray-500 mt-1">
                The administrator will receive an email to set up their password and access the system.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Review & Confirm</h3>
            <p className="text-sm text-gray-600">
              Please review the details before creating the organization and administrator.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-700">Organization</h4>
                <dl className="mt-2 text-sm text-gray-600 space-y-1">
                  <div>
                    <dt className="inline font-medium">Name:</dt>
                    <dd className="inline ml-2">{formData.organization.name}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">Type:</dt>
                    <dd className="inline ml-2 capitalize">{formData.organization.type}</dd>
                  </div>
                  {parentOrganization && (
                    <div>
                      <dt className="inline font-medium">Parent:</dt>
                      <dd className="inline ml-2">{parentOrganization.name}</dd>
                    </div>
                  )}
                  {formData.organization.metadata?.email && (
                    <div>
                      <dt className="inline font-medium">Email:</dt>
                      <dd className="inline ml-2">{formData.organization.metadata.email}</dd>
                    </div>
                  )}
                  {formData.organization.metadata?.phone && (
                    <div>
                      <dt className="inline font-medium">Phone:</dt>
                      <dd className="inline ml-2">{formData.organization.metadata.phone}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="border-t pt-3">
                <h4 className="text-sm font-semibold text-gray-700">Administrator</h4>
                <dl className="mt-2 text-sm text-gray-600 space-y-1">
                  <div>
                    <dt className="inline font-medium">Name:</dt>
                    <dd className="inline ml-2">{formData.adminUser.firstName} {formData.adminUser.lastName}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">Email:</dt>
                    <dd className="inline ml-2">{formData.adminUser.email}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">Invitation:</dt>
                    <dd className="inline ml-2">
                      {formData.sendInvitation ? 'Will be sent' : 'Will not be sent'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>What happens next:</strong>
              </p>
              <ul className="mt-2 text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>The organization will be created immediately</li>
                <li>The administrator account will be created</li>
                {formData.sendInvitation && (
                  <li>An invitation email will be sent to {formData.adminUser.email}</li>
                )}
                <li>The administrator will be able to set their password and log in</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Setup - Organization & Administrator"
      maxWidth="lg"
    >
      <ModalBody>
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center ${step < 3 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep >= step
                      ? 'bg-[#F5821F] text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step ? 'bg-[#F5821F]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-600">Organization</span>
            <span className="text-xs text-gray-600">Administrator</span>
            <span className="text-xs text-gray-600">Review</span>
          </div>
        </div>

        {/* Step content */}
        {renderStepContent()}
      </ModalBody>

      <ModalFooter>
        <div className="flex justify-between w-full">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Back
          </button>
          
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-white bg-[#F5821F] rounded-md hover:bg-[#e0741c]"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#F5821F] hover:bg-[#e0741c]'
                }`}
              >
                {isSubmitting ? 'Creating...' : 'Create Organization & User'}
              </button>
            )}
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
}