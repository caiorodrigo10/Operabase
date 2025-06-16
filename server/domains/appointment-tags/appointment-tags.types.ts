
import { z } from 'zod';

export const createAppointmentTagSchema = z.object({
  clinic_id: z.number(),
  name: z.string().min(1),
  color: z.string().optional(),
  description: z.string().optional()
});

export const updateAppointmentTagSchema = createAppointmentTagSchema.partial().omit({ clinic_id: true });

export type CreateAppointmentTagRequest = z.infer<typeof createAppointmentTagSchema>;
export type UpdateAppointmentTagRequest = z.infer<typeof updateAppointmentTagSchema>;
