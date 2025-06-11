import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const clinics = pgTable("clinics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  responsible: text("responsible").notNull(),
  whatsapp_number: text("whatsapp_number").notNull(),
  specialties: text("specialties").array(),
  working_hours: text("working_hours"),
  created_at: timestamp("created_at").defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").references(() => clinics.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  status: text("status").notNull(), // novo, em_conversa, agendado, realizado, pos_atendimento
  first_contact: timestamp("first_contact").defaultNow(),
  last_interaction: timestamp("last_interaction").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  contact_id: integer("contact_id").references(() => contacts.id),
  clinic_id: integer("clinic_id").references(() => clinics.id),
  status: text("status").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversation_id: integer("conversation_id").references(() => conversations.id),
  sender_type: text("sender_type").notNull(), // patient, ai
  content: text("content").notNull(),
  ai_action: text("ai_action"), // agendou_consulta, enviou_followup, etc
  timestamp: timestamp("timestamp").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  contact_id: integer("contact_id").references(() => contacts.id),
  clinic_id: integer("clinic_id").references(() => clinics.id),
  doctor_name: text("doctor_name"),
  specialty: text("specialty"),
  scheduled_date: timestamp("scheduled_date"),
  status: text("status").notNull(), // agendado, realizado, cancelado
  created_at: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertClinicSchema = createInsertSchema(clinics).omit({
  id: true,
  created_at: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  first_contact: true,
  last_interaction: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  created_at: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Clinic = typeof clinics.$inferSelect;
export type InsertClinic = z.infer<typeof insertClinicSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
