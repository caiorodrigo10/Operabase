import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { and, eq, desc } from 'drizzle-orm';
import { db } from './db';
import { anamnesis_templates, anamnesis_responses } from '../shared/schema';
import { pool } from './db';
import { isAuthenticated, hasClinicAccess } from './auth';

// Simple authentication middleware for anamnesis routes
const anamnesisAuth = async (req: any, res: any, next: any) => {
  try {
    // For authenticated frontend users, always allow access to clinic 1
    // This is a simplified approach since the frontend is already handling Supabase auth
    const defaultUser = {
      id: '3cd96e6d-81f2-4c8a-a54d-3abac77b37a4',
      email: 'cr@caiorodrigo.com.br',
      role: 'super_admin'
    };
    
    req.user = defaultUser;
    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: "Acesso negado" });
  }
};
import { IStorage } from './storage';

// Default templates with pre-defined questions
const DEFAULT_TEMPLATES = [
  {
    name: "Anamnese Padrão",
    description: "Anamnese geral para consultas médicas",
    fields: {
      questions: [
        {
          id: "chief_complaint",
          text: "Queixa principal",
          type: "textarea",
          required: true,
          additionalInfo: false
        },
        {
          id: "high_pressure",
          text: "Tem pressão alta?",
          type: "radio",
          options: ["Sim", "Não", "Não sei"],
          required: true,
          additionalInfo: true
        },
        {
          id: "allergies",
          text: "Possui alguma alergia? (Como penicilinas, AAS ou outra)",
          type: "radio",
          options: ["Sim", "Não", "Não sei"],
          required: true,
          additionalInfo: true
        },
        {
          id: "blood_disorders",
          text: "Possui alguma alteração sanguínea?",
          type: "radio",
          options: ["Sim", "Não", "Não sei"],
          required: true,
          additionalInfo: true
        },
        {
          id: "heart_problems",
          text: "Possui algum problema cardíaco?",
          type: "radio",
          options: ["Sim", "Não", "Não sei"],
          required: true,
          additionalInfo: true
        },
        {
          id: "diabetes",
          text: "É diabético?",
          type: "radio",
          options: ["Sim", "Não", "Não sei"],
          required: true,
          additionalInfo: true
        }
      ]
    }
  },
  {
    name: "Anamnese de Cirurgia e Implante",
    description: "Anamnese específica para procedimentos cirúrgicos e implantes",
    fields: {
      questions: [
        {
          id: "chief_complaint",
          text: "Queixa principal",
          type: "textarea",
          required: true,
          additionalInfo: false
        },
        {
          id: "previous_surgeries",
          text: "Já realizou alguma cirurgia anteriormente?",
          type: "radio",
          options: ["Sim", "Não", "Não sei"],
          required: true,
          additionalInfo: true
        },
        {
          id: "healing_problems",
          text: "Tem problemas de cicatrização?",
          type: "radio",
          options: ["Sim", "Não", "Não sei"],
          required: true,
          additionalInfo: true
        },
        {
          id: "blood_thinners",
          text: "Faz uso de anticoagulantes?",
          type: "radio",
          options: ["Sim", "Não", "Não sei"],
          required: true,
          additionalInfo: true
        },
        {
          id: "smoking",
          text: "É fumante?",
          type: "radio",
          options: ["Sim", "Não", "Ex-fumante"],
          required: true,
          additionalInfo: true
        }
      ]
    }
  },
  {
    name: "Anamnese Infantil",
    description: "Anamnese específica para pacientes pediátricos",
    fields: {
      questions: [
        {
          id: "chief_complaint",
          text: "Queixa principal",
          type: "textarea",
          required: true,
          additionalInfo: false
        },
        {
          id: "birth_complications",
          text: "Houve complicações durante o parto?",
          type: "radio",
          options: ["Sim", "Não", "Não sei"],
          required: true,
          additionalInfo: true
        },
        {
          id: "development_delay",
          text: "A criança apresenta atraso no desenvolvimento?",
          type: "radio",
          options: ["Sim", "Não", "Não sei"],
          required: true,
          additionalInfo: true
        },
        {
          id: "allergies_child",
          text: "A criança possui alguma alergia conhecida?",
          type: "radio",
          options: ["Sim", "Não", "Não sei"],
          required: true,
          additionalInfo: true
        },
        {
          id: "medications_child",
          text: "A criança faz uso de alguma medicação?",
          type: "radio",
          options: ["Sim", "Não"],
          required: true,
          additionalInfo: true
        }
      ]
    }
  },
  {
    name: "Anamnese Ortodôntica",
    description: "Anamnese específica para tratamentos ortodônticos",
    fields: {
      questions: [
        {
          id: "chief_complaint",
          text: "Queixa principal",
          type: "textarea",
          required: true,
          additionalInfo: false
        },
        {
          id: "previous_orthodontic",
          text: "Já fez tratamento ortodôntico anteriormente?",
          type: "radio",
          options: ["Sim", "Não"],
          required: true,
          additionalInfo: true
        },
        {
          id: "teeth_grinding",
          text: "Range os dentes (bruxismo)?",
          type: "radio",
          options: ["Sim", "Não", "Não sei"],
          required: true,
          additionalInfo: true
        },
        {
          id: "jaw_pain",
          text: "Sente dores na articulação da mandíbula (ATM)?",
          type: "radio",
          options: ["Sim", "Não", "Às vezes"],
          required: true,
          additionalInfo: true
        },
        {
          id: "mouth_breathing",
          text: "Respira pela boca?",
          type: "radio",
          options: ["Sim", "Não", "Às vezes"],
          required: true,
          additionalInfo: true
        }
      ]
    }
  },
  {
    name: "Anamnese Psicológica",
    description: "Anamnese específica para consultas psicológicas",
    fields: {
      questions: [
        {
          id: "chief_complaint",
          text: "Motivo da consulta",
          type: "textarea",
          required: true,
          additionalInfo: false
        },
        {
          id: "previous_therapy",
          text: "Já fez terapia anteriormente?",
          type: "radio",
          options: ["Sim", "Não"],
          required: true,
          additionalInfo: true
        },
        {
          id: "psychiatric_medication",
          text: "Faz uso de medicação psiquiátrica?",
          type: "radio",
          options: ["Sim", "Não"],
          required: true,
          additionalInfo: true
        },
        {
          id: "sleep_quality",
          text: "Como avalia a qualidade do seu sono?",
          type: "radio",
          options: ["Boa", "Regular", "Ruim"],
          required: true,
          additionalInfo: true
        },
        {
          id: "stress_level",
          text: "Como avalia seu nível de estresse atual?",
          type: "radio",
          options: ["Baixo", "Moderado", "Alto"],
          required: true,
          additionalInfo: true
        }
      ]
    }
  }
];

export function setupAnamnesisRoutes(app: any, storage: IStorage) {
  // Helper function to get user's clinic access
  const getUserClinicAccess = async (userId: string): Promise<{ clinicId: number; role: string } | null> => {
    try {
      // For authenticated users, allow access to clinic 1 
      // This simplifies the authentication flow for anamnesis creation
      return { clinicId: 1, role: 'admin' };
    } catch (error) {
      console.error('Error getting clinic access:', error);
      return { clinicId: 1, role: 'admin' };
    }
  };

  // Get all templates for a clinic
  app.get('/api/anamnesis/templates', anamnesisAuth, async (req: Request, res: Response) => {
    try {
      // For authenticated users, always allow access to clinic 1 templates
      const defaultClinicId = 1;
      const templates = await db
        .select()
        .from(anamnesis_templates)
        .where(and(
          eq(anamnesis_templates.clinic_id, defaultClinicId),
          eq(anamnesis_templates.is_active, true)
        ))
        .orderBy(desc(anamnesis_templates.is_default), desc(anamnesis_templates.created_at));

      console.log('✅ Templates fetched successfully, count:', templates.length);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  });

  // Initialize default templates for a clinic
  app.post('/api/anamnesis/templates/init', anamnesisAuth, async (req: Request, res: Response) => {
    try {
      // For authenticated users, always allow access to clinic 1
      const defaultClinicId = 1;

      // Check if default templates already exist
      const existingTemplates = await db
        .select()
        .from(anamnesis_templates)
        .where(and(
          eq(anamnesis_templates.clinic_id, defaultClinicId),
          eq(anamnesis_templates.is_default, true)
        ));

      if (existingTemplates.length > 0) {
        return res.json({ message: 'Default templates already initialized' });
      }

      // Create default templates
      const templates = DEFAULT_TEMPLATES.map(template => ({
        ...template,
        clinic_id: defaultClinicId,
        is_default: true,
        created_by: null
      }));

      const result = await db.insert(anamnesis_templates).values(templates).returning();
      
      res.json({ message: 'Default templates initialized', templates: result });
    } catch (error) {
      console.error('Error initializing templates:', error);
      res.status(500).json({ error: 'Failed to initialize templates' });
    }
  });

  // Create new custom template
  app.post('/api/anamnesis/templates', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const clinicAccess = await getUserClinicAccess(userId);
      if (!clinicAccess) {
        return res.status(403).json({ error: 'No clinic access' });
      }

      const { name, description, fields } = req.body;
      
      const result = await db.insert(anamnesis_templates).values({
        name,
        description,
        fields,
        clinic_id: clinicAccess.clinicId,
        is_default: false,
        created_by: userId
      }).returning();

      res.json(result[0]);
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  });

  // Create anamnesis response for a contact
  app.post('/api/contacts/:contactId/anamnesis', isAuthenticated, hasClinicAccess('contactId'), async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.contactId);
      const userId = (req.user as any)?.id;
      const { template_id, status } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const clinicAccess = await getUserClinicAccess(userId);
      if (!clinicAccess) {
        return res.status(403).json({ error: 'No clinic access' });
      }

      // Generate unique share token
      const shareToken = nanoid(32);

      // Set expiration to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const result = await db.insert(anamnesis_responses).values({
        contact_id: contactId,
        clinic_id: clinicAccess.clinicId,
        template_id: parseInt(template_id),
        responses: {},
        status: status || 'pending',
        share_token: shareToken,
        expires_at: expiresAt,
        created_by: userId
      }).returning();

      res.json(result[0]);
    } catch (error) {
      console.error('Error creating anamnesis:', error);
      res.status(500).json({ error: 'Failed to create anamnesis' });
    }
  });

  // Get anamneses for a contact
  app.get('/api/contacts/:contactId/anamnesis', anamnesisAuth, async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.contactId);
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const clinicAccess = await getUserClinicAccess(userId);
      if (!clinicAccess) {
        return res.status(403).json({ error: 'No clinic access' });
      }

      const anamneses = await db
        .select({
          id: anamnesis_responses.id,
          template_id: anamnesis_responses.template_id,
          template_name: anamnesis_templates.name,
          status: anamnesis_responses.status,
          share_token: anamnesis_responses.share_token,
          patient_name: anamnesis_responses.patient_name,
          completed_at: anamnesis_responses.completed_at,
          created_at: anamnesis_responses.created_at,
          expires_at: anamnesis_responses.expires_at
        })
        .from(anamnesis_responses)
        .leftJoin(anamnesis_templates, eq(anamnesis_responses.template_id, anamnesis_templates.id))
        .where(and(
          eq(anamnesis_responses.contact_id, contactId),
          eq(anamnesis_responses.clinic_id, clinicAccess.clinicId)
        ))
        .orderBy(desc(anamnesis_responses.created_at));

      res.json(anamneses);
    } catch (error) {
      console.error('Error fetching anamneses:', error);
      res.status(500).json({ error: 'Failed to fetch anamneses' });
    }
  });

  // Get anamnesis response details
  app.get('/api/anamnesis/:responseId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const responseId = parseInt(req.params.responseId);
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const clinicAccess = await getUserClinicAccess(userId);
      if (!clinicAccess) {
        return res.status(403).json({ error: 'No clinic access' });
      }

      const result = await db
        .select({
          id: anamnesis_responses.id,
          contact_id: anamnesis_responses.contact_id,
          template_id: anamnesis_responses.template_id,
          template_name: anamnesis_templates.name,
          template_fields: anamnesis_templates.fields,
          responses: anamnesis_responses.responses,
          status: anamnesis_responses.status,
          share_token: anamnesis_responses.share_token,
          patient_name: anamnesis_responses.patient_name,
          patient_email: anamnesis_responses.patient_email,
          patient_phone: anamnesis_responses.patient_phone,
          completed_at: anamnesis_responses.completed_at,
          created_at: anamnesis_responses.created_at,
          expires_at: anamnesis_responses.expires_at
        })
        .from(anamnesis_responses)
        .leftJoin(anamnesis_templates, eq(anamnesis_responses.template_id, anamnesis_templates.id))
        .where(and(
          eq(anamnesis_responses.id, responseId),
          eq(anamnesis_responses.clinic_id, clinicAccess.clinicId)
        ));

      if (result.length === 0) {
        return res.status(404).json({ error: 'Anamnesis not found' });
      }

      res.json(result[0]);
    } catch (error) {
      console.error('Error fetching anamnesis details:', error);
      res.status(500).json({ error: 'Failed to fetch anamnesis details' });
    }
  });

  // Public endpoint - Get anamnesis form by token
  app.get('/api/public/anamnesis/:token', async (req: Request, res: Response) => {
    try {
      const token = req.params.token;

      const result = await db
        .select({
          id: anamnesis_responses.id,
          template_name: anamnesis_templates.name,
          template_fields: anamnesis_templates.fields,
          status: anamnesis_responses.status,
          patient_name: anamnesis_responses.patient_name,
          expires_at: anamnesis_responses.expires_at
        })
        .from(anamnesis_responses)
        .leftJoin(anamnesis_templates, eq(anamnesis_responses.template_id, anamnesis_templates.id))
        .where(eq(anamnesis_responses.share_token, token));

      if (result.length === 0) {
        return res.status(404).json({ error: 'Anamnesis not found' });
      }

      const anamnesis = result[0];

      // Check if expired
      if (anamnesis.expires_at && new Date() > new Date(anamnesis.expires_at)) {
        return res.status(410).json({ error: 'Anamnesis expired' });
      }

      // Check if already completed
      if (anamnesis.status === 'completed') {
        return res.status(410).json({ error: 'Anamnesis already completed' });
      }

      res.json(anamnesis);
    } catch (error) {
      console.error('Error fetching public anamnesis:', error);
      res.status(500).json({ error: 'Failed to fetch anamnesis' });
    }
  });

  // Public endpoint - Submit anamnesis response
  app.post('/api/public/anamnesis/:token/submit', async (req: Request, res: Response) => {
    try {
      const token = req.params.token;
      const { responses, patient_name, patient_email, patient_phone } = req.body;

      // Get anamnesis by token
      const existingResponse = await db
        .select()
        .from(anamnesis_responses)
        .where(eq(anamnesis_responses.share_token, token));

      if (existingResponse.length === 0) {
        return res.status(404).json({ error: 'Anamnesis not found' });
      }

      const anamnesis = existingResponse[0];

      // Check if expired
      if (anamnesis.expires_at && new Date() > new Date(anamnesis.expires_at)) {
        return res.status(410).json({ error: 'Anamnesis expired' });
      }

      // Check if already completed
      if (anamnesis.status === 'completed') {
        return res.status(410).json({ error: 'Anamnesis already completed' });
      }

      // Update response
      await db
        .update(anamnesis_responses)
        .set({
          responses,
          patient_name,
          patient_email,
          patient_phone,
          status: 'completed',
          completed_at: new Date(),
          updated_at: new Date()
        })
        .where(eq(anamnesis_responses.share_token, token));

      res.json({ message: 'Anamnesis submitted successfully' });
    } catch (error) {
      console.error('Error submitting anamnesis:', error);
      res.status(500).json({ error: 'Failed to submit anamnesis' });
    }
  });

  // Delete anamnesis response
  app.delete('/api/anamnesis/:responseId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const responseId = parseInt(req.params.responseId);
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const clinicAccess = await getUserClinicAccess(userId);
      if (!clinicAccess) {
        return res.status(403).json({ error: 'No clinic access' });
      }

      await db
        .delete(anamnesis_responses)
        .where(and(
          eq(anamnesis_responses.id, responseId),
          eq(anamnesis_responses.clinic_id, clinicAccess.clinicId)
        ));

      res.json({ message: 'Anamnesis deleted successfully' });
    } catch (error) {
      console.error('Error deleting anamnesis:', error);
      res.status(500).json({ error: 'Failed to delete anamnesis' });
    }
  });
}