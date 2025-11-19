import { AuthService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface OrganizationValidationResponse {
  success: boolean;
  hasAccess: boolean;
}

/**
 * Secure Auth Service
 * Extends AuthService with additional security validations
 * Following Open/Closed Principle - extending without modifying base class
 */
export class SecureAuthService extends AuthService {
  /**
   * Validate organization access before setting context
   * @param organizationId - Organization ID to validate
   * @returns Promise<boolean> - True if access granted
   */
  static async setSecureOrganizationContext(organizationId: string): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) {
        console.error('No authentication token found');
        return false;
      }

      // Validate organization access server-side
      const response = await fetch(`${API_BASE_URL}/api/auth/validate-org-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        console.error('Failed to validate organization access');
        return false;
      }

      const data: OrganizationValidationResponse = await response.json();

      if (data.success && data.hasAccess) {
        // Only set context if validation passes
        super.setOrganizationContext(organizationId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error validating organization access:', error);
      return false;
    }
  }

  /**
   * Enhanced logout with server-side token invalidation
   * @returns Promise<void>
   */
  static async secureLogout(): Promise<void> {
    try {
      const token = this.getToken();
      
      if (token) {
        // Call server logout endpoint to blacklist token
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Error during secure logout:', error);
    } finally {
      // Always clear client-side tokens
      await super.logout();
    }
  }

  /**
   * Clear all cached security data
   */
  static clearSecurityCache(): void {
    if (typeof window !== 'undefined') {
      // Clear permissions cache
      localStorage.removeItem('userPermissions');
      localStorage.removeItem('permissionsCacheTime');
      
      // Clear organization context
      localStorage.removeItem('currentOrganizationId');
      
      // Clear any other security-related caches
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('permissions:') || key.startsWith('org:'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }

  /**
   * Get cached permissions with TTL validation
   * @param organizationId - Organization ID
   * @returns string[] | null - Permissions array or null if cache invalid
   */
  static getCachedPermissions(organizationId: string): string[] | null {
    if (typeof window === 'undefined') return null;

    const cacheKey = `permissions:${organizationId}`;
    const cacheTimeKey = `${cacheKey}:time`;

    const cachedPermissions = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheTimeKey);

    if (!cachedPermissions || !cacheTime) return null;

    const cacheAge = Date.now() - parseInt(cacheTime, 10);
    const TTL = 5 * 60 * 1000; // 5 minutes

    if (cacheAge > TTL) {
      // Cache expired
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(cacheTimeKey);
      return null;
    }

    return JSON.parse(cachedPermissions);
  }

  /**
   * Cache permissions with TTL
   * @param organizationId - Organization ID
   * @param permissions - Permissions array
   */
  static setCachedPermissions(organizationId: string, permissions: string[]): void {
    if (typeof window === 'undefined') return;

    const cacheKey = `permissions:${organizationId}`;
    const cacheTimeKey = `${cacheKey}:time`;

    localStorage.setItem(cacheKey, JSON.stringify(permissions));
    localStorage.setItem(cacheTimeKey, Date.now().toString());
  }

  /**
   * Validate user session integrity
   * @returns Promise<boolean> - True if session valid
   */
  static async validateSession(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) return false;

      const authResponse = await this.verifyAuth(token);
      return authResponse.success;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  /**
   * Check if current organization context is valid
   * @returns Promise<boolean> - True if valid
   */
  static async isOrganizationContextValid(): Promise<boolean> {
    const organizationId = this.getOrganizationContext();
    if (!organizationId) return true; // No context is valid

    try {
      const token = this.getToken();
      if (!token) return false;

      const response = await fetch(`${API_BASE_URL}/api/auth/validate-org-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ organizationId }),
      });

      const data: OrganizationValidationResponse = await response.json();
      return data.success && data.hasAccess;
    } catch (error) {
      console.error('Failed to validate organization context:', error);
      return false;
    }
  }
}