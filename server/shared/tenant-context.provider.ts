import { AsyncLocalStorage } from 'async_hooks';
import { TenantContext } from './tenant-types.js';

/**
 * Tenant Context Provider - Manages clinic context per request
 * Provides thread-safe tenant isolation using AsyncLocalStorage
 */
class TenantContextProvider {
  private storage = new AsyncLocalStorage<TenantContext>();

  /**
   * Run callback with tenant context
   */
  run<T>(context: TenantContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  /**
   * Get current tenant context
   */
  getContext(): TenantContext | undefined {
    return this.storage.getStore();
  }

  /**
   * Get current clinic ID
   */
  getClinicId(): number | undefined {
    const context = this.getContext();
    return context?.clinicId;
  }

  /**
   * Get current user ID
   */
  getUserId(): string | undefined {
    const context = this.getContext();
    return context?.userId;
  }

  /**
   * Get current user role
   */
  getUserRole(): string | undefined {
    const context = this.getContext();
    return context?.userRole;
  }

  /**
   * Check if current context is authenticated
   */
  isAuthenticated(): boolean {
    const context = this.getContext();
    return context?.isAuthenticated ?? false;
  }

  /**
   * Validate tenant context exists
   */
  validateContext(): TenantContext {
    const context = this.getContext();
    if (!context) {
      throw new Error('Tenant context not found. Middleware may not be properly configured.');
    }
    if (!context.isAuthenticated) {
      throw new Error('Request is not authenticated.');
    }
    return context;
  }

  /**
   * Get tenant filter for database queries
   */
  getTenantFilter(): { clinic_id: number } {
    const context = this.validateContext();
    return { clinic_id: context.clinicId };
  }
}

// Singleton instance
export const tenantContext = new TenantContextProvider();