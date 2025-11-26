'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal, { ModalBody, ModalFooter } from './Modal';
import Button from './Button';
import { useToast } from '@/contexts/ToastContext';
import { serviceManagement } from '@/lib/serviceManagement';
import { CalendarIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Event {
  _id: string;
  title: string;
  description?: string;
  
  date: string;
  time?: string;
  location?: string;
  capacity?: number;
}

interface EventsResponse {
  events: Event[];
}

interface EventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  permissions: {
    canManage: boolean;
  };
}

export default function EventsModal({ isOpen, onClose, serviceId, permissions }: EventsModalProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    capacity: ''
  });

  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await serviceManagement.getServiceEvents(serviceId) as EventsResponse;
      setEvents(response.events || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      showErrorToast('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [serviceId, showErrorToast]);

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
      // Reset to add form when modal opens
      setShowAddForm(true);
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        capacity: ''
      });
    }
  }, [isOpen, fetchEvents]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      capacity: ''
    });
    setShowAddForm(true);
    setEditingEvent(null);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      date: new Date(event.date).toISOString().split('T')[0],
      time: event.time || '',
      location: event.location || '',
      capacity: event.capacity ? event.capacity.toString() : ''
    });
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.date) {
      showErrorToast('Please fill in the required fields');
      return;
    }

    try {
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date,
        time: formData.time.trim(),
        location: formData.location.trim(),
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined
      };

      if (editingEvent) {
        await serviceManagement.updateServiceEvent(serviceId, editingEvent._id, eventData);
        showSuccessToast('Event updated successfully');
      } else {
        await serviceManagement.createServiceEvent(serviceId, eventData);
        showSuccessToast('Event created successfully');
      }

      fetchEvents();
      resetForm();
    } catch (error) {
      console.error('Failed to save event:', error);
      showErrorToast('Failed to save event');
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await serviceManagement.deleteServiceEvent(serviceId, eventId);
      showSuccessToast('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      showErrorToast('Failed to delete event');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Events" maxWidth="2xl" theme="orange">
      <ModalBody>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5821F]"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Add/Edit Event Form */}
            {showAddForm && permissions.canManage && (
              <div className="bg-gray-50 rounded-lg p-6 border">
                <h4 className="text-lg font-medium text-gray-800 mb-4">
                  {editingEvent ? 'Edit Event' : 'Add New Event'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5821F] focus:border-transparent"
                      placeholder="Enter event title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5821F] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5821F] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5821F] focus:border-transparent"
                      placeholder="Enter event location"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Capacity
                    </label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5821F] focus:border-transparent"
                      placeholder="Maximum attendees"
                      min="1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5821F] focus:border-transparent"
                      placeholder="Enter event description"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSave}>
                    {editingEvent ? 'Update Event' : 'Add Event'}
                  </Button>
                </div>
              </div>
            )}

            {/* Events List */}
            <div>
              <h4 className="text-lg font-medium text-gray-800 mb-4">
                Events ({events.length})
              </h4>
              {events.length > 0 ? (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <CalendarIcon className="h-5 w-5 text-gray-400" />
                            <h5 className="font-medium text-gray-800">{event.title}</h5>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {formatDate(event.date)}
                            {event.time && ` at ${event.time}`}
                          </p>
                          {event.location && (
                            <p className="text-sm text-gray-500 mb-1">📍 {event.location}</p>
                          )}
                          {event.capacity && (
                            <p className="text-sm text-gray-500 mb-1">
                              👥 Capacity: {event.capacity}
                            </p>
                          )}
                          {event.description && (
                            <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                          )}
                        </div>
                        {permissions.canManage && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(event)}
                              className="text-gray-400 hover:text-[#F5821F] p-1"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(event._id)}
                              className="text-gray-400 hover:text-red-600 p-1"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No events scheduled for this service.</p>
                  {permissions.canManage && (
                    <p className="text-sm text-gray-400 mt-1">
                      Click &quot;Add Event&quot; to schedule your first event.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}