import { API_BASE_URL } from './config';

export interface Team {
  _id: string;
  name: string;
  organizationId: string;
  organization?: {
    _id: string;
    name: string;
    type: string;
  };
  type: 'acs' | 'communications' | 'general';
  leaderId?: string;
  description?: string;
  maxMembers: number;
  memberCount: number;
  isActive: boolean;
  settings: {
    allowSelfJoin: boolean;
    requireApproval: boolean;
    visibility: 'public' | 'private' | 'organization';
  };
  metadata?: {
    region?: string;
    conference?: string;
    district?: string;
  };
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  teamRole: 'leader' | 'member' | 'communications';
  teamAssignedAt: string;
}

export interface TeamStatistics {
  teamId: string;
  name: string;
  memberCount: number;
  maxMembers: number;
  capacity: number;
  roleDistribution: {
    leader: number;
    member: number;
    communications: number;
  };
  serviceCount: number;
  isActive: boolean;
  createdAt: string;
}

class TeamService {
  private getHeaders(teamId?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const organizationId = localStorage.getItem('currentOrganizationId');
    if (organizationId) {
      headers['X-Organization-Id'] = organizationId;
    }

    if (teamId) {
      headers['X-Team-Id'] = teamId;
    }

    return headers;
  }

  // Get teams for an organization
  async getOrganizationTeams(organizationId: string, options?: {
    type?: string;
    includeInactive?: boolean;
  }) {
    const params = new URLSearchParams();
    if (options?.type) {
      params.append('type', options.type);
    }
    if (options?.includeInactive) {
      params.append('includeInactive', 'true');
    }

    const url = `${API_BASE_URL}/api/teams/organization/${organizationId}?${params}`;
    const headers = this.getHeaders();

    try {
      const response = await fetch(url, {
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMessage = `Failed to fetch teams (${response.status}: ${response.statusText})`;
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          // Keep the HTTP status error message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  }

  // Get user's teams
  async getMyTeams() {
    const response = await fetch(`${API_BASE_URL}/api/teams/my-teams`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch user teams');
    }

    return response.json();
  }

  // Get all teams for super admins
  async getAllTeams() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/all`, {
        headers: this.getHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMessage = `Failed to fetch all teams (${response.status}: ${response.statusText})`;
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          // Keep the HTTP status error message
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  }

  // Search teams
  async searchTeams(query: string, options?: {
    organizationId?: string;
    type?: string;
    limit?: number;
    skip?: number;
    includeInactive?: boolean;
  }) {
    const params = new URLSearchParams({ q: query });
    if (options?.organizationId) params.append('organizationId', options.organizationId);
    if (options?.type) params.append('type', options.type);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.skip) params.append('skip', options.skip.toString());
    if (options?.includeInactive) params.append('includeInactive', 'true');

    const response = await fetch(`${API_BASE_URL}/api/teams/search?${params}`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to search teams');
    }

    return response.json();
  }

  // Get team details
  async getTeamDetails(teamId: string) {
    const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
      headers: this.getHeaders(teamId),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch team details');
    }

    return response.json();
  }

  // Get team statistics
  async getTeamStatistics(teamId: string): Promise<{ success: boolean; data: TeamStatistics }> {
    const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/statistics`, {
      headers: this.getHeaders(teamId),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch team statistics');
    }

    return response.json();
  }

  // Create new team
  async createTeam(teamData: {
    name: string;
    organizationId: string;
    type?: 'acs' | 'communications' | 'general';
    leaderId?: string;
    description?: string;
    maxMembers?: number;
  }) {
    const response = await fetch(`${API_BASE_URL}/api/teams`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(teamData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create team');
    }

    return response.json();
  }

  // Update team
  async updateTeam(teamId: string, updates: Partial<Team>) {
    const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
      method: 'PUT',
      headers: this.getHeaders(teamId),
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update team');
    }

    return response.json();
  }

  // Add team member
  async addTeamMember(teamId: string, userId: string, role: 'leader' | 'member' | 'communications' = 'member') {
    const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/members`, {
      method: 'POST',
      headers: this.getHeaders(teamId),
      credentials: 'include',
      body: JSON.stringify({ userId, role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add team member');
    }

    return response.json();
  }

  // Update team member role
  async updateMemberRole(teamId: string, userId: string, role: 'leader' | 'member' | 'communications') {
    const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/members/${userId}`, {
      method: 'PUT',
      headers: this.getHeaders(teamId),
      credentials: 'include',
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update member role');
    }

    return response.json();
  }

  // Remove team member
  async removeTeamMember(teamId: string, userId: string) {
    const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(teamId),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove team member');
    }

    return response.json();
  }

  // Get team members
  async getTeamMembers(teamId: string, options?: {
    role?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ success: boolean; data: TeamMember[]; meta: { total: number } }> {
    const params = new URLSearchParams();
    if (options?.role) params.append('role', options.role);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.skip) params.append('skip', options.skip.toString());

    const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/members?${params}`, {
      headers: this.getHeaders(teamId),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch team members');
    }

    return response.json();
  }

  // Delete team
  async deleteTeam(teamId: string) {
    const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete team');
    }

    return response.json();
  }

  // Get quota status for organization
  async getQuotaStatus(organizationId?: string) {
    const params = organizationId ? `?organizationId=${organizationId}` : '';
    const response = await fetch(`${API_BASE_URL}/api/quota/status${params}`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch quota status');
    }

    return response.json();
  }
}

export const teamService = new TeamService();