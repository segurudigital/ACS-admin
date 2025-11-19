import { AuthService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + '/api';

export interface Service {
  _id: string;
  name: string;
  type: string;
  organization: {
    _id: string;
    name: string;
    type: string;
  };
  descriptionShort: string;
  descriptionLong: string;
  status: 'active' | 'paused' | 'archived';
  locations: Array<{
    label: string;
    address: {
      street?: string;
      suburb?: string;
      state?: string;
      postcode?: string;
    };
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;
  primaryImage?: {
    url: string;
    alt: string;
  };
  tags?: string[];
  contactInfo: {
    email?: string;
    phone?: string;
    website?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCreateRequest {
  name: string;
  type: string;
  organization: string; // Organization ID as string
  descriptionShort: string;
  descriptionLong: string;
  status: 'active' | 'paused' | 'archived';
  locations: Array<{
    label: string;
    address: {
      street?: string;
      suburb?: string;
      state?: string;
      postcode?: string;
    };
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;
  primaryImage?: {
    url: string;
    alt: string;
  };
  tags?: string[];
  contactInfo: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

export interface ServiceEvent {
  _id: string;
  service: string;
  name: string;
  description: string;
  start: string;
  end: string;
  locationText: string;
  status: string;
}

export interface ServiceStats {
  totalServices: number;
  activeServices: number;
  upcomingEvents: number;
  openVolunteerRoles: number;
  publishedStories: number;
}

export interface ServicePermissions {
  [organizationId: string]: {
    organizationName: string;
    organizationType: string;
    canCreateServices: boolean;
    canUpdateServices: boolean;
    canDeleteServices: boolean;
    canManageServices: boolean;
    canCreateStories: boolean;
  };
}

class ServiceManagementService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = AuthService.getToken();
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Request failed');
    }

    return response.json();
  }

  // Get user's service permissions
  async getServicePermissions(): Promise<ServicePermissions> {
    const data = await this.fetchWithAuth('/admin/services/permissions');
    return data.permissions;
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<ServiceStats> {
    const data = await this.fetchWithAuth('/admin/services/dashboard-stats');
    return data.stats;
  }

  // Get services with filters
  async getServices(params: {
    page?: number;
    limit?: number;
    organization?: string;
    type?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.fetchWithAuth(`/admin/services?${queryParams}`);
  }

  // Get single service with full details
  async getServiceDetails(serviceId: string) {
    return this.fetchWithAuth(`/admin/services/${serviceId}/full`);
  }

  // Get organizations where user can create services
  async getServiceOrganizations() {
    return this.fetchWithAuth('/admin/services/organizations');
  }

  // Get available service types
  async getServiceTypes() {
    return this.fetchWithAuth('/admin/services/types');
  }

  // Create a new service
  async createService(serviceData: ServiceCreateRequest) {
    // Convert organization to organizationId for backend compatibility
    const { organization, ...restData } = serviceData;
    const payload = {
      ...restData,
      organizationId: organization
    };
    
    return this.fetchWithAuth('/services', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Update a service
  async updateService(serviceId: string, updates: ServiceCreateRequest) {
    // Convert organization to organizationId for backend compatibility
    const { organization, ...restData } = updates;
    const payload = {
      ...restData,
      organizationId: organization
    };
    
    return this.fetchWithAuth(`/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // Toggle service status
  async toggleServiceStatus(serviceId: string) {
    return this.fetchWithAuth(`/admin/services/${serviceId}/toggle-status`, {
      method: 'POST',
    });
  }

  // Delete (archive) a service
  async deleteService(serviceId: string) {
    return this.fetchWithAuth(`/services/${serviceId}`, {
      method: 'DELETE',
    });
  }

  // Get service images
  async getServiceImages(serviceId: string) {
    return this.fetchWithAuth(`/services/${serviceId}/images`);
  }

  // Update service banner
  async updateServiceBanner(serviceId: string, file: File) {
    const formData = new FormData();
    formData.append('banner', file);

    const token = AuthService.getToken();
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}/banner`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload banner image');
    }

    return response.json();
  }

  // Add images to gallery
  async addGalleryImages(serviceId: string, files: File[]) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const token = AuthService.getToken();
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}/gallery`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload gallery images');
    }

    return response.json();
  }

  // Remove image from gallery
  async removeGalleryImage(serviceId: string, imageId: string) {
    return this.fetchWithAuth(`/services/${serviceId}/gallery/${imageId}`, {
      method: 'DELETE',
    });
  }

  // Service Events
  async getServiceEvents(serviceId: string) {
    return this.fetchWithAuth(`/services/${serviceId}/events`);
  }

  async createServiceEvent(serviceId: string, eventData: {
    title: string;
    description?: string;
    date: string;
    time?: string;
    location?: string;
    capacity?: number;
  }) {
    // Transform data to match backend expectations
    const start = new Date(eventData.date);
    if (eventData.time) {
      const [hours, minutes] = eventData.time.split(':');
      start.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    }
    
    // Default end time to 2 hours after start if no time specified, or 1 hour if time is specified
    const end = new Date(start);
    end.setHours(end.getHours() + (eventData.time ? 1 : 2));
    
    const transformedData = {
      name: eventData.title,
      description: eventData.description || '',
      start: start.toISOString(),
      end: end.toISOString(),
      locationText: eventData.location || '',
      ...(eventData.capacity ? { capacity: { maximum: eventData.capacity } } : {})
    };
    
    return this.fetchWithAuth(`/services/${serviceId}/events`, {
      method: 'POST',
      body: JSON.stringify(transformedData),
    });
  }

  async updateServiceEvent(serviceId: string, eventId: string, eventData: Partial<{
    title: string;
    description?: string;
    date: string;
    time?: string;
    location?: string;
    capacity?: number;
  }>) {
    return this.fetchWithAuth(`/services/${serviceId}/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteServiceEvent(serviceId: string, eventId: string) {
    return this.fetchWithAuth(`/services/${serviceId}/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  // Service Volunteer Roles
  async getServiceVolunteerRoles(serviceId: string) {
    return this.fetchWithAuth(`/services/${serviceId}/volunteer-roles`);
  }

  async createServiceVolunteerRole(serviceId: string, roleData: {
    title: string;
    description: string;
    requirements?: string;
    timeCommitment?: string;
    volunteersNeeded?: number;
    isActive: boolean;
  }) {
    return this.fetchWithAuth(`/services/${serviceId}/volunteer-roles`, {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }

  async updateServiceVolunteerRole(serviceId: string, roleId: string, roleData: Partial<{
    title: string;
    description: string;
    requirements?: string;
    timeCommitment?: string;
    volunteersNeeded?: number;
    isActive: boolean;
  }>) {
    return this.fetchWithAuth(`/services/${serviceId}/volunteer-roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  }

  async deleteServiceVolunteerRole(serviceId: string, roleId: string) {
    return this.fetchWithAuth(`/services/${serviceId}/volunteer-roles/${roleId}`, {
      method: 'DELETE',
    });
  }

  // Service Stories
  async getServiceStories(serviceId: string) {
    return this.fetchWithAuth(`/services/${serviceId}/stories`);
  }

  async createServiceStory(serviceId: string, storyData: {
    title: string;
    content: string;
    author?: string;
    tags?: string[];
    isPublished: boolean;
  }) {
    return this.fetchWithAuth(`/services/${serviceId}/stories`, {
      method: 'POST',
      body: JSON.stringify(storyData),
    });
  }

  async updateServiceStory(serviceId: string, storyId: string, storyData: Partial<{
    title: string;
    content: string;
    author?: string;
    tags?: string[];
    isPublished: boolean;
  }>) {
    return this.fetchWithAuth(`/services/${serviceId}/stories/${storyId}`, {
      method: 'PUT',
      body: JSON.stringify(storyData),
    });
  }

  async deleteServiceStory(serviceId: string, storyId: string) {
    return this.fetchWithAuth(`/services/${serviceId}/stories/${storyId}`, {
      method: 'DELETE',
    });
  }

  // Global Stories (Admin)
  async getStories(params: {
    page?: number;
    limit?: number;
    organization?: string;
    service?: string;
    status?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.fetchWithAuth(`/admin/services/stories?${queryParams}`);
  }

  async createStory(storyData: {title: string; content: string; serviceId: string; author?: string}) {
    return this.fetchWithAuth('/services/stories', {
      method: 'POST',
      body: JSON.stringify(storyData),
    });
  }

  async updateStory(storyId: string, updates: {title?: string; content?: string; serviceId?: string; author?: string}) {
    return this.fetchWithAuth(`/services/stories/${storyId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async publishStory(storyId: string) {
    return this.fetchWithAuth(`/services/stories/${storyId}/publish`, {
      method: 'POST',
    });
  }
}

export const serviceManagement = new ServiceManagementService();