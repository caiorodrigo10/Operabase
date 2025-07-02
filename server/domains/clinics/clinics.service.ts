
import { db } from "../../db";
import { clinics, clinic_invitations, clinic_users } from "./clinics.schema";
import { users } from "../auth/auth.schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { SupabaseEmailService } from "../../services/email.service";
import { AuthService } from "../auth/auth.service";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export class ClinicsService {
  private emailService = new SupabaseEmailService();
  private authService = new AuthService();

  async getClinicById(id: number) {
    const [clinic] = await db.select().from(clinics).where(eq(clinics.id, id));
    return clinic;
  }

  async updateClinic(id: number, data: any) {
    const [updatedClinic] = await db
      .update(clinics)
      .set({ ...data, updated_at: new Date() })
      .where(eq(clinics.id, id))
      .returning();
    
    return updatedClinic;
  }

  async listClinics(filters: { status?: string; page: number; limit: number }) {
    const { status, page, limit } = filters;
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];
    if (status) {
      conditions.push(eq(clinics.status, status));
    }

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(clinics)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get clinics with pagination
    const clinicsList = await db
      .select()
      .from(clinics)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(clinics.created_at))
      .limit(limit)
      .offset(offset);

    return {
      clinics: clinicsList,
      total: totalResult.count,
      page,
      limit,
      totalPages: Math.ceil(totalResult.count / limit)
    };
  }

  async createInvitation(data: {
    admin_email: string;
    admin_name: string;
    clinic_name: string;
    created_by_user_id: number;
  }) {
    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation for admin user
    const [invitation] = await db
      .insert(clinic_invitations)
      .values({
        email: data.admin_email,
        role: 'admin', // admin role for the clinic
        invited_by: data.created_by_user_id,
        token,
        expires_at: expiresAt,
        status: 'pending',
        // Store additional data in the new columns
        admin_email: data.admin_email,
        admin_name: data.admin_name,
        clinic_name: data.clinic_name,
        created_by_user_id: data.created_by_user_id
      })
      .returning();

    // Send invitation email
    await this.emailService.sendClinicInvitation(
      data.admin_email,
      data.admin_name,
      data.clinic_name,
      token
    );

    return invitation;
  }

  async getInvitationByToken(token: string) {
    const [invitation] = await db
      .select()
      .from(clinic_invitations)
      .where(and(
        eq(clinic_invitations.token, token),
        eq(clinic_invitations.status, 'pending')
      ));

    if (!invitation) {
      return null;
    }

    // Check if expired
    if (new Date() > new Date(invitation.expires_at)) {
      return null;
    }

    return invitation;
  }

  async acceptInvitation(token: string, password: string) {
    // Get invitation
    const invitation = await this.getInvitationByToken(token);
    
    if (!invitation) {
      throw new Error('Convite não encontrado ou expirado');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Este convite já foi aceito');
    }

    // Check if user already exists
    const existingUser = await this.authService.getUserByEmail(invitation.admin_email);
    if (existingUser) {
      throw new Error('Este email já está sendo usado por outro usuário');
    }

    try {
      // Start transaction-like operations
      
      // 1. Create clinic
      const [newClinic] = await db
        .insert(clinics)
        .values({
          name: invitation.clinic_name,
          responsible: invitation.admin_name,
          status: 'active'
        })
        .returning();

      // 2. Create user
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const [newUser] = await db
        .insert(users)
        .values({
          name: invitation.admin_name,
          email: invitation.admin_email,
          password: hashedPassword,
          role: 'admin'
        })
        .returning();

      // 3. Link user to clinic
      await db
        .insert(clinic_users)
        .values({
          user_id: newUser.id,
          clinic_id: newClinic.id,
          role: 'admin',
          is_professional: true,
          is_active: true
        });

      // 4. Update invitation
      await db
        .update(clinic_invitations)
        .set({
          status: 'accepted',
          clinic_id: newClinic.id,
          completed_at: new Date()
        })
        .where(eq(clinic_invitations.id, invitation.id));

      return {
        message: 'Convite aceito com sucesso',
        clinic: newClinic,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      };

    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw new Error('Erro ao aceitar convite');
    }
  }

  async listInvitations(filters: { status?: string; page: number; limit: number }) {
    try {
      // Build query with Drizzle
      let baseQuery = db.select({
        id: clinic_invitations.id,
        clinic_id: clinic_invitations.clinic_id,
        email: clinic_invitations.email,
        role: clinic_invitations.role,
        admin_email: clinic_invitations.admin_email,
        admin_name: clinic_invitations.admin_name,
        clinic_name: clinic_invitations.clinic_name,
        token: clinic_invitations.token,
        expires_at: clinic_invitations.expires_at,
        status: clinic_invitations.status,
        created_at: clinic_invitations.created_at,
        completed_at: clinic_invitations.completed_at,
        created_by_user_id: clinic_invitations.created_by_user_id,
        creator_name: users.name
      })
      .from(clinic_invitations)
      .leftJoin(users, eq(clinic_invitations.created_by_user_id, users.id));
      
      // Apply status filter if provided
      if (filters.status) {
        baseQuery = baseQuery.where(eq(clinic_invitations.status, filters.status));
      }
      
      // Apply pagination
      const invitations = await baseQuery
        .orderBy(desc(clinic_invitations.created_at))
        .limit(filters.limit)
        .offset((filters.page - 1) * filters.limit);

      // Get total count
      let countQuery = db.select({ count: sql<number>`count(*)` }).from(clinic_invitations);
      if (filters.status) {
        countQuery = countQuery.where(eq(clinic_invitations.status, filters.status));
      }
      
      const countResult = await countQuery;
      const total = Number(countResult[0]?.count || 0);

      return {
        invitations,
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit)
      };
    } catch (error) {
      console.error('Error listing invitations:', error);
      // Return empty result on error
      return {
        invitations: [],
        total: 0,
        page: filters.page,
        limit: filters.limit,
        totalPages: 0
      };
    }
  }

  async cancelInvitation(invitationId: string) {
    const [invitation] = await db
      .select()
      .from(clinic_invitations)
      .where(eq(clinic_invitations.id, invitationId));

    if (!invitation) {
      throw new Error('Convite não encontrado');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Apenas convites pendentes podem ser cancelados');
    }

    await db
      .update(clinic_invitations)
      .set({
        status: 'cancelled'
      })
      .where(eq(clinic_invitations.id, invitationId));
  }
}
