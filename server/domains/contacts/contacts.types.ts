
import { z } from 'zod';

// Request schemas
export const createContactSchema = z.object({
  clinic_id: z.number(),
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  status: z.string().default('novo'),
  source: z.string().default('cadastro'),
  gender: z.string().optional(),
  profession: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  emergency_contact: z.string().optional(),
});

export const updateContactSchema = createContactSchema.partial();

export const contactStatusUpdateSchema = z.object({
  status: z.string(),
});

export type CreateContactRequest = z.infer<typeof createContactSchema>;
export type UpdateContactRequest = z.infer<typeof updateContactSchema>;
export type ContactStatusUpdateRequest = z.infer<typeof contactStatusUpdateSchema>;
