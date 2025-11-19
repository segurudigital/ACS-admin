import { AuthService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + '/api';

export interface EventListItem {
  _id: string;
  name: string;
  description?: string;
  start: string;
  end: string;
  locationText?: string;
  service: {
    _id: string;
    name: string;
    type: string;
    organization: {
      _id: string;
      name: string;
    };
  };
  organization: {
    _id: string;
    name: string;
  };
  capacity?: {
    maximum: number;
  };
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EventCreateRequest {
  name: string;
  description?: string;
  start: string;
  end: string;
  locationText?: string;
  serviceId: string;
  capacity?: {
    maximum: number;
  };
}

export interface EventFilters {
  search?: string;
  serviceId?: string;
  dateFrom?: string;
  dateTo?: string;
  organizationId?: string;
}

class EventsAPI {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = AuthService.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add organization ID if available
    const organizationId = typeof window !== 'undefined' ? localStorage.getItem('currentOrganizationId') : null;
    if (organizationId) {
      headers['X-Organization-Id'] = organizationId;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getAllEvents(filters?: EventFilters): Promise<EventListItem[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.serviceId) {
        params.append('serviceId', filters.serviceId);
      }
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo);
      }
      if (filters.organizationId) {
        params.append('organizationId', filters.organizationId);
      }
    }

    const queryString = params.toString();
    const url = queryString ? `/admin/events?${queryString}` : '/admin/events';
    
    return this.fetchWithAuth(url);
  }

  async getEventById(eventId: string): Promise<EventListItem> {
    return this.fetchWithAuth(`/admin/events/${eventId}`);
  }

  async createEvent(eventData: EventCreateRequest): Promise<EventListItem> {
    return this.fetchWithAuth('/admin/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(eventId: string, eventData: Partial<EventCreateRequest>): Promise<EventListItem> {
    return this.fetchWithAuth(`/admin/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.fetchWithAuth(`/admin/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  async getServicesForDropdown(): Promise<Array<{ _id: string; name: string; type: string; organization: { name: string } }>> {
    return this.fetchWithAuth('/admin/events/services');
  }
}

export const eventsAPI = new EventsAPI();