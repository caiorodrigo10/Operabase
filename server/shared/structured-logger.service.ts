import fs from 'fs/promises';
import path from 'path';
import { tenantContext } from './tenant-context.provider.js';
import { nanoid } from 'nanoid';

/**
 * Log entry interface for structured logging
 */
export interface LogEntry {
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  category: string;
  clinic_id?: number;
  user_id?: string;
  action: string;
  resource?: string;
  details: Record<string, any>;
  request_id: string;
  response_time?: number;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Log categories for different system areas
 */
export enum LogCategory {
  AUTH = 'auth',
  MEDICAL = 'medical',
  ADMIN = 'admin',
  API = 'api',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  CACHE = 'cache',
  AUDIT = 'audit'
}

/**
 * Phase 3: Core Observability - Enhanced Structured Logging Service
 * Optimized for production monitoring with minimal performance impact
 */
export class StructuredLoggerService {
  private logDirectory: string;
  private currentDate: string;
  private logQueue: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | undefined;
  private readonly maxQueueSize = 200; // Increased for better batching
  private readonly flushIntervalMs = 3000; // 3 seconds for faster processing
  
  // Phase 3: Performance metrics
  private metrics = {
    totalLogs: 0,
    logsPerSecond: 0,
    avgProcessingTime: 0,
    errorCount: 0,
    queueSize: 0,
    lastFlushTime: Date.now()
  };

  constructor() {
    this.logDirectory = process.env.LOG_DIRECTORY || './logs';
    this.currentDate = new Date().toISOString().split('T')[0];
    this.initializeLogDirectory();
    this.startPeriodicFlush();
  }

  /**
   * Initialize log directory structure
   */
  private async initializeLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.logDirectory, { recursive: true });
      
      // Create subdirectories for different log types
      const subdirs = ['api', 'audit', 'security', 'performance', 'errors'];
      for (const subdir of subdirs) {
        await fs.mkdir(path.join(this.logDirectory, subdir), { recursive: true });
      }
    } catch (error) {
      console.error('Failed to initialize log directory:', error);
    }
  }

  /**
   * Start periodic log flushing
   */
  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushLogs();
    }, this.flushIntervalMs);
  }

  /**
   * Stop the logging service
   */
  public stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushLogs(); // Final flush
  }

  /**
   * Create a log entry with automatic context extraction
   */
  private createLogEntry(
    level: LogEntry['level'],
    category: string,
    action: string,
    details: Record<string, any> = {},
    resource?: string,
    responseTime?: number
  ): LogEntry {
    const context = tenantContext.getContext();
    
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      clinic_id: context?.clinicId,
      user_id: context?.userId,
      action,
      resource,
      details: this.sanitizeDetails(details),
      request_id: details.request_id || nanoid(10),
      response_time: responseTime,
      ip_address: details.ip_address,
      user_agent: details.user_agent
    };
  }

  /**
   * Sanitize log details to remove sensitive information
   */
  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'authorization',
      'cpf', 'rg', 'credit_card', 'ssn', 'phone', 'email'
    ];

    const sanitized = { ...details };
    
    const sanitizeRecursive = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitizeRecursive);
      }

      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = sanitizeRecursive(value);
        }
      }
      return result;
    };

    return sanitizeRecursive(sanitized);
  }

  /**
   * Add log entry to queue
   */
  private addToQueue(entry: LogEntry): void {
    this.logQueue.push(entry);
    
    // Force flush if queue is full
    if (this.logQueue.length >= this.maxQueueSize) {
      this.flushLogs();
    }
  }

  /**
   * Flush logs to files
   */
  private async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0) return;

    const logsToFlush = [...this.logQueue];
    this.logQueue = [];

    try {
      // Group logs by category for efficient writing
      const logsByCategory = new Map<string, LogEntry[]>();
      
      for (const log of logsToFlush) {
        if (!logsByCategory.has(log.category)) {
          logsByCategory.set(log.category, []);
        }
        logsByCategory.get(log.category)!.push(log);
      }

      // Write logs to respective files
      const writePromises = Array.from(logsByCategory.entries()).map(
        ([category, logs]) => this.writeLogsToFile(category, logs)
      );

      await Promise.all(writePromises);
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Re-add logs to queue if write fails
      this.logQueue.unshift(...logsToFlush);
    }
  }

  /**
   * Write logs to specific category file
   */
  private async writeLogsToFile(category: string, logs: LogEntry[]): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const filename = `${category}-${today}.jsonl`;
    const filepath = path.join(this.logDirectory, category, filename);
    
    const logLines = logs.map(log => JSON.stringify(log)).join('\n') + '\n';
    
    try {
      await fs.appendFile(filepath, logLines);
    } catch (error) {
      console.error(`Failed to write ${category} logs:`, error);
    }
  }

  /**
   * Log ERROR level
   */
  error(category: LogCategory, action: string, details: Record<string, any> = {}, resource?: string): void {
    const entry = this.createLogEntry('ERROR', category, action, details, resource);
    this.addToQueue(entry);
    
    // Also log to console for immediate visibility
    console.error(`[${category.toUpperCase()}] ${action}:`, details);
  }

  /**
   * Log WARN level
   */
  warn(category: LogCategory, action: string, details: Record<string, any> = {}, resource?: string): void {
    const entry = this.createLogEntry('WARN', category, action, details, resource);
    this.addToQueue(entry);
  }

  /**
   * Log INFO level
   */
  info(category: LogCategory, action: string, details: Record<string, any> = {}, resource?: string): void {
    const entry = this.createLogEntry('INFO', category, action, details, resource);
    this.addToQueue(entry);
  }

  /**
   * Log DEBUG level
   */
  debug(category: LogCategory, action: string, details: Record<string, any> = {}, resource?: string): void {
    if (process.env.NODE_ENV === 'development') {
      const entry = this.createLogEntry('DEBUG', category, action, details, resource);
      this.addToQueue(entry);
    }
  }

  /**
   * Log API calls with timing
   */
  logApiCall(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
    details: Record<string, any> = {}
  ): void {
    const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
    const entry = this.createLogEntry(
      level,
      LogCategory.API,
      `${method} ${path}`,
      { ...details, status_code: statusCode },
      path,
      responseTime
    );
    this.addToQueue(entry);
  }

  /**
   * Log authentication events
   */
  logAuth(action: string, success: boolean, details: Record<string, any> = {}): void {
    const level = success ? 'INFO' : 'WARN';
    this.info(LogCategory.AUTH, action, { ...details, success });
  }

  /**
   * Log medical data access
   */
  logMedical(action: string, patientId?: number, details: Record<string, any> = {}): void {
    this.info(LogCategory.MEDICAL, action, { ...details, patient_id: patientId });
  }

  /**
   * Query logs with filtering - Phase 3 implementation
   */
  async queryLogs(filters: {
    clinicId?: number;
    level?: string;
    category?: string;
    limit?: number;
    startTime?: Date;
    endTime?: Date;
    userId?: number;
  }): Promise<LogEntry[]> {
    const results: LogEntry[] = [];
    const limit = Math.min(filters.limit || 100, 500);

    try {
      // For production, this would read from log files or database
      // For now, return recent logs from memory queue
      let filteredLogs = [...this.logQueue];

      // Apply filters
      if (filters.clinicId) {
        filteredLogs = filteredLogs.filter(log => log.clinic_id === filters.clinicId);
      }

      if (filters.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filters.level.toUpperCase());
      }

      if (filters.category) {
        filteredLogs = filteredLogs.filter(log => log.category === filters.category);
      }

      if (filters.startTime) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) >= filters.startTime!
        );
      }

      if (filters.endTime) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) <= filters.endTime!
        );
      }

      // Sort by timestamp descending and apply limit
      filteredLogs.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return filteredLogs.slice(0, limit);

    } catch (error) {
      console.error('Error querying logs:', error);
      return [];
    }
  }

  /**
   * Get logger performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      queueSize: this.logQueue.length,
      logsPerSecond: this.metrics.totalLogs / ((Date.now() - this.metrics.lastFlushTime) / 1000)
    };
  }
}

// Singleton instance
export const structuredLogger = new StructuredLoggerService();
  logPerformance(action: string, metrics: Record<string, number>, details: Record<string, any> = {}): void {
    this.info(LogCategory.PERFORMANCE, action, { ...details, metrics });
  }

  /**
   * Get logs for a specific tenant (clinic)
   */
  async getLogsByTenant(clinicId: number, category?: LogCategory, limit: number = 100): Promise<LogEntry[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const categories = category ? [category] : Object.values(LogCategory);
      const logs: LogEntry[] = [];

      for (const cat of categories) {
        const filename = `${cat}-${today}.jsonl`;
        const filepath = path.join(this.logDirectory, cat, filename);
        
        try {
          const content = await fs.readFile(filepath, 'utf-8');
          const lines = content.trim().split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const log: LogEntry = JSON.parse(line);
              if (log.clinic_id === clinicId) {
                logs.push(log);
              }
            } catch (parseError) {
              // Skip malformed log lines
            }
          }
        } catch (fileError) {
          // File doesn't exist, continue
        }
      }

      // Sort by timestamp and limit
      return logs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to retrieve logs:', error);
      return [];
    }
  }

  /**
   * Get performance metrics from logs
   */
  async getPerformanceMetrics(hours: number = 24): Promise<{
    avgResponseTime: number;
    errorRate: number;
    requestCount: number;
    slowQueries: LogEntry[];
  }> {
    try {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      const apiLogs = await this.getRecentLogs(LogCategory.API, cutoff);
      
      if (apiLogs.length === 0) {
        return { avgResponseTime: 0, errorRate: 0, requestCount: 0, slowQueries: [] };
      }

      const totalResponseTime = apiLogs.reduce((sum, log) => sum + (log.response_time || 0), 0);
      const errorCount = apiLogs.filter(log => log.level === 'ERROR').length;
      const slowQueries = apiLogs.filter(log => (log.response_time || 0) > 1000);

      return {
        avgResponseTime: totalResponseTime / apiLogs.length,
        errorRate: (errorCount / apiLogs.length) * 100,
        requestCount: apiLogs.length,
        slowQueries
      };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return { avgResponseTime: 0, errorRate: 0, requestCount: 0, slowQueries: [] };
    }
  }

  /**
   * Get recent logs for a category
   */
  private async getRecentLogs(category: LogCategory, since: Date): Promise<LogEntry[]> {
    const today = new Date().toISOString().split('T')[0];
    const filename = `${category}-${today}.jsonl`;
    const filepath = path.join(this.logDirectory, category, filename);
    
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      const logs: LogEntry[] = [];
      
      for (const line of lines) {
        try {
          const log: LogEntry = JSON.parse(line);
          if (new Date(log.timestamp) >= since) {
            logs.push(log);
          }
        } catch (parseError) {
          // Skip malformed log lines
        }
      }
      
      return logs;
    } catch (error) {
      return [];
    }
  }
}

// Singleton instance
export const structuredLogger = new StructuredLoggerService();

// Graceful shutdown
process.on('SIGTERM', () => {
  structuredLogger.stop();
});

process.on('SIGINT', () => {
  structuredLogger.stop();
  process.exit(0);
});