import { API_BASE_URL } from './config';
import { AuthService } from './auth';

export interface TeamType {
  _id: string;
  name: string;
  description?: string;
  organizationId: string;
  isActive: boolean;
  isDefault: boolean;
  permissions: string[];
  teamCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamTypeData {
  name: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateTeamTypeData {
  name?: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}

const getAuthHeaders = () => {
  const token = AuthService.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const teamTypeService = {
  // Get all team types for an organization
  async getOrganizationTeamTypes(
    organizationId: string, 
    includeInactive = false
  ): Promise<{ success: boolean; data: TeamType[] }> {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.append('includeInactive', 'true');
    }
    
    const url = `${API_BASE_URL}/api/team-types/organization/${organizationId}?${params}`;
    const headers = getAuthHeaders();
    
    const response = await fetch(url, {
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = `Failed to fetch team types: ${response.statusText}`;
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch {
        await response.text();
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  },

  // Get a specific team type
  async getTeamType(id: string): Promise<{ success: boolean; data: TeamType }> {
    const response = await fetch(`${API_BASE_URL}/api/team-types/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch team type: ${response.statusText}`);
    }

    return response.json();
  },

  // Create a new team type
  async createTeamType(data: CreateTeamTypeData): Promise<{ success: boolean; data: TeamType }> {
    const response = await fetch(`${API_BASE_URL}/api/team-types`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create team type');
    }

    return response.json();
  },

  // Update a team type
  async updateTeamType(
    id: string, 
    data: UpdateTeamTypeData
  ): Promise<{ success: boolean; data: TeamType }> {
    const response = await fetch(`${API_BASE_URL}/api/team-types/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update team type');
    }

    return response.json();
  },

  // Delete a team type
  async deleteTeamType(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/api/team-types/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete team type');
    }

    return response.json();
  },

  // Initialize default team types for an organization
  async initializeDefaultTypes(organizationId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/api/team-types/initialize/${organizationId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to initialize default team types');
    }

    return response.json();
  },
};

// Helper functions for UI
export const TEAM_TYPE_ICONS = [
  { value: 'users', label: 'Users', component: '👥' },
  { value: 'shield', label: 'Shield', component: '🛡️' },
  { value: 'messageSquare', label: 'Communications', component: '💬' },
  { value: 'heart', label: 'Health & Care', component: '❤️' },
  { value: 'home', label: 'Community', component: '🏠' },
  { value: 'book', label: 'Education', component: '📚' },
  { value: 'music', label: 'Music & Arts', component: '🎵' },
  { value: 'camera', label: 'Media', component: '📸' },
  { value: 'briefcase', label: 'Administration', component: '💼' },
  { value: 'graduation', label: 'Training', component: '🎓' },
  { value: 'leaf', label: 'Environment', component: '🌱' },
  { value: 'globe', label: 'Outreach', component: '🌍' },
  { value: 'wrench', label: 'Maintenance', component: '🔧' },
  { value: 'paintbrush', label: 'Creative', component: '🎨' },
  { value: 'megaphone', label: 'Events', component: '📢' },
];

export const TEAM_TYPE_COLORS = [
  { value: 'gray', label: 'Gray', class: 'bg-gray-100 text-gray-800' },
  { value: 'red', label: 'Red', class: 'bg-red-100 text-red-800' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-100 text-orange-800' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-100 text-yellow-800' },
  { value: 'green', label: 'Green', class: 'bg-green-100 text-green-800' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-100 text-blue-800' },
  { value: 'indigo', label: 'Indigo', class: 'bg-indigo-100 text-indigo-800' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-100 text-purple-800' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-100 text-pink-800' },
];

export const getTeamTypeColorClass = (color: string) => {
  const colorConfig = TEAM_TYPE_COLORS.find(c => c.value === color);
  return colorConfig?.class || 'bg-gray-100 text-gray-800';
};

export const getTeamTypeIcon = (icon: string) => {
  const iconConfig = TEAM_TYPE_ICONS.find(i => i.value === icon);
  return iconConfig?.component || '👥';
};