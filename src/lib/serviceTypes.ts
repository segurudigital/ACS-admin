import { api } from './api';

export interface ServiceType {
  id: string;
  _id: string;
  name: string;
  value: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
  updatedBy?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ServiceTypeFormData {
  name: string;
  value?: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
  [key: string]: unknown;
}

export interface ServiceTypeFilters {
  isActive?: boolean;
  search?: string;
  sort?: string;
}

class ServiceTypeAPI {
  private baseUrl = '/api/admin/service-types';

  async getAll(filters?: ServiceTypeFilters): Promise<ServiceType[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.sort) {
        params.append('sort', filters.sort);
      }
    }

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    const response = await api.get(url);
    return response;
  }

  async getActive(): Promise<ServiceType[]> {
    const response = await api.get(`${this.baseUrl}/active`);
    return response;
  }

  async getById(id: string): Promise<ServiceType> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response;
  }

  async getStats(): Promise<{ totalTypes: number; activeTypes: number; typesInUse: number }> {
    const response = await api.get(`${this.baseUrl}/stats`);
    return response;
  }

  async create(data: ServiceTypeFormData): Promise<ServiceType> {
    const response = await api.post(this.baseUrl, data);
    return response;
  }

  async update(id: string, data: ServiceTypeFormData): Promise<ServiceType> {
    const response = await api.put(`${this.baseUrl}/${id}`, data);
    return response;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async reorder(orderedIds: string[]): Promise<ServiceType[]> {
    const response = await api.put(`${this.baseUrl}/reorder`, { orderedIds });
    return response;
  }
}

export const serviceTypeAPI = new ServiceTypeAPI();