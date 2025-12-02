'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal, { ModalBody, ModalFooter } from './Modal';
import Button from './Button';
import { useToast } from '@/contexts/ToastContext';
import { volunteerOpportunitiesAPI, VolunteerOpportunityListItem, VolunteerOpportunityCreateRequest } from '@/lib/volunteerOpportunitiesAPI';

interface VolunteerOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpportunitySaved: () => void;
  opportunity?: VolunteerOpportunityListItem;
}

export default function VolunteerOpportunityModal({ isOpen, onClose, onOpportunitySaved, opportunity }: VolunteerOpportunityModalProps) {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Array<{ _id: string; name: string; type: string }>>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    serviceId: '',
    category: '',
    requirements: {
      skills: [] as string[],
      experience: '',
      backgroundCheck: false,
      workingWithChildrenCheck: false,
      minimumAge: '',
      physicalRequirements: '',
      otherRequirements: '',
    },
    timeCommitment: {
      type: 'flexible' as 'one_time' | 'occasional' | 'regular' | 'flexible',
      hoursPerWeekMin: '',
      hoursPerWeekMax: '',
      duration: '',
      schedule: '',
      description: '',
    },
    location: {
      type: 'on_site' as 'on_site' | 'remote' | 'hybrid',
      details: '',
    },
    benefits: [] as string[],
    numberOfPositions: '1',
    status: 'draft' as 'draft' | 'open' | 'closed' | 'filled' | 'paused',
    visibility: 'public' as 'public' | 'members_only' | 'private',
    applicationProcess: {
      method: 'email' as 'email' | 'phone' | 'online_form' | 'in_person',
      contactEmail: '',
      contactPhone: '',
      applicationLink: '',
      additionalInfo: '',
    },
    startDate: '',
    endDate: '',
    tags: [] as string[],
    skillsInput: '',
    benefitsInput: '',
    tagsInput: '',
  });

  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const fetchServices = useCallback(async () => {
    try {
      const servicesData = await volunteerOpportunitiesAPI.getServicesForDropdown();
      setServices(servicesData || []);
    } catch (error) {
      console.error('Failed to fetch services:', error);
      // Only show error toast if it's a real error, not when services array is empty
      if (error && error instanceof Error && error.message !== 'No services found') {
        showErrorToast('Failed to load services');
      }
    }
  }, [showErrorToast]);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      if (opportunity) {
        // Editing existing opportunity
        setFormData({
          title: opportunity.title,
          description: opportunity.description,
          serviceId: opportunity.service._id,
          category: opportunity.category,
          requirements: {
            skills: opportunity.requirements?.skills || [],
            experience: opportunity.requirements?.experience || '',
            backgroundCheck: opportunity.requirements?.backgroundCheck || false,
            workingWithChildrenCheck: opportunity.requirements?.workingWithChildrenCheck || false,
            minimumAge: opportunity.requirements?.minimumAge?.toString() || '',
            physicalRequirements: opportunity.requirements?.physicalRequirements || '',
            otherRequirements: opportunity.requirements?.otherRequirements || '',
          },
          timeCommitment: {
            type: opportunity.timeCommitment?.type || 'flexible',
            hoursPerWeekMin: opportunity.timeCommitment?.hoursPerWeek?.minimum?.toString() || '',
            hoursPerWeekMax: opportunity.timeCommitment?.hoursPerWeek?.maximum?.toString() || '',
            duration: opportunity.timeCommitment?.duration || '',
            schedule: opportunity.timeCommitment?.schedule || '',
            description: opportunity.timeCommitment?.description || '',
          },
          location: {
            type: opportunity.location?.type || 'on_site',
            details: opportunity.location?.details || '',
          },
          benefits: opportunity.benefits || [],
          numberOfPositions: opportunity.numberOfPositions?.toString() || '1',
          status: opportunity.status,
          visibility: opportunity.visibility,
          applicationProcess: {
            method: opportunity.applicationProcess?.method || 'email',
            contactEmail: opportunity.applicationProcess?.contactEmail || '',
            contactPhone: opportunity.applicationProcess?.contactPhone || '',
            applicationLink: opportunity.applicationProcess?.applicationLink || '',
            additionalInfo: opportunity.applicationProcess?.additionalInfo || '',
          },
          startDate: opportunity.startDate ? new Date(opportunity.startDate).toISOString().split('T')[0] : '',
          endDate: opportunity.endDate ? new Date(opportunity.endDate).toISOString().split('T')[0] : '',
          tags: opportunity.tags || [],
          skillsInput: (opportunity.requirements?.skills || []).join(', '),
          benefitsInput: (opportunity.benefits || []).join(', '),
          tagsInput: (opportunity.tags || []).join(', '),
        });
      } else {
        // Creating new opportunity
        setFormData({
          title: '',
          description: '',
          serviceId: '',
          category: '',
          requirements: {
            skills: [],
            experience: '',
            backgroundCheck: false,
            workingWithChildrenCheck: false,
            minimumAge: '',
            physicalRequirements: '',
            otherRequirements: '',
          },
          timeCommitment: {
            type: 'flexible',
            hoursPerWeekMin: '',
            hoursPerWeekMax: '',
            duration: '',
            schedule: '',
            description: '',
          },
          location: {
            type: 'on_site',
            details: '',
          },
          benefits: [],
          numberOfPositions: '1',
          status: 'draft',
          visibility: 'public',
          applicationProcess: {
            method: 'email',
            contactEmail: '',
            contactPhone: '',
            applicationLink: '',
            additionalInfo: '',
          },
          startDate: '',
          endDate: '',
          tags: [],
          skillsInput: '',
          benefitsInput: '',
          tagsInput: '',
        });
      }
      
      // Fetch services for dropdown
      fetchServices();
    }
  }, [isOpen, opportunity, fetchServices]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      serviceId: '',
      category: 'other',
      requirements: {
        skills: [],
        experience: '',
        backgroundCheck: false,
        workingWithChildrenCheck: false,
        minimumAge: '',
        physicalRequirements: '',
        otherRequirements: '',
      },
      timeCommitment: {
        type: 'flexible',
        hoursPerWeekMin: '',
        hoursPerWeekMax: '',
        duration: '',
        schedule: '',
        description: '',
      },
      location: {
        type: 'on_site',
        details: '',
      },
      benefits: [],
      numberOfPositions: '1',
      status: 'draft',
      visibility: 'public',
      applicationProcess: {
        method: 'email',
        contactEmail: '',
        contactPhone: '',
        applicationLink: '',
        additionalInfo: '',
      },
      startDate: '',
      endDate: '',
      tags: [],
      skillsInput: '',
      benefitsInput: '',
      tagsInput: '',
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.serviceId) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Process array fields
      const skills = formData.skillsInput.split(',').map(s => s.trim()).filter(s => s);
      const benefits = formData.benefitsInput.split(',').map(b => b.trim()).filter(b => b);
      const tags = formData.tagsInput.split(',').map(t => t.trim()).filter(t => t);

      const opportunityData: VolunteerOpportunityCreateRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        serviceId: formData.serviceId,
        category: formData.category,
        requirements: {
          skills: skills.length > 0 ? skills : undefined,
          experience: formData.requirements.experience.trim() || undefined,
          backgroundCheck: formData.requirements.backgroundCheck,
          workingWithChildrenCheck: formData.requirements.workingWithChildrenCheck,
          minimumAge: formData.requirements.minimumAge ? parseInt(formData.requirements.minimumAge) : undefined,
          physicalRequirements: formData.requirements.physicalRequirements.trim() || undefined,
          otherRequirements: formData.requirements.otherRequirements.trim() || undefined,
        },
        timeCommitment: {
          type: formData.timeCommitment.type,
          hoursPerWeek: (formData.timeCommitment.hoursPerWeekMin || formData.timeCommitment.hoursPerWeekMax) ? {
            minimum: formData.timeCommitment.hoursPerWeekMin ? parseInt(formData.timeCommitment.hoursPerWeekMin) : undefined,
            maximum: formData.timeCommitment.hoursPerWeekMax ? parseInt(formData.timeCommitment.hoursPerWeekMax) : undefined,
          } : undefined,
          duration: formData.timeCommitment.duration.trim() || undefined,
          schedule: formData.timeCommitment.schedule.trim() || undefined,
          description: formData.timeCommitment.description.trim() || undefined,
        },
        location: {
          type: formData.location.type,
          details: formData.location.details.trim() || undefined,
        },
        benefits: benefits.length > 0 ? benefits : undefined,
        numberOfPositions: parseInt(formData.numberOfPositions) || 1,
        status: formData.status,
        visibility: formData.visibility,
        applicationProcess: {
          method: formData.applicationProcess.method,
          contactEmail: formData.applicationProcess.contactEmail.trim() || undefined,
          contactPhone: formData.applicationProcess.contactPhone.trim() || undefined,
          applicationLink: formData.applicationProcess.applicationLink.trim() || undefined,
          additionalInfo: formData.applicationProcess.additionalInfo.trim() || undefined,
        },
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        tags: tags.length > 0 ? tags : undefined,
      };

      if (opportunity) {
        await volunteerOpportunitiesAPI.updateOpportunity(opportunity._id, opportunityData);
        showSuccessToast('Volunteer opportunity updated successfully');
      } else {
        await volunteerOpportunitiesAPI.createOpportunity(opportunityData);
        showSuccessToast('Volunteer opportunity created successfully');
      }

      resetForm();
      onOpportunitySaved();
    } catch (error) {
      console.error('Failed to save volunteer opportunity:', error);
      showErrorToast(`Failed to save volunteer opportunity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };


  const timeCommitmentTypes = [
    { value: 'one_time', label: 'One Time' },
    { value: 'occasional', label: 'Occasional' },
    { value: 'regular', label: 'Regular' },
    { value: 'flexible', label: 'Flexible' },
  ];

  const locationTypes = [
    { value: 'on_site', label: 'On Site' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
  ];

  const applicationMethods = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'online_form', label: 'Online Form' },
    { value: 'in_person', label: 'In Person' },
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'open', label: 'Open' },
    { value: 'paused', label: 'Paused' },
    { value: 'closed', label: 'Closed' },
  ];

  const visibilityOptions = [
    { value: 'public', label: 'Public' },
    { value: 'members_only', label: 'Members Only' },
    { value: 'private', label: 'Private' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={opportunity ? "Edit Volunteer Opportunity" : "Create Volunteer Opportunity"} maxWidth="2xl" removeBorder={true}>
      <ModalBody>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter volunteer opportunity title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Service *
                  </label>
                  <select
                    value={formData.serviceId}
                    onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                    disabled={!!opportunity} // Disable when editing
                  >
                    <option value="">Select a service</option>
                    {services.map((service) => (
                      <option key={service._id} value={service._id}>
                        {service.name} - {service.type}
                      </option>
                    ))}
                  </select>
                  {opportunity && (
                    <p className="mt-1 text-xs text-gray-500">
                      Service cannot be changed when editing an opportunity
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Administration, Direct Service, Technology"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Describe the volunteer role, responsibilities, and expectations"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Required Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.skillsInput}
                    onChange={(e) => setFormData({ ...formData, skillsInput: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Communication, Leadership, Computer Skills"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Minimum Age
                  </label>
                  <input
                    type="number"
                    value={formData.requirements.minimumAge}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      requirements: { ...formData.requirements, minimumAge: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="16"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Experience Required
                  </label>
                  <input
                    type="text"
                    value={formData.requirements.experience}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      requirements: { ...formData.requirements, experience: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="No experience required"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.requirements.backgroundCheck}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          requirements: { ...formData.requirements, backgroundCheck: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-800">Background Check Required</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.requirements.workingWithChildrenCheck}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          requirements: { ...formData.requirements, workingWithChildrenCheck: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-800">Working with Children Check</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Commitment & Location */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Time Commitment & Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Commitment Type
                  </label>
                  <select
                    value={formData.timeCommitment.type}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      timeCommitment: { ...formData.timeCommitment, type: e.target.value as 'one_time' | 'occasional' | 'regular' | 'flexible' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {timeCommitmentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Location Type
                  </label>
                  <select
                    value={formData.location.type}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      location: { ...formData.location, type: e.target.value as 'on_site' | 'remote' | 'hybrid' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {locationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Hours Per Week (Min)
                  </label>
                  <input
                    type="number"
                    value={formData.timeCommitment.hoursPerWeekMin}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      timeCommitment: { ...formData.timeCommitment, hoursPerWeekMin: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="1"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Hours Per Week (Max)
                  </label>
                  <input
                    type="number"
                    value={formData.timeCommitment.hoursPerWeekMax}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      timeCommitment: { ...formData.timeCommitment, hoursPerWeekMax: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="10"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Number of Positions
                  </label>
                  <input
                    type="number"
                    value={formData.numberOfPositions}
                    onChange={(e) => setFormData({ ...formData, numberOfPositions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="1"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'open' | 'closed' | 'filled' | 'paused' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Application Process */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Application Process</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Application Method
                  </label>
                  <select
                    value={formData.applicationProcess.method}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      applicationProcess: { ...formData.applicationProcess, method: e.target.value as 'email' | 'phone' | 'online_form' | 'in_person' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {applicationMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Visibility
                  </label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'public' | 'members_only' | 'private' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {visibilityOptions.map((visibility) => (
                      <option key={visibility.value} value={visibility.value}>
                        {visibility.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.applicationProcess.contactEmail}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      applicationProcess: { ...formData.applicationProcess, contactEmail: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="volunteer@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.applicationProcess.contactPhone}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      applicationProcess: { ...formData.applicationProcess, contactPhone: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Benefits (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.benefitsInput}
                    onChange={(e) => setFormData({ ...formData, benefitsInput: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Training provided, Community service hours, Networking opportunities"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : (opportunity ? 'Update Opportunity' : 'Create Opportunity')}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}