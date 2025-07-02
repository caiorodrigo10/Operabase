
import { pgTable, text, varchar, boolean, timestamp, index, unique, uuid, serial, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enhanced users table for email/password authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  name: varchar("name").notNull(),
  role: varchar("role").notNull().default("admin"), // super_admin, admin, manager, user
  // profile_picture: text("profile_picture"), // TEMPORARIAMENTE COMENTADO - coluna não existe no banco
  is_active: boolean("is_active").notNull().default(true),
  last_login: timestamp("last_login"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Password reset tokens table
export const password_reset_tokens = pgTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expires_at: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_password_reset_tokens_user").on(table.user_id),
  index("idx_password_reset_tokens_token").on(table.token),
]);

// Clinic invitations table
export const clinic_invitations = pgTable("clinic_invitations", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  admin_email: varchar("admin_email", { length: 255 }).notNull(),
  admin_name: varchar("admin_name", { length: 255 }).notNull(),
  clinic_name: varchar("clinic_name", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, completed, expired
  created_by_user_id: integer("created_by_user_id").notNull(),
  clinic_id: integer("clinic_id"), // preenchido após completar convite
  expires_at: timestamp("expires_at").notNull(),
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_clinic_invitations_token").on(table.token),
  index("idx_clinic_invitations_status").on(table.status),
  index("idx_clinic_invitations_created_by").on(table.created_by_user_id),
]);

export const insertUserSchema = createInsertSchema(users);

export const insertPasswordResetTokenSchema = createInsertSchema(password_reset_tokens);

export const insertClinicInvitationSchema = createInsertSchema(clinic_invitations);

// Schema for creating clinic invitation (admin interface)
export const createClinicInvitationSchema = z.object({
  admin_email: z.string().email("Email inválido"),
  admin_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  clinic_name: z.string().min(2, "Nome da clínica deve ter pelo menos 2 caracteres"),
});

// Schema for accepting clinic invitation (public interface)
export const acceptClinicInvitationSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  admin_password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirm_password: z.string().min(6, "Confirmação de senha é obrigatória"),
  clinic_name: z.string().min(2, "Nome da clínica deve ter pelo menos 2 caracteres"),
}).refine((data) => data.admin_password === data.confirm_password, {
  message: "Senhas não coincidem",
  path: ["confirm_password"],
});

// User profile update schema
export const updateUserProfileSchema = createInsertSchema(users).extend({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Para alterar a senha, forneça a senha atual e confirme a nova senha",
  path: ["newPassword"],
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PasswordResetToken = typeof password_reset_tokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
