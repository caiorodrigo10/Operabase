import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  location?: string;
  status: string;
}

export interface CreateCalendarEventRequest {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  attendeeEmails?: string[];
  location?: string;
  timeZone?: string;
}

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Generate OAuth2 authorization URL
   */
  generateAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  }> {
    const { tokens } = await this.oauth2Client.getToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to obtain valid tokens from Google');
    }

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date || Date.now() + 3600000 // 1 hour default
    };
  }

  /**
   * Set credentials for authenticated requests
   */
  setCredentials(accessToken: string, refreshToken: string, expiryDate: number) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiryDate
    });
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<{
    access_token: string;
    expiry_date: number;
  }> {
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    return {
      access_token: credentials.access_token,
      expiry_date: credentials.expiry_date || Date.now() + 3600000
    };
  }

  /**
   * Get user's primary calendar info
   */
  async getUserCalendarInfo(): Promise<{
    email: string;
    calendarId: string;
    timeZone: string;
  }> {
    try {
      // Get user info
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      
      // Get primary calendar
      const calendarList = await this.calendar.calendarList.list();
      const primaryCalendar = calendarList.data.items?.find(
        (cal: any) => cal.primary === true
      );

      if (!primaryCalendar) {
        throw new Error('Primary calendar not found');
      }

      return {
        email: userInfo.data.email!,
        calendarId: primaryCalendar.id!,
        timeZone: primaryCalendar.timeZone || 'America/Sao_Paulo'
      };
    } catch (error) {
      console.error('Error getting calendar info:', error);
      throw new Error('Failed to get calendar information');
    }
  }

  /**
   * Create a calendar event
   */
  async createEvent(calendarId: string, eventData: CreateCalendarEventRequest): Promise<GoogleCalendarEvent> {
    try {
      const event = {
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: eventData.startDateTime,
          timeZone: eventData.timeZone || 'America/Sao_Paulo',
        },
        end: {
          dateTime: eventData.endDateTime,
          timeZone: eventData.timeZone || 'America/Sao_Paulo',
        },
        attendees: eventData.attendeeEmails?.map(email => ({ email })),
        location: eventData.location,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 }, // 30 minutes before
          ],
        },
      };

      const response = await this.calendar.events.insert({
        calendarId,
        resource: event,
        sendNotifications: true,
      });

      return response.data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  /**
   * Update a calendar event
   */
  async updateEvent(
    calendarId: string, 
    eventId: string, 
    eventData: Partial<CreateCalendarEventRequest>
  ): Promise<GoogleCalendarEvent> {
    try {
      const updateData: any = {};
      
      if (eventData.summary) updateData.summary = eventData.summary;
      if (eventData.description) updateData.description = eventData.description;
      if (eventData.location) updateData.location = eventData.location;
      
      if (eventData.startDateTime && eventData.endDateTime) {
        updateData.start = {
          dateTime: eventData.startDateTime,
          timeZone: eventData.timeZone || 'America/Sao_Paulo',
        };
        updateData.end = {
          dateTime: eventData.endDateTime,
          timeZone: eventData.timeZone || 'America/Sao_Paulo',
        };
      }

      if (eventData.attendeeEmails) {
        updateData.attendees = eventData.attendeeEmails.map(email => ({ email }));
      }

      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        resource: updateData,
        sendNotifications: true,
      });

      return response.data;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
        sendNotifications: true,
      });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }

  /**
   * Get events from calendar
   */
  async getEvents(
    calendarId: string,
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 250
  ): Promise<GoogleCalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: timeMin || new Date().toISOString(),
        timeMax,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error getting calendar events:', error);
      throw new Error('Failed to get calendar events');
    }
  }

  /**
   * Check if user has calendar access
   */
  async checkCalendarAccess(calendarId: string): Promise<boolean> {
    try {
      await this.calendar.calendars.get({ calendarId });
      return true;
    } catch (error) {
      console.error('Calendar access check failed:', error);
      return false;
    }
  }

  /**
   * Get free/busy information
   */
  async getFreeBusy(
    calendarId: string,
    timeMin: string,
    timeMax: string
  ): Promise<Array<{ start: string; end: string }>> {
    try {
      const response = await this.calendar.freebusy.query({
        resource: {
          timeMin,
          timeMax,
          items: [{ id: calendarId }],
        },
      });

      const calendar = response.data.calendars?.[calendarId];
      return calendar?.busy || [];
    } catch (error) {
      console.error('Error getting free/busy information:', error);
      throw new Error('Failed to get free/busy information');
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();