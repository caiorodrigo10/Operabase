import { db } from "./db";
import type { IStorage } from "./storage";

/**
 * Minimal storage implementation to get the server running
 * This provides basic functionality while avoiding complex schema imports
 */
export class MinimalStorage implements IStorage {
  async testConnection(): Promise<void> {
    try {
      console.log('🔍 Testing database connection...');
      await db.execute('SELECT 1');
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  // Minimal implementations to satisfy interface requirements
  async getUserByEmail(email: string): Promise<any> {
    try {
      const result = await db.execute(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async getUserById(id: any): Promise<any> {
    try {
      const result = await db.execute(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting user by id:', error);
      return null;
    }
  }

  async createUser(userData: any): Promise<any> {
    try {
      const { email, password, name, role = 'user' } = userData;
      const result = await db.execute(
        `INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING *`,
        [email, password, name, role]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: any, userData: any): Promise<any> {
    try {
      const fields = Object.keys(userData).map((key, index) => `${key} = $${index + 2}`).join(', ');
      const values = [id, ...Object.values(userData)];
      const result = await db.execute(
        `UPDATE users SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        values
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Placeholder methods for interface compatibility
  async getUserClinics(userId: any): Promise<any[]> {
    return [];
  }

  async getClinicUsers(clinicId: number): Promise<any[]> {
    return [];
  }

  async userHasClinicAccess(userId: any, clinicId: number): Promise<boolean> {
    return true; // Simplified for startup
  }

  async getContacts(clinicId: number): Promise<any[]> {
    return [];
  }

  async getContact(id: number): Promise<any> {
    return null;
  }

  async createContact(contactData: any): Promise<any> {
    return contactData;
  }

  async updateContact(id: number, contactData: any): Promise<any> {
    return contactData;
  }

  async getAppointments(clinicId: number): Promise<any[]> {
    return [];
  }

  async getAppointment(id: number): Promise<any> {
    return null;
  }

  async createAppointment(appointmentData: any): Promise<any> {
    return appointmentData;
  }

  async updateAppointment(id: number, appointmentData: any): Promise<any> {
    return appointmentData;
  }

  async deleteAppointment(id: number): Promise<void> {
    // No-op for now
  }

  async getClinic(id: number): Promise<any> {
    return null;
  }

  async createClinic(clinicData: any): Promise<any> {
    return clinicData;
  }

  async updateClinic(id: number, clinicData: any): Promise<any> {
    return clinicData;
  }

  // Additional placeholder methods as needed
  [key: string]: any;
}

export const minimalStorage = new MinimalStorage();