// Scheduling data structures for services

export interface TimeSlot {
  startTime: string; // HH:mm format (24-hour)
  endTime: string;   // HH:mm format (24-hour)
  id?: string;       // For frontend management
}

export interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  timeSlots: TimeSlot[];
  isEnabled: boolean;
}

export interface WeeklySchedule {
  timezone?: string; // e.g., "Australia/Sydney"
  schedule: DaySchedule[];
}

export interface ServiceEvent {
  id?: string;
  name: string;
  description?: string;
  startDateTime: string; // ISO 8601 format
  endDateTime: string;   // ISO 8601 format
  timezone?: string;
  isRecurring?: boolean;
  recurrencePattern?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number; // e.g., every 2 weeks
    endDate?: string; // when to stop recurring
    daysOfWeek?: number[]; // for weekly recurrence
  };
}

export interface ServiceScheduling {
  availability: 'always_open' | 'set_times' | 'set_events' | null;
  weeklySchedule?: WeeklySchedule;
  events?: ServiceEvent[];
  lastUpdated?: string;
}

// Utility types
export const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
  'Thursday', 'Friday', 'Saturday'
] as const;

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  timezone: 'Australia/Sydney',
  schedule: DAYS_OF_WEEK.map((_, index) => ({
    dayOfWeek: index,
    timeSlots: [],
    isEnabled: false,
  }))
};