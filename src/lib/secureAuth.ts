import { AuthService } from './auth';

/**
 * Secure Auth Service
 * Extends AuthService with additional security validations
 * Following Open/Closed Principle - extending without modifying base class
 */
export class SecureAuthService extends AuthService {
  /**
   * Clear all authentication data securely
   */
  static secureLogout(): void {
    // Clear auth data from base service
    this.logout();

    if (typeof window !== 'undefined') {
      // Clear permissions cache
      localStorage.removeItem('permissions');
      localStorage.removeItem('permissionsCacheTime');
      
      // Clear any other security-related caches
      const keysToRemove: string[] = [];
      
      // Iterate through localStorage and remove any keys that look sensitive
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('permissions') ||
          key.includes('rbac') ||
          key.includes('cache')
        )) {
          keysToRemove.push(key);
        }
      }
      
      // Remove identified sensitive keys
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('[SecureAuthService] Security cleanup completed');
    }
  }

  /**
   * Get cached permissions with TTL validation
   * @returns string[] | null - Permissions array or null if cache invalid
   */
  static getCachedPermissions(): string[] | null {
    if (typeof window === 'undefined') return null;
    
    const cacheTime = localStorage.getItem('permissionsCacheTime');
    const permissions = localStorage.getItem('permissions');
    
    if (!cacheTime || !permissions) return null;
    
    // Check if cache is expired (5 minutes TTL)
    const cacheTimestamp = parseInt(cacheTime);
    const now = Date.now();
    const TTL = 5 * 60 * 1000; // 5 minutes
    
    if (now - cacheTimestamp > TTL) {
      localStorage.removeItem('permissions');
      localStorage.removeItem('permissionsCacheTime');
      return null;
    }
    
    try {
      return JSON.parse(permissions);
    } catch {
      return null;
    }
  }

  /**
   * Cache permissions with TTL
   * @param permissions - Permissions array
   */
  static setCachedPermissions(permissions: string[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('permissions', JSON.stringify(permissions));
      localStorage.setItem('permissionsCacheTime', Date.now().toString());
    }
  }
}