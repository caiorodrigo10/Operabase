import { Request, Response } from 'express';
import { googleCalendarService } from './google-calendar-service';
import { storage } from './storage';
import { isAuthenticated } from './auth';

// Google Calendar OAuth initialization
export async function initGoogleCalendarAuth(req: any, res: Response) {
  try {
    const authUrl = googleCalendarService.generateAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
}

// Google Calendar OAuth callback
export async function handleGoogleCalendarCallback(req: any, res: Response) {
  try {
    const { code } = req.query;
    const userId = req.user.id;
    const clinicId = req.user.clinicId || 1; // Default clinic

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Exchange code for tokens
    const tokens = await googleCalendarService.getTokensFromCode(code as string);
    
    // Set credentials to get user info
    googleCalendarService.setCredentials(
      tokens.access_token,
      tokens.refresh_token,
      tokens.expiry_date
    );

    // Get calendar info
    const calendarInfo = await googleCalendarService.getUserCalendarInfo();

    // Check if integration already exists
    const existingIntegration = await storage.getCalendarIntegrationByUserAndProvider(
      userId,
      'google',
      calendarInfo.email
    );

    if (existingIntegration) {
      // Update existing integration
      await storage.updateCalendarIntegration(existingIntegration.id, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(tokens.expiry_date),
        calendar_id: calendarInfo.calendarId,
        is_active: true,
        last_sync: new Date(),
        sync_errors: null,
      });
    } else {
      // Create new integration
      await storage.createCalendarIntegration({
        user_id: userId,
        clinic_id: clinicId,
        provider: 'google',
        email: calendarInfo.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(tokens.expiry_date),
        calendar_id: calendarInfo.calendarId,
        sync_preference: 'one-way',
        is_active: true,
        last_sync: new Date(),
      });
    }

    // Redirect to settings page with success
    res.redirect('/configuracoes?calendar=connected');
  } catch (error) {
    console.error('Error handling calendar callback:', error);
    res.redirect('/configuracoes?calendar=error');
  }
}

// Get user's calendar integrations
export async function getUserCalendarIntegrations(req: any, res: Response) {
  try {
    const userId = req.user.id;
    const integrations = await storage.getCalendarIntegrations(userId);
    
    // Remove sensitive token data from response
    const sanitizedIntegrations = integrations.map(integration => ({
      id: integration.id,
      provider: integration.provider,
      email: integration.email,
      calendar_id: integration.calendar_id,
      sync_preference: integration.sync_preference,
      is_active: integration.is_active,
      last_sync: integration.last_sync,
      sync_errors: integration.sync_errors,
      created_at: integration.created_at,
    }));

    res.json(sanitizedIntegrations);
  } catch (error) {
    console.error('Error fetching calendar integrations:', error);
    res.status(500).json({ error: 'Failed to fetch calendar integrations' });
  }
}

// Update calendar integration sync preferences
export async function updateCalendarSyncPreferences(req: any, res: Response) {
  try {
    const { integrationId } = req.params;
    const { sync_preference } = req.body;
    const userId = req.user.id;

    // Verify the integration belongs to the user
    const integration = await storage.getCalendarIntegration(parseInt(integrationId));
    if (!integration || integration.user_id !== userId) {
      return res.status(404).json({ error: 'Calendar integration not found' });
    }

    const updated = await storage.updateCalendarIntegration(integration.id, {
      sync_preference,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating sync preferences:', error);
    res.status(500).json({ error: 'Failed to update sync preferences' });
  }
}

// Delete calendar integration
export async function deleteCalendarIntegration(req: any, res: Response) {
  try {
    const { integrationId } = req.params;
    const userId = req.user.id;

    // Verify the integration belongs to the user
    const integration = await storage.getCalendarIntegration(parseInt(integrationId));
    if (!integration || integration.user_id !== userId) {
      return res.status(404).json({ error: 'Calendar integration not found' });
    }

    const deleted = await storage.deleteCalendarIntegration(integration.id);
    
    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to delete integration' });
    }
  } catch (error) {
    console.error('Error deleting calendar integration:', error);
    res.status(500).json({ error: 'Failed to delete calendar integration' });
  }
}

// Sync appointment to Google Calendar
export async function syncAppointmentToCalendar(appointmentId: number, userId: number) {
  try {
    // Get user's active Google Calendar integration
    const integrations = await storage.getCalendarIntegrations(userId);
    const googleIntegration = integrations.find(
      integration => integration.provider === 'google' && integration.is_active
    );

    if (!googleIntegration) {
      console.log('No active Google Calendar integration found for user:', userId);
      return null;
    }

    // Get appointment details
    const appointment = await storage.getAppointment(appointmentId);
    if (!appointment) {
      console.error('Appointment not found:', appointmentId);
      return null;
    }

    // Get contact details
    const contact = await storage.getContact(appointment.contact_id);
    if (!contact) {
      console.error('Contact not found:', appointment.contact_id);
      return null;
    }

    // Set up Google Calendar service with user's tokens
    googleCalendarService.setCredentials(
      googleIntegration.access_token!,
      googleIntegration.refresh_token!,
      new Date(googleIntegration.token_expires_at!).getTime()
    );

    // Check if event already exists
    if (appointment.google_calendar_event_id) {
      // Update existing event
      const updatedEvent = await googleCalendarService.updateEvent(
        googleIntegration.calendar_id!,
        appointment.google_calendar_event_id,
        {
          summary: `Consulta: ${contact.name}`,
          description: `Consulta ${appointment.appointment_type || 'médica'} com ${contact.name}\n\nEspecialidade: ${appointment.specialty || 'Não especificada'}\nTelefone: ${contact.phone}\nEmail: ${contact.email || 'Não informado'}`,
          startDateTime: appointment.scheduled_date!.toISOString(),
          endDateTime: new Date(
            appointment.scheduled_date!.getTime() + (appointment.duration_minutes || 60) * 60000
          ).toISOString(),
          attendeeEmails: contact.email ? [contact.email] : undefined,
        }
      );
      return updatedEvent.id;
    } else {
      // Create new event
      const newEvent = await googleCalendarService.createEvent(
        googleIntegration.calendar_id!,
        {
          summary: `Consulta: ${contact.name}`,
          description: `Consulta ${appointment.appointment_type || 'médica'} com ${contact.name}\n\nEspecialidade: ${appointment.specialty || 'Não especificada'}\nTelefone: ${contact.phone}\nEmail: ${contact.email || 'Não informado'}`,
          startDateTime: appointment.scheduled_date!.toISOString(),
          endDateTime: new Date(
            appointment.scheduled_date!.getTime() + (appointment.duration_minutes || 60) * 60000
          ).toISOString(),
          attendeeEmails: contact.email ? [contact.email] : undefined,
        }
      );

      // Update appointment with Google Calendar event ID
      await storage.updateAppointment(appointmentId, {
        google_calendar_event_id: newEvent.id,
      });

      return newEvent.id;
    }
  } catch (error) {
    console.error('Error syncing appointment to calendar:', error);
    
    // If token expired, try to refresh
    if (error.message.includes('invalid_grant') || error.message.includes('401')) {
      try {
        const integrations = await storage.getCalendarIntegrations(userId);
        const googleIntegration = integrations.find(
          integration => integration.provider === 'google' && integration.is_active
        );

        if (googleIntegration?.refresh_token) {
          const refreshedTokens = await googleCalendarService.refreshAccessToken();
          
          await storage.updateCalendarIntegration(googleIntegration.id, {
            access_token: refreshedTokens.access_token,
            token_expires_at: new Date(refreshedTokens.expiry_date),
            sync_errors: null,
          });

          // Retry sync with new token
          return await syncAppointmentToCalendar(appointmentId, userId);
        }
      } catch (refreshError) {
        console.error('Error refreshing calendar token:', refreshError);
        
        // Mark integration as having errors
        const integrations = await storage.getCalendarIntegrations(userId);
        const googleIntegration = integrations.find(
          integration => integration.provider === 'google' && integration.is_active
        );
        
        if (googleIntegration) {
          await storage.updateCalendarIntegration(googleIntegration.id, {
            sync_errors: 'Token refresh failed. Please reconnect your calendar.',
          });
        }
      }
    }
    
    return null;
  }
}

// Remove appointment from Google Calendar
export async function removeAppointmentFromCalendar(appointmentId: number, userId: number) {
  try {
    const appointment = await storage.getAppointment(appointmentId);
    if (!appointment || !appointment.google_calendar_event_id) {
      return true; // Nothing to remove
    }

    const integrations = await storage.getCalendarIntegrations(userId);
    const googleIntegration = integrations.find(
      integration => integration.provider === 'google' && integration.is_active
    );

    if (!googleIntegration) {
      return true; // No integration, nothing to remove
    }

    googleCalendarService.setCredentials(
      googleIntegration.access_token!,
      googleIntegration.refresh_token!,
      new Date(googleIntegration.token_expires_at!).getTime()
    );

    await googleCalendarService.deleteEvent(
      googleIntegration.calendar_id!,
      appointment.google_calendar_event_id
    );

    // Clear the calendar event ID from appointment
    await storage.updateAppointment(appointmentId, {
      google_calendar_event_id: null,
    });

    return true;
  } catch (error) {
    console.error('Error removing appointment from calendar:', error);
    return false;
  }
}