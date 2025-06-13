import { Request, Response } from 'express';
import { MaraAIService } from './mara-ai-service.js';
import { IStorage } from './storage.js';
import { isAuthenticated } from './auth.js';

export function setupMaraRoutes(app: any, storage: IStorage) {
  const maraService = new MaraAIService(storage);

  // Chat com Mara AI sobre um contato específico
  app.post('/api/contacts/:contactId/mara/chat', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.contactId);
      const { question } = req.body;

      console.log('🤖 Mara AI: Iniciando chat para contato', contactId);
      console.log('📝 Pergunta:', question);
      console.log('👤 Usuário:', req.user?.id);

      if (!question || question.trim().length === 0) {
        return res.status(400).json({ error: 'Pergunta é obrigatória' });
      }

      if (!storage || typeof storage.getContact !== 'function') {
        console.error('❌ Storage não está disponível ou não tem método getContact');
        return res.status(500).json({ error: 'Erro de configuração do servidor' });
      }

      // Verificar se o contato existe e pertence ao usuário
      console.log('🔍 Buscando contato no storage...');
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ error: 'Contato não encontrado' });
      }

      // Verificar permissão do usuário para acessar este contato
      const userClinics = await storage.getUserClinics(req.user.id);
      const hasAccess = userClinics.some(clinic => clinic.id === contact.clinic_id);
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Acesso negado a este contato' });
      }

      console.log(`🤖 Mara AI: Processando pergunta sobre contato ${contactId}`);
      console.log(`📝 Pergunta: ${question}`);

      const result = await maraService.analyzeContact(contactId, question);

      console.log(`✅ Mara AI: Resposta gerada com confiança ${result.confidence}`);

      res.json({
        response: result.response,
        confidence: result.confidence,
        sources: result.sources,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro na rota Mara AI:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Não foi possível processar sua pergunta no momento'
      });
    }
  });

  // Gerar resumo inteligente do paciente
  app.get('/api/contacts/:contactId/mara/summary', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.contactId);

      // Verificar se o contato existe e pertence ao usuário
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ error: 'Contato não encontrado' });
      }

      // Verificar permissão do usuário
      const userClinics = await storage.getUserClinics(req.user.id);
      const hasAccess = userClinics.some(clinic => clinic.id === contact.clinic_id);
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Acesso negado a este contato' });
      }

      console.log(`📊 Mara AI: Gerando resumo do paciente ${contactId}`);

      const summary = await maraService.generatePatientSummary(contactId);

      res.json({
        summary,
        contactId,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Não foi possível gerar o resumo do paciente'
      });
    }
  });

  // Sugestões de perguntas para Mara
  app.get('/api/contacts/:contactId/mara/suggestions', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.contactId);

      // Verificar se o contato existe e permissões
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ error: 'Contato não encontrado' });
      }

      const userClinics = await storage.getUserClinics(req.user.id);
      const hasAccess = userClinics.some(clinic => clinic.id === contact.clinic_id);
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Acesso negado a este contato' });
      }

      // Buscar dados básicos para gerar sugestões inteligentes
      const appointments = await storage.getContactAppointments(contactId);
      const medicalRecords = await storage.getContactMedicalRecords(contactId);

      const suggestions = [];

      // Sugestões baseadas no contexto do paciente
      if (appointments.length > 0) {
        suggestions.push("Qual é o padrão de consultas deste paciente?");
        suggestions.push("Como está a evolução do tratamento?");
        suggestions.push("Quando foi a última consulta?");
      }

      if (medicalRecords.length > 0) {
        suggestions.push("Qual é o histórico médico mais relevante?");
        suggestions.push("Existem pontos de atenção no prontuário?");
        suggestions.push("Quais são as principais observações médicas?");
      }

      if (contact.priority === 'alta' || contact.priority === 'urgente') {
        suggestions.push("Por que este paciente tem prioridade alta?");
        suggestions.push("Quais cuidados especiais são necessários?");
      }

      // Sugestões gerais sempre disponíveis
      suggestions.push("Faça um resumo geral deste paciente");
      suggestions.push("Quais são as próximas recomendações?");
      suggestions.push("Este paciente precisa de acompanhamento especial?");

      res.json({
        suggestions: suggestions.slice(0, 6), // Máximo 6 sugestões
        contactId
      });

    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Não foi possível gerar sugestões'
      });
    }
  });
}