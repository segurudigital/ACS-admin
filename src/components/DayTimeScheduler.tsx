'use client';

import { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { WeeklySchedule, DaySchedule, TimeSlot, DAYS_OF_WEEK } from '@/types/scheduling';

interface DayTimeSchedulerProps {
  schedule: WeeklySchedule;
  onChange: (schedule: WeeklySchedule) => void;
}

export default function DayTimeScheduler({ schedule, onChange }: DayTimeSchedulerProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5])); // Weekdays expanded by default

  const toggleDay = (dayOfWeek: number) => {
    const updatedSchedule = {
      ...schedule,
      schedule: schedule.schedule.map(day => 
        day.dayOfWeek === dayOfWeek 
          ? { ...day, isEnabled: !day.isEnabled, timeSlots: !day.isEnabled ? [] : day.timeSlots }
          : day
      )
    };
    onChange(updatedSchedule);
  };

  const toggleDayExpansion = (dayOfWeek: number) => {
    const newExpandedDays = new Set(expandedDays);
    if (newExpandedDays.has(dayOfWeek)) {
      newExpandedDays.delete(dayOfWeek);
    } else {
      newExpandedDays.add(dayOfWeek);
    }
    setExpandedDays(newExpandedDays);
  };

  const addTimeSlot = (dayOfWeek: number) => {
    const updatedSchedule = {
      ...schedule,
      schedule: schedule.schedule.map(day => 
        day.dayOfWeek === dayOfWeek 
          ? { 
              ...day, 
              timeSlots: [...day.timeSlots, { 
                startTime: '09:00', 
                endTime: '17:00',
                id: `${dayOfWeek}-${Date.now()}`
              }]
            }
          : day
      )
    };
    onChange(updatedSchedule);
  };

  const updateTimeSlot = (dayOfWeek: number, slotIndex: number, field: 'startTime' | 'endTime', value: string) => {
    const updatedSchedule = {
      ...schedule,
      schedule: schedule.schedule.map(day => 
        day.dayOfWeek === dayOfWeek 
          ? { 
              ...day, 
              timeSlots: day.timeSlots.map((slot, index) => 
                index === slotIndex ? { ...slot, [field]: value } : slot
              )
            }
          : day
      )
    };
    onChange(updatedSchedule);
  };

  const removeTimeSlot = (dayOfWeek: number, slotIndex: number) => {
    const updatedSchedule = {
      ...schedule,
      schedule: schedule.schedule.map(day => 
        day.dayOfWeek === dayOfWeek 
          ? { 
              ...day, 
              timeSlots: day.timeSlots.filter((_, index) => index !== slotIndex)
            }
          : day
      )
    };
    onChange(updatedSchedule);
  };

  const getDaySchedule = (dayOfWeek: number): DaySchedule => {
    return schedule.schedule.find(day => day.dayOfWeek === dayOfWeek) || {
      dayOfWeek,
      timeSlots: [],
      isEnabled: false
    };
  };

  const formatTimeDisplay = (timeSlots: TimeSlot[]) => {
    if (timeSlots.length === 0) return 'Closed';
    return timeSlots.map(slot => `${slot.startTime} - ${slot.endTime}`).join(', ');
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-800">Weekly Schedule</h4>
        <select
          value={schedule.timezone || 'Australia/Sydney'}
          onChange={(e) => onChange({ ...schedule, timezone: e.target.value })}
          className="text-xs px-2 py-1 rounded border border-gray-300 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="Australia/Sydney">Sydney (AEDT)</option>
          <option value="Australia/Melbourne">Melbourne (AEDT)</option>
          <option value="Australia/Brisbane">Brisbane (AEST)</option>
          <option value="Australia/Perth">Perth (AWST)</option>
          <option value="Australia/Adelaide">Adelaide (ACDT)</option>
        </select>
      </div>

      <div className="space-y-2">
        {DAYS_OF_WEEK.map((dayName, dayOfWeek) => {
          const daySchedule = getDaySchedule(dayOfWeek);
          const isExpanded = expandedDays.has(dayOfWeek);
          
          return (
            <div key={dayOfWeek} className="border border-gray-200 rounded-lg">
              <div 
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleDayExpansion(dayOfWeek)}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={daySchedule.isEnabled}
                    onChange={() => toggleDay(dayOfWeek)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{dayName}</div>
                    <div className="text-sm text-gray-500">
                      {formatTimeDisplay(daySchedule.timeSlots)}
                    </div>
                  </div>
                </div>
                <div className="text-gray-400">
                  {isExpanded ? '−' : '+'}
                </div>
              </div>

              {isExpanded && daySchedule.isEnabled && (
                <div className="px-3 pb-3 border-t border-gray-100">
                  <div className="space-y-2 mt-3">
                    {daySchedule.timeSlots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateTimeSlot(dayOfWeek, slotIndex, 'startTime', e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateTimeSlot(dayOfWeek, slotIndex, 'endTime', e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(dayOfWeek, slotIndex)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addTimeSlot(dayOfWeek)}
                      className="flex items-center space-x-1 text-sm font-medium text-gray-900 hover:text-gray-700"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Add time slot</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-gray-500 mt-3">
        <p>• Check days when the service is available</p>
        <p>• Click on a day to add multiple time slots</p>
        <p>• All times are in the selected timezone</p>
      </div>
    </div>
  );
}