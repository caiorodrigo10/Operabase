import { Request, Response } from 'express';
import { IStorage } from './storage';
import { isAuthenticated } from './auth';

interface BasicAdminMetrics {
  totalClinics: number;
  totalUsers: number;
  totalContacts: number;
  totalAppointments: number;
}

export function setupAdminRoutes(app: any, storage: IStorage) {
  // Admin Dashboard Metrics
  app.get('/api/admin/dashboard', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Check if user has super_admin role
      const user = (req as any).user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ error: 'Access denied. Super admin role required.' });
      }

      // Get metrics from existing data sources
      const [clinics, users, contacts, appointments] = await Promise.all([
        storage.getClinics(),
        storage.getAllUsers(),
        storage.getAllContacts(),
        storage.getAllAppointments()
      ]);

      const metrics: BasicAdminMetrics = {
        totalClinics: clinics.length,
        totalUsers: users.length,
        totalContacts: contacts.length,
        totalAppointments: appointments.length
      };

      res.json(metrics);
    } catch (error) {
      console.error('Error fetching admin dashboard metrics:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
  });

  // Admin Clinics List
  app.get('/api/admin/clinics', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ error: 'Access denied. Super admin role required.' });
      }

      const clinics = await storage.getClinics();
      res.json(clinics);
    } catch (error) {
      console.error('Error fetching clinics:', error);
      res.status(500).json({ error: 'Failed to fetch clinics' });
    }
  });

  // Admin Users Cross-Tenant
  app.get('/api/admin/users', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ error: 'Access denied. Super admin role required.' });
      }

      const { clinic_id } = req.query;
      
      let users = await storage.getAllUsers();
      
      // Filter by clinic if specified
      if (clinic_id) {
        const clinicIdNum = parseInt(clinic_id as string);
        users = users.filter(user => user.clinic_id === clinicIdNum);
      }

      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Create new clinic (for future growth)
  app.post('/api/admin/clinics', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ error: 'Access denied. Super admin role required.' });
      }

      const { name, email, phone, address } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      const newClinic = await storage.createClinic({
        name,
        email,
        phone: phone || null,
        address: address || null,
        created_at: new Date(),
        updated_at: new Date()
      });

      res.status(201).json(newClinic);
    } catch (error) {
      console.error('Error creating clinic:', error);
      res.status(500).json({ error: 'Failed to create clinic' });
    }
  });
}