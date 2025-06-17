import { Request, Response, NextFunction } from 'express';
import { structuredLogger, LogCategory } from './structured-logger.service.js';
import { medicalAudit, MedicalAuditEvent } from './medical-audit.service.js';
import { tenantContext } from './tenant-context.provider.js';
import { nanoid } from 'nanoid';

/**
 * Observability middleware for automatic logging and audit tracking
 */
export function observabilityMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const requestId = nanoid(10);
  
  // Add request ID to headers for tracing
  res.setHeader('X-Request-ID', requestId);
  
  // Extract request context
  const context = {
    method: req.method,
    path: req.originalUrl || req.url,
    ip_address: req.ip || req.connection.remoteAddress,
    user_agent: req.get('User-Agent'),
    request_id: requestId,
    headers: {
      authorization: req.get('Authorization') ? '[REDACTED]' : undefined,
      content_type: req.get('Content-Type'),
      accept: req.get('Accept')
    }
  };

  // Log API request start
  structuredLogger.debug(
    LogCategory.API,
    'request_started',
    {
      ...context,
      body_size: req.get('Content-Length') || 0,
      query_params: Object.keys(req.query || {}).length
    },
    req.originalUrl
  );

  // Capture response data
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  let responseData: any = null;
  let responseSent = false;

  res.json = function(data: any) {
    if (!responseSent) {
      responseData = data;
      responseSent = true;
      logRequestCompletion();
    }
    return originalJson(data);
  };

  res.send = function(data: any) {
    if (!responseSent) {
      responseData = data;
      responseSent = true;
      logRequestCompletion();
    }
    return originalSend(data);
  };

  // Handle response end without json/send
  res.on('finish', () => {
    if (!responseSent) {
      responseSent = true;
      logRequestCompletion();
    }
  });

  function logRequestCompletion() {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const tenantCtx = tenantContext.getContext();

    // Comprehensive request logging
    structuredLogger.logApiCall(
      req.method,
      req.originalUrl || req.url,
      res.statusCode,
      responseTime,
      {
        ...context,
        clinic_id: tenantCtx?.clinicId,
        user_id: tenantCtx?.userId,
        response_size: res.get('Content-Length') || (responseData ? JSON.stringify(responseData).length : 0),
        success: res.statusCode < 400
      }
    );

    // Medical audit logging for healthcare-related endpoints
    if (shouldAuditMedicalAccess(req.originalUrl || req.url, req.method)) {
      auditMedicalAccess(req, res, tenantCtx);
    }

    // Security logging for authentication and authorization events
    if (shouldLogSecurity(req.originalUrl || req.url, res.statusCode)) {
      logSecurityEvent(req, res, tenantCtx);
    }

    // Performance logging for slow requests
    if (responseTime > 1000) {
      structuredLogger.logPerformance(
        'slow_request_detected',
        {
          response_time: responseTime,
          endpoint: req.originalUrl || req.url,
          method: req.method,
          status_code: res.statusCode
        },
        {
          clinic_id: tenantCtx?.clinicId,
          user_id: tenantCtx?.userId,
          request_id: requestId
        }
      );
    }
  }

  next();
}

/**
 * Determine if endpoint should trigger medical audit
 */
function shouldAuditMedicalAccess(url: string, method: string): boolean {
  const medicalEndpoints = [
    '/contacts',
    '/appointments', 
    '/medical-records',
    '/records',
    '/patients'
  ];

  return medicalEndpoints.some(endpoint => url.includes(endpoint)) && 
         ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}

/**
 * Audit medical data access
 */
function auditMedicalAccess(req: Request, res: Response, tenantCtx: any) {
  try {
    const url = req.originalUrl || req.url;
    const method = req.method;
    
    // Extract patient/contact ID from URL
    const contactMatch = url.match(/\/contacts\/(\d+)/);
    const appointmentMatch = url.match(/\/appointments\/(\d+)/);
    const recordMatch = url.match(/\/medical-records\/(\d+)/);
    
    let auditEvent: MedicalAuditEvent;
    let patientId: number | undefined;
    let resourceId: number | undefined;
    let resourceType: string;

    // Determine audit event type and extract IDs
    if (contactMatch) {
      patientId = parseInt(contactMatch[1]);
      resourceType = 'contact';
      auditEvent = method === 'GET' ? MedicalAuditEvent.PATIENT_VIEW :
                   method === 'POST' ? MedicalAuditEvent.PATIENT_CREATE :
                   method === 'PUT' || method === 'PATCH' ? MedicalAuditEvent.PATIENT_UPDATE :
                   MedicalAuditEvent.PATIENT_DELETE;
    } else if (appointmentMatch) {
      resourceId = parseInt(appointmentMatch[1]);
      resourceType = 'appointment';
      auditEvent = method === 'GET' ? MedicalAuditEvent.APPOINTMENT_VIEW :
                   method === 'POST' ? MedicalAuditEvent.APPOINTMENT_CREATE :
                   method === 'PUT' || method === 'PATCH' ? MedicalAuditEvent.APPOINTMENT_UPDATE :
                   MedicalAuditEvent.APPOINTMENT_CANCEL;
    } else if (recordMatch) {
      resourceId = parseInt(recordMatch[1]);
      resourceType = 'medical_record';
      auditEvent = method === 'GET' ? MedicalAuditEvent.RECORD_VIEW :
                   method === 'POST' ? MedicalAuditEvent.RECORD_CREATE :
                   method === 'PUT' || method === 'PATCH' ? MedicalAuditEvent.RECORD_UPDATE :
                   MedicalAuditEvent.RECORD_DELETE;
    } else {
      // General medical data access
      resourceType = 'medical_data';
      auditEvent = MedicalAuditEvent.PATIENT_VIEW;
    }

    // Only audit successful operations
    if (res.statusCode < 400) {
      medicalAudit.audit(auditEvent, {
        patientId,
        resourceId,
        resourceType,
        actionDetails: {
          method,
          endpoint: url,
          status_code: res.statusCode,
          request_id: res.get('X-Request-ID')
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID
      });
    }

  } catch (error) {
    structuredLogger.error(
      LogCategory.AUDIT,
      'medical_audit_middleware_error',
      { error: (error as Error).message, url: req.originalUrl }
    );
  }
}

/**
 * Determine if endpoint should trigger security logging
 */
function shouldLogSecurity(url: string, statusCode: number): boolean {
  const securityEndpoints = [
    '/auth',
    '/login',
    '/logout',
    '/register',
    '/permissions',
    '/roles'
  ];

  return securityEndpoints.some(endpoint => url.includes(endpoint)) || 
         statusCode === 401 || statusCode === 403;
}

/**
 * Log security-related events
 */
function logSecurityEvent(req: Request, res: Response, tenantCtx: any) {
  const url = req.originalUrl || req.url;
  const method = req.method;
  const statusCode = res.statusCode;

  let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let action = 'security_event';

  // Determine severity and action
  if (statusCode === 401) {
    severity = 'MEDIUM';
    action = 'unauthorized_access_attempt';
  } else if (statusCode === 403) {
    severity = 'HIGH';
    action = 'forbidden_access_attempt';
  } else if (url.includes('/login')) {
    action = statusCode < 400 ? 'login_success' : 'login_failure';
    severity = statusCode < 400 ? 'LOW' : 'MEDIUM';
  } else if (url.includes('/logout')) {
    action = 'logout';
    severity = 'LOW';
  } else if (url.includes('/permissions') || url.includes('/roles')) {
    action = 'permission_access';
    severity = 'MEDIUM';
  }

  structuredLogger.logSecurity(
    action,
    severity,
    {
      method,
      endpoint: url,
      status_code: statusCode,
      clinic_id: tenantCtx?.clinicId,
      user_id: tenantCtx?.userId,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      request_id: res.get('X-Request-ID')
    }
  );
}

/**
 * Enhanced observability middleware for medical compliance
 */
export function medicalComplianceMiddleware(req: Request, res: Response, next: NextFunction) {
  const url = req.originalUrl || req.url;
  
  // Track LGPD/GDPR relevant endpoints
  const dataPrivacyEndpoints = [
    '/export',
    '/download',
    '/share',
    '/anonymize',
    '/delete'
  ];

  if (dataPrivacyEndpoints.some(endpoint => url.includes(endpoint))) {
    const tenantCtx = tenantContext.getContext();
    
    // Log data privacy operations
    structuredLogger.info(
      LogCategory.AUDIT,
      'data_privacy_operation',
      {
        operation: url,
        method: req.method,
        clinic_id: tenantCtx?.clinicId,
        user_id: tenantCtx?.userId,
        ip_address: req.ip,
        compliance_tags: ['lgpd', 'gdpr', 'data_privacy'],
        legal_basis: 'User consent or legitimate interest'
      }
    );
  }

  next();
}

/**
 * Error tracking middleware
 */
export function errorTrackingMiddleware(error: any, req: Request, res: Response, next: NextFunction) {
  const tenantCtx = tenantContext.getContext();
  
  // Log error with full context
  structuredLogger.error(
    LogCategory.API,
    'api_error_occurred',
    {
      error_message: error.message,
      error_stack: error.stack,
      method: req.method,
      endpoint: req.originalUrl || req.url,
      clinic_id: tenantCtx?.clinicId,
      user_id: tenantCtx?.userId,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      request_id: res.get('X-Request-ID')
    },
    req.originalUrl
  );

  // Send error response
  const statusCode = error.statusCode || error.status || 500;
  res.status(statusCode).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
    request_id: res.get('X-Request-ID'),
    timestamp: new Date().toISOString()
  });
}

/**
 * Request correlation middleware for distributed tracing
 */
export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Use existing request ID or generate new one
  const requestId = req.get('X-Request-ID') || nanoid(10);
  
  // Set correlation headers
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Correlation-ID', requestId);
  
  // Add to request for downstream use
  (req as any).correlationId = requestId;
  
  next();
}