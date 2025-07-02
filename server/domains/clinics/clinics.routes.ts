import { Router } from "express";
import { ClinicsController } from "./clinics.controller";
import { z } from "zod";
import { isAuthenticated } from "../../auth.js";
import { validateRequest } from "../../middleware/validation";

const router = Router();
const clinicsController = new ClinicsController();

// Schema for creating clinic invitation
const createInvitationSchema = z.object({
  admin_email: z.string().email("Email inválido"),
  admin_name: z.string().min(1, "Nome é obrigatório"),
  clinic_name: z.string().min(1, "Nome da clínica é obrigatório")
});

// Schema for accepting clinic invitation
const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres")
});

// Get clinic by ID (authenticated)
router.get('/:id', isAuthenticated, clinicsController.getClinicById);

// Update clinic (admin only)
router.patch('/:id', isAuthenticated, requireRole(['admin', 'super_admin']), clinicsController.updateClinic);

// List all clinics (super admin only)
router.get('/', isAuthenticated, requireRole(['super_admin']), clinicsController.listClinics);

// Create clinic invitation (super admin only)
router.post('/invitations', 
  isAuthenticated, 
  requireRole(['super_admin']), 
  validateRequest(createInvitationSchema),
  clinicsController.createInvitation
);

// Get invitation by token (public)
router.get('/invitations/:token', clinicsController.getInvitationByToken);

// Accept invitation (public)
router.post('/invitations/:token/accept', 
  validateRequest(acceptInvitationSchema),
  clinicsController.acceptInvitation
);

// List invitations (super admin only)
router.get('/invitations', 
  isAuthenticated, 
  requireRole(['super_admin']), 
  clinicsController.listInvitations
);

// Cancel invitation (super admin only)
router.delete('/invitations/:id', 
  isAuthenticated, 
  requireRole(['super_admin']), 
  clinicsController.cancelInvitation
);

export { router as clinicsRoutes };