/**
 * Cache key patterns for multi-tenant TaskMed system
 * Ensures tenant isolation and consistent key structure
 */

export class CacheKeys {
  private static readonly SEPARATOR = ':';

  /**
   * Generate tenant-aware cache key
   */
  private static tenantKey(clinicId: number, ...parts: string[]): string {
    return `clinic_${clinicId}${this.SEPARATOR}${parts.join(this.SEPARATOR)}`;
  }

  // CONTACTS CACHE KEYS
  static contacts = {
    list: (clinicId: number, page: number = 1) => 
      this.tenantKey(clinicId, 'contacts', 'list', `page_${page}`),
    
    search: (clinicId: number, query: string, page: number = 1) => 
      this.tenantKey(clinicId, 'contacts', 'search', query.toLowerCase(), `page_${page}`),
    
    detail: (clinicId: number, contactId: number) => 
      this.tenantKey(clinicId, 'contacts', 'detail', `${contactId}`),
    
    byStatus: (clinicId: number, status: string, page: number = 1) => 
      this.tenantKey(clinicId, 'contacts', 'status', status, `page_${page}`),
    
    pattern: (clinicId: number) => 
      `clinic_${clinicId}${this.SEPARATOR}contacts${this.SEPARATOR}*`
  };

  // APPOINTMENTS CACHE KEYS
  static appointments = {
    list: (clinicId: number, page: number = 1) => 
      this.tenantKey(clinicId, 'appointments', 'list', `page_${page}`),
    
    byDate: (clinicId: number, date: string) => 
      this.tenantKey(clinicId, 'appointments', 'date', date),
    
    byContact: (clinicId: number, contactId: number) => 
      this.tenantKey(clinicId, 'appointments', 'contact', `${contactId}`),
    
    byProfessional: (clinicId: number, userId: number, date: string) => 
      this.tenantKey(clinicId, 'appointments', 'professional', `${userId}`, date),
    
    detail: (clinicId: number, appointmentId: number) => 
      this.tenantKey(clinicId, 'appointments', 'detail', `${appointmentId}`),
    
    pattern: (clinicId: number) => 
      `clinic_${clinicId}${this.SEPARATOR}appointments${this.SEPARATOR}*`
  };

  // MEDICAL RECORDS CACHE KEYS
  static medicalRecords = {
    byContact: (clinicId: number, contactId: number) => 
      this.tenantKey(clinicId, 'records', 'contact', `${contactId}`),
    
    detail: (clinicId: number, recordId: number) => 
      this.tenantKey(clinicId, 'records', 'detail', `${recordId}`),
    
    pattern: (clinicId: number) => 
      `clinic_${clinicId}${this.SEPARATOR}records${this.SEPARATOR}*`
  };

  // PIPELINE CACHE KEYS
  static pipeline = {
    stages: (clinicId: number) => 
      this.tenantKey(clinicId, 'pipeline', 'stages'),
    
    opportunities: (clinicId: number, stageId?: number) => 
      stageId 
        ? this.tenantKey(clinicId, 'pipeline', 'opportunities', `stage_${stageId}`)
        : this.tenantKey(clinicId, 'pipeline', 'opportunities', 'all'),
    
    metrics: (clinicId: number, period: string) => 
      this.tenantKey(clinicId, 'pipeline', 'metrics', period),
    
    pattern: (clinicId: number) => 
      `clinic_${clinicId}${this.SEPARATOR}pipeline${this.SEPARATOR}*`
  };

  // ANALYTICS CACHE KEYS
  static analytics = {
    metrics: (clinicId: number, type: string, period: string) => 
      this.tenantKey(clinicId, 'analytics', type, period),
    
    dashboard: (clinicId: number, userId: number) => 
      this.tenantKey(clinicId, 'analytics', 'dashboard', `user_${userId}`),
    
    pattern: (clinicId: number) => 
      `clinic_${clinicId}${this.SEPARATOR}analytics${this.SEPARATOR}*`
  };

  // SETTINGS CACHE KEYS
  static settings = {
    clinic: (clinicId: number) => 
      this.tenantKey(clinicId, 'settings', 'clinic'),
    
    user: (clinicId: number, userId: number) => 
      this.tenantKey(clinicId, 'settings', 'user', `${userId}`),
    
    aiTemplates: (clinicId: number, type?: string) => 
      type 
        ? this.tenantKey(clinicId, 'settings', 'ai_templates', type)
        : this.tenantKey(clinicId, 'settings', 'ai_templates', 'all'),
    
    pattern: (clinicId: number) => 
      `clinic_${clinicId}${this.SEPARATOR}settings${this.SEPARATOR}*`
  };

  // UTILITY METHODS
  
  /**
   * Generate invalidation pattern for a clinic
   */
  static getClinicPattern(clinicId: number): string {
    return `clinic_${clinicId}${this.SEPARATOR}*`;
  }

  /**
   * Generate invalidation patterns for specific domains
   */
  static getPatterns(clinicId: number) {
    return {
      contacts: this.contacts.pattern(clinicId),
      appointments: this.appointments.pattern(clinicId),
      records: this.medicalRecords.pattern(clinicId),
      pipeline: this.pipeline.pattern(clinicId),
      analytics: this.analytics.pattern(clinicId),
      settings: this.settings.pattern(clinicId),
      all: this.getClinicPattern(clinicId)
    };
  }

  /**
   * Extract clinic ID from cache key
   */
  static extractClinicId(key: string): number | null {
    const match = key.match(/^clinic_(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Check if key belongs to specific clinic
   */
  static belongsToClinic(key: string, clinicId: number): boolean {
    return key.startsWith(`clinic_${clinicId}${this.SEPARATOR}`);
  }
}