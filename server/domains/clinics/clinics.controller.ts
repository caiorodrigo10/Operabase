import { Request, Response } from 'express';
import { ClinicsService } from './clinics.service';
import { ClinicsRepository } from './clinics.repository';
import { createClinicSchema, updateClinicSchema } from './clinics.types';

export class ClinicsController {
  private service: ClinicsService;

  constructor(storage: any) {
    const { ClinicsRepository } = require('./clinics.repository');
    const repository = new ClinicsRepository(storage);
    this.service = new ClinicsService(repository);
  }

  async getClinicById(req: Request, res: Response) {
    try {
      const clinicId = parseInt(req.params.id);
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
      }

      const clinic = await this.service.getClinicById(clinicId);
      res.json(clinic);
    } catch (error: any) {
      console.error("Error fetching clinic:", error);
      if (error.message === 'Clinic not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  async createClinic(req: Request, res: Response) {
    try {
      const validatedData = createClinicSchema.parse(req.body);
      const clinic = await this.service.createClinic(validatedData);
      res.status(201).json(clinic);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating clinic:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  async updateClinic(req: Request, res: Response) {
    try {
      const clinicId = parseInt(req.params.id);
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
      }

      const validatedData = updateClinicSchema.parse(req.body);
      const clinic = await this.service.updateClinic(clinicId, validatedData);

      res.json(clinic);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }

      console.error("Error updating clinic:", error);
      if (error.message === 'Clinic not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  async getClinicUsers(req: Request, res: Response) {
    try {
      const clinicId = parseInt(req.params.id);
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
      }

      const clinicUsers = await this.service.getClinicUsers(clinicId);
      res.json(clinicUsers);
    } catch (error: any) {
      console.error("Error fetching clinic users:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  async createUserInClinic(req: Request, res: Response) {
    try {
      const clinicId = parseInt(req.params.clinicId);
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
      }

      const validatedData = createUserInClinicSchema.parse({
        ...req.body,
        clinicId,
        createdBy: (req as any).user?.id || ''
      });

      const result = await this.service.createUserInClinic(validatedData);
      res.json({ 
        message: 'Usuário criado com sucesso',
        user: result 
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }

      console.error('Error creating user:', error);
      res.status(500).json({ error: error.message || 'Erro interno do servidor' });
    }
  }

  async removeUserFromClinic(req: Request, res: Response) {
    try {
      const clinicId = parseInt(req.params.clinicId);
      const userId = parseInt(req.params.userId);

      if (isNaN(clinicId) || isNaN(userId)) {
        return res.status(400).json({ error: "Invalid clinic ID or user ID" });
      }

      await this.service.removeUserFromClinic(clinicId, userId);
      res.json({ message: 'Usuário removido com sucesso' });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      if (error.message === 'User not found in clinic') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || 'Erro interno do servidor' });
    }
  }
}