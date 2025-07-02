import { Request, Response } from "express";
import { ClinicsService } from "./clinics.service";
import { createClinicInvitationSchema } from "./clinics.schema";
import { z } from "zod";

export class ClinicsController {
  private clinicsService = new ClinicsService();

  // Get clinic by ID
  getClinicById = async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.id);
      
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "ID da clínica inválido" });
      }

      const clinic = await this.clinicsService.getClinicById(clinicId);
      
      if (!clinic) {
        return res.status(404).json({ error: "Clínica não encontrada" });
      }

      return res.json(clinic);
    } catch (error) {
      console.error('Error fetching clinic:', error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  };

  // Update clinic
  updateClinic = async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.id);
      
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "ID da clínica inválido" });
      }

      const updatedClinic = await this.clinicsService.updateClinic(clinicId, req.body);
      
      return res.json(updatedClinic);
    } catch (error) {
      console.error('Error updating clinic:', error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  };

  // List all clinics (super admin only)
  listClinics = async (req: Request, res: Response) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      
      const result = await this.clinicsService.listClinics({
        status: status as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      return res.json(result);
    } catch (error) {
      console.error('Error listing clinics:', error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  };

  // Create clinic invitation
  createInvitation = async (req: Request, res: Response) => {
    try {
      const { admin_email, admin_name, clinic_name } = req.body;
      const createdByUserId = req.user?.id;

      if (!createdByUserId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      // Check if user already exists
      const storage = req.app.get('storage');
      const existingUser = await storage.getUserByEmail(admin_email);
      if (existingUser) {
        return res.status(400).json({ 
          error: "Este email já está sendo usado por outro usuário" 
        });
      }

      const invitation = await this.clinicsService.createInvitation({
        admin_email,
        admin_name,
        clinic_name,
        created_by_user_id: createdByUserId
      });

      return res.status(201).json(invitation);
    } catch (error) {
      console.error('Error creating invitation:', error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  };

  // Get invitation by token
  getInvitationByToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      
      const invitation = await this.clinicsService.getInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ error: "Convite não encontrado ou expirado" });
      }

      // Remove sensitive information
      const { created_by_user_id, ...safeInvitation } = invitation;
      
      return res.json(safeInvitation);
    } catch (error) {
      console.error('Error fetching invitation:', error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  };

  // Accept invitation
  acceptInvitation = async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      const result = await this.clinicsService.acceptInvitation(token, password);
      
      return res.json(result);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('não encontrado') || error.message.includes('expirado')) {
          return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('já foi aceito')) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  };

  // List invitations
  listInvitations = async (req: Request, res: Response) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      
      const result = await this.clinicsService.listInvitations({
        status: status as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      return res.json(result);
    } catch (error) {
      console.error('Error listing invitations:', error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  };

  // Cancel invitation
  cancelInvitation = async (req: Request, res: Response) => {
    try {
      const invitationId = req.params.id;
      
      await this.clinicsService.cancelInvitation(invitationId);
      
      return res.json({ message: "Convite cancelado com sucesso" });
    } catch (error) {
      console.error('Error canceling invitation:', error);
      
      if (error instanceof Error && error.message.includes('não encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  };
}