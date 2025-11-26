'use client';

import { useState } from 'react';
import { PlusIcon, TrashIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { ServiceEvent } from '@/types/scheduling';

interface EventSchedulerProps {
  events: ServiceEvent[];
  onChange: (events: ServiceEvent[]) => void;
  timezone?: string;
}

export default function EventScheduler({ events = [], onChange, timezone = 'Australia/Sydney' }: EventSchedulerProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const addEvent = () => {
    const now = new Date();
    const startDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0);
    const endDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 17, 0);

    const newEvent: ServiceEvent = {
      id: `event-${Date.now()}`,
      name: '',
      description: '',
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      timezone,
      isRecurring: false,
    };

    onChange([...events, newEvent]);
    setExpandedEvents(prev => new Set([...prev, newEvent.id!]));
  };

  const updateEvent = (eventId: string, updates: Partial<ServiceEvent>) => {
    onChange(events.map(event => 
      event.id === eventId ? { ...event, ...updates } : event
    ));
  };

  const removeEvent = (eventId: string) => {
    onChange(events.filter(event => event.id !== eventId));
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      newSet.delete(eventId);
      return newSet;
    });
  };

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const formatDateTime = (isoString: string): { date: string; time: string } => {
    const date = new Date(isoString);
    return {
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().slice(0, 5)
    };
  };

  const combineDateTime = (date: string, time: string): string => {
    return new Date(`${date}T${time}`).toISOString();
  };

  const formatEventSummary = (event: ServiceEvent) => {
    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);
    
    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone: event.timezone || timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    };
    
    const sameDay = start.toDateString() === end.toDateString();
    
    if (sameDay) {
      return `${start.toLocaleDateString('en-AU', formatOptions)} - ${end.toLocaleTimeString('en-AU', { 
        timeZone: event.timezone || timezone, 
        hour: 'numeric', 
        minute: '2-digit' 
      })}`;
    } else {
      return `${start.toLocaleDateString('en-AU', formatOptions)} - ${end.toLocaleDateString('en-AU', formatOptions)}`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-800">Service Events</h4>
        <button
          type="button"
          onClick={addEvent}
          className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-white bg-[#F25F29] border border-transparent rounded-md hover:bg-[#F23E16] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Event</span>
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
          <CalendarIcon className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No events scheduled</p>
          <p className="text-xs text-gray-400">Add events to specify when this service is available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const isExpanded = expandedEvents.has(event.id!);
            const start = formatDateTime(event.startDateTime);
            const end = formatDateTime(event.endDateTime);
            
            return (
              <div key={event.id} className="border border-gray-200 rounded-lg">
                <div 
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleEventExpansion(event.id!)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">
                      {event.name || 'Untitled Event'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatEventSummary(event)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEvent(event.id!);
                      }}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                    <div className="text-gray-400">
                      {isExpanded ? '−' : '+'}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-gray-100 space-y-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Event Name
                      </label>
                      <input
                        type="text"
                        value={event.name}
                        onChange={(e) => updateEvent(event.id!, { name: e.target.value })}
                        placeholder="Enter event name"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        value={event.description || ''}
                        onChange={(e) => updateEvent(event.id!, { description: e.target.value })}
                        placeholder="Brief description of this event"
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Start Date & Time
                        </label>
                        <div className="space-y-1">
                          <input
                            type="date"
                            value={start.date}
                            onChange={(e) => updateEvent(event.id!, { 
                              startDateTime: combineDateTime(e.target.value, start.time)
                            })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          />
                          <input
                            type="time"
                            value={start.time}
                            onChange={(e) => updateEvent(event.id!, { 
                              startDateTime: combineDateTime(start.date, e.target.value)
                            })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          End Date & Time
                        </label>
                        <div className="space-y-1">
                          <input
                            type="date"
                            value={end.date}
                            onChange={(e) => updateEvent(event.id!, { 
                              endDateTime: combineDateTime(e.target.value, end.time)
                            })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          />
                          <input
                            type="time"
                            value={end.time}
                            onChange={(e) => updateEvent(event.id!, { 
                              endDateTime: combineDateTime(end.date, e.target.value)
                            })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={event.isRecurring || false}
                          onChange={(e) => updateEvent(event.id!, { isRecurring: e.target.checked })}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Recurring Event</span>
                      </label>
                    </div>

                    {event.isRecurring && (
                      <div className="pl-6 space-y-3 border-l-2 border-orange-200">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Repeat Pattern
                            </label>
                            <select
                              value={event.recurrencePattern?.type || 'weekly'}
                              onChange={(e) => updateEvent(event.id!, { 
                                recurrencePattern: { 
                                  type: e.target.value as 'daily' | 'weekly' | 'monthly',
                                  interval: event.recurrencePattern?.interval || 1,
                                  ...(event.recurrencePattern?.endDate && { endDate: event.recurrencePattern.endDate }),
                                  ...(event.recurrencePattern?.daysOfWeek && { daysOfWeek: event.recurrencePattern.daysOfWeek })
                                }
                              })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                            >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Every
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="1"
                                max="52"
                                value={event.recurrencePattern?.interval || 1}
                                onChange={(e) => updateEvent(event.id!, { 
                                  recurrencePattern: { 
                                    type: event.recurrencePattern?.type || 'weekly',
                                    interval: parseInt(e.target.value),
                                    ...(event.recurrencePattern?.endDate && { endDate: event.recurrencePattern.endDate }),
                                    ...(event.recurrencePattern?.daysOfWeek && { daysOfWeek: event.recurrencePattern.daysOfWeek })
                                  }
                                })}
                                className="w-16 px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                              />
                              <span className="text-sm text-gray-500">
                                {event.recurrencePattern?.type || 'week'}(s)
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            End Recurrence (Optional)
                          </label>
                          <input
                            type="date"
                            value={event.recurrencePattern?.endDate || ''}
                            onChange={(e) => updateEvent(event.id!, { 
                              recurrencePattern: { 
                                type: event.recurrencePattern?.type || 'weekly',
                                interval: event.recurrencePattern?.interval || 1,
                                ...(e.target.value && { endDate: e.target.value }),
                                ...(event.recurrencePattern?.daysOfWeek && { daysOfWeek: event.recurrencePattern.daysOfWeek })
                              }
                            })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Add specific events when this service is available</p>
        <p>• Use recurring events for regular schedules</p>
        <p>• All times are in {timezone} timezone</p>
      </div>
    </div>
  );
}