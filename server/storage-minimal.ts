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
      return result.rows?.[0] || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async getUserById(id: any): Promise<any> {
    try {
      const result = await db.execute(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id]);
      return result.rows?.[0] || null;
    } catch (error) {
      console.error('Error getting user by id:', error);
      return null;
    }
  }

  async getUser(id: any): Promise<any> {
    return this.getUserById(id);
  }

  async createUser(userData: any): Promise<any> {
    try {
      const { email, password, name, role = 'user' } = userData;
      const result = await db.execute(
        `INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING *`,
        [email, password, name, role]
      );
      return result.rows?.[0];
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

  // Clinic user management methods
  async getUserClinics(userId: any): Promise<any[]> {
    try {
      const result = await db.execute(`
        SELECT c.*, cu.role, cu.is_professional, cu.is_active as user_active
        FROM clinics c
        JOIN clinic_users cu ON c.id = cu.clinic_id
        WHERE cu.user_id = $1 AND cu.is_active = true
      `, [userId]);
      return result.rows || [];
    } catch (error) {
      console.error('Error getting user clinics:', error);
      return [];
    }
  }

  async getClinicUsers(clinicId: number): Promise<any[]> {
    try {
      const result = await db.execute(`
        SELECT cu.*, u.name, u.email, u.created_at as user_created_at
        FROM clinic_users cu
        JOIN users u ON cu.user_id = u.id
        WHERE cu.clinic_id = $1
        ORDER BY u.name
      `, [clinicId]);
      return result.rows || [];
    } catch (error) {
      console.error('Error getting clinic users:', error);
      return [];
    }
  }

  async userHasClinicAccess(userId: any, clinicId: number): Promise<boolean> {
    try {
      const result = await db.execute(`
        SELECT 1 FROM clinic_users 
        WHERE user_id = $1 AND clinic_id = $2 AND is_active = true
      `, [userId, clinicId]);
      return result.rows && result.rows.length > 0;
    } catch (error) {
      console.error('Error checking clinic access:', error);
      return false;
    }
  }

  async addUserToClinic(userId: string, clinicId: number, role: string = 'usuario'): Promise<any> {
    try {
      const result = await db.execute(`
        INSERT INTO clinic_users (user_id, clinic_id, role, is_active, joined_at)
        VALUES ($1, $2, $3, true, NOW())
        RETURNING *
      `, [userId, clinicId, role]);
      return result.rows?.[0];
    } catch (error) {
      console.error('Error adding user to clinic:', error);
      throw error;
    }
  }

  async updateClinicUserRole(userId: string, clinicId: number, role: string): Promise<any> {
    try {
      const result = await db.execute(`
        UPDATE clinic_users SET role = $3, updated_at = NOW()
        WHERE user_id = $1 AND clinic_id = $2
        RETURNING *
      `, [userId, clinicId, role]);
      return result.rows?.[0];
    } catch (error) {
      console.error('Error updating clinic user role:', error);
      throw error;
    }
  }

  async removeUserFromClinic(userId: string, clinicId: number): Promise<boolean> {
    try {
      await db.execute(`
        UPDATE clinic_users SET is_active = false, updated_at = NOW()
        WHERE user_id = $1 AND clinic_id = $2
      `, [userId, clinicId]);
      return true;
    } catch (error) {
      console.error('Error removing user from clinic:', error);
      return false;
    }
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

  async getAppointments(clinicId: number, filters: any = {}): Promise<any[]> {
    try {
      const result = await db.execute(`
        SELECT a.*, c.name as contact_name, c.phone as contact_phone 
        FROM appointments a 
        LEFT JOIN contacts c ON a.contact_id = c.id 
        WHERE a.clinic_id = $1 
        ORDER BY a.scheduled_date DESC, a.scheduled_time DESC
      `, [clinicId]);
      return result.rows || [];
    } catch (error) {
      console.error('Error getting appointments:', error);
      return [];
    }
  }

  async getAppointment(id: number): Promise<any> {
    try {
      const result = await db.execute(`
        SELECT a.*, c.name as contact_name, c.phone as contact_phone 
        FROM appointments a 
        LEFT JOIN contacts c ON a.contact_id = c.id 
        WHERE a.id = $1
      `, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting appointment:', error);
      return null;
    }
  }

  async getAppointmentsByContact(contactId: number): Promise<any[]> {
    try {
      const result = await db.execute(`
        SELECT * FROM appointments WHERE contact_id = $1 ORDER BY scheduled_date DESC
      `, [contactId]);
      return result.rows || [];
    } catch (error) {
      console.error('Error getting appointments by contact:', error);
      return [];
    }
  }

  async getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const result = await db.execute(`
        SELECT a.*, c.name as contact_name, c.phone as contact_phone 
        FROM appointments a 
        LEFT JOIN contacts c ON a.contact_id = c.id 
        WHERE a.scheduled_date BETWEEN $1 AND $2 
        ORDER BY a.scheduled_date, a.scheduled_time
      `, [startDate, endDate]);
      return result.rows || [];
    } catch (error) {
      console.error('Error getting appointments by date range:', error);
      return [];
    }
  }

  async createAppointment(appointmentData: any): Promise<any> {
    try {
      const {
        clinic_id,
        contact_id,
        user_id,
        scheduled_date,
        scheduled_time,
        duration,
        type,
        status = 'agendado',
        notes
      } = appointmentData;
      
      const result = await db.execute(`
        INSERT INTO appointments (clinic_id, contact_id, user_id, scheduled_date, scheduled_time, duration, type, status, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [clinic_id, contact_id, user_id, scheduled_date, scheduled_time, duration, type, status, notes]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async updateAppointment(id: number, appointmentData: any): Promise<any> {
    try {
      const fields = Object.keys(appointmentData);
      const values = Object.values(appointmentData);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      
      const result = await db.execute(`
        UPDATE appointments SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *
      `, [id, ...values]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  async deleteAppointment(id: number): Promise<boolean> {
    try {
      const result = await db.execute(`DELETE FROM appointments WHERE id = $1`, [id]);
      return true;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      return false;
    }
  }

  async getClinic(id: number): Promise<any> {
    try {
      const result = await db.execute(`SELECT * FROM clinics WHERE id = $1`, [id]);
      if (result.rows && result.rows.length > 0) {
        return result.rows[0];
      }
      
      // If clinic 1 doesn't exist, create it as default clinic
      if (id === 1) {
        console.log('Creating default clinic with ID 1...');
        const defaultClinic = await this.createDefaultClinic();
        return defaultClinic;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting clinic:', error);
      return null;
    }
  }

  async createDefaultClinic(): Promise<any> {
    try {
      const result = await db.execute(`
        INSERT INTO clinics (
          id, name, email, phone, address, city, state, 
          operating_hours, timezone, created_at, updated_at
        ) VALUES (
          1, 'Clínica Exemplo', 'contato@clinica.com', '(11) 99999-9999', 
          'Rua Exemplo, 123', 'São Paulo', 'SP',
          '{"monday": {"start": "08:00", "end": "18:00", "enabled": true}, "tuesday": {"start": "08:00", "end": "18:00", "enabled": true}, "wednesday": {"start": "08:00", "end": "18:00", "enabled": true}, "thursday": {"start": "08:00", "end": "18:00", "enabled": true}, "friday": {"start": "08:00", "end": "18:00", "enabled": true}, "saturday": {"start": "08:00", "end": "12:00", "enabled": true}, "sunday": {"start": "08:00", "end": "12:00", "enabled": false}}',
          'America/Sao_Paulo', NOW(), NOW()
        ) ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          updated_at = NOW()
        RETURNING *
      `);
      console.log('✅ Default clinic created successfully');
      return result.rows?.[0];
    } catch (error) {
      console.error('Error creating default clinic:', error);
      throw error;
    }
  }

  async createClinic(clinicData: any): Promise<any> {
    try {
      const {
        name, email, phone, address, city, state,
        operating_hours, timezone
      } = clinicData;
      
      const result = await db.execute(`
        INSERT INTO clinics (name, email, phone, address, city, state, operating_hours, timezone, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `, [name, email, phone, address, city, state, operating_hours, timezone]);
      
      return result.rows?.[0];
    } catch (error) {
      console.error('Error creating clinic:', error);
      throw error;
    }
  }

  async updateClinic(id: number, clinicData: any): Promise<any> {
    try {
      const fields = Object.keys(clinicData);
      const values = Object.values(clinicData);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      
      const result = await db.execute(`
        UPDATE clinics SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *
      `, [id, ...values]);
      
      return result.rows?.[0];
    } catch (error) {
      console.error('Error updating clinic:', error);
      throw error;
    }
  }

  async createUserInClinic(data: any): Promise<any> {
    try {
      const { clinic_id, user_id, role = 'usuario' } = data;
      const result = await db.execute(`
        INSERT INTO clinic_users (clinic_id, user_id, role, is_active, joined_at)
        VALUES ($1, $2, $3, true, NOW())
        ON CONFLICT (clinic_id, user_id) DO UPDATE SET
          role = EXCLUDED.role,
          is_active = true,
          updated_at = NOW()
        RETURNING *
      `, [clinic_id, user_id, role]);
      return result.rows?.[0];
    } catch (error) {
      console.error('Error creating user in clinic:', error);
      throw error;
    }
  }

  // Appointment tag methods
  async getAppointmentTags(clinicId: number): Promise<any[]> {
    try {
      const result = await db.execute(`
        SELECT * FROM appointment_tags 
        WHERE clinic_id = $1 
        ORDER BY name
      `, [clinicId]);
      return result.rows || [];
    } catch (error) {
      console.error('Error getting appointment tags:', error);
      return [];
    }
  }

  async createAppointmentTag(tagData: any): Promise<any> {
    try {
      const { clinic_id, name, color } = tagData;
      const result = await db.execute(`
        INSERT INTO appointment_tags (clinic_id, name, color, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *
      `, [clinic_id, name, color]);
      return result.rows?.[0];
    } catch (error) {
      console.error('Error creating appointment tag:', error);
      throw error;
    }
  }

  async updateAppointmentTag(id: number, tagData: any): Promise<any> {
    try {
      const { name, color } = tagData;
      const result = await db.execute(`
        UPDATE appointment_tags 
        SET name = $2, color = $3, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id, name, color]);
      return result.rows?.[0];
    } catch (error) {
      console.error('Error updating appointment tag:', error);
      throw error;
    }
  }

  async deleteAppointmentTag(id: number): Promise<boolean> {
    try {
      await db.execute(`DELETE FROM appointment_tags WHERE id = $1`, [id]);
      return true;
    } catch (error) {
      console.error('Error deleting appointment tag:', error);
      return false;
    }
  }

  // Additional placeholder methods as needed
  [key: string]: any;
}

export const minimalStorage = new MinimalStorage();