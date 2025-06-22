import OpenAI from 'openai';
import { IStorage } from './storage.js';

interface ContactContext {
  contact: any;
  appointments: any[];
  medicalRecords: any[];
  anamnesisResponses: any[];
  clinicInfo?: any;
}

interface MaraResponse {
  response: string;
}

export class MaraAIService {
  private openai: OpenAI;
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.storage = storage;
  }

  async analyzeContact(contactId: number, question: string, userId?: number): Promise<MaraResponse> {
    try {
      console.log('🤖 Mara AI: Iniciando análise do contato', contactId);
      console.log('📝 Pergunta recebida:', question);
      console.log('👤 User ID:', userId);
      
      // Buscar contexto completo do contato
      console.log('📊 Buscando contexto do contato...');
      const context = await this.getContactContext(contactId);
      console.log('📋 Contexto obtido:', {
        contactName: context.contact?.name,
        appointmentsCount: context.appointments?.length || 0,
        medicalRecordsCount: context.medicalRecords?.length || 0
      });
      
      // Buscar informações do usuário logado
      let currentUser = null;
      if (userId) {
        try {
          currentUser = await this.storage.getUser(userId);
          console.log('👤 Usuário encontrado:', currentUser?.name);
        } catch (error: any) {
          console.log('⚠️ Não foi possível buscar dados do usuário:', error.message);
        }
      }
      
      // Criar prompt simples e conversacional
      const systemPrompt = this.createSimpleSystemPrompt(context, currentUser);
      console.log('📝 Prompt criado, enviando para OpenAI...');

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        temperature: 0.7,
        max_tokens: 400
      });

      const result = response.choices[0].message.content || "Desculpe, não consegui processar sua pergunta.";
      console.log('✅ Resposta gerada com sucesso');
      
      return {
        response: result
      };

    } catch (error: any) {
      console.error('❌ Erro na Mara AI:', error);
      console.error('Stack trace:', error.stack);
      console.error('Error message:', error.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return {
        response: "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente."
      };
    }
  }

  private async getContactContext(contactId: number): Promise<ContactContext> {
    try {
      if (!this.storage) {
        throw new Error('Storage not initialized');
      }

      const contact = await this.storage.getContact(contactId);
      if (!contact) {
        throw new Error(`Contact ${contactId} not found`);
      }

      // Get appointments for this contact by filtering clinic appointments
      const allAppointments = await this.storage.getAppointments(contact.clinic_id, {});
      const appointments = allAppointments.filter(apt => apt.contact_id === contactId);
      
      // Get medical records for this contact
      const medicalRecords = await this.storage.getMedicalRecords(contactId);
      
      // Get anamnesis responses for this contact - simplified for now
      const anamnesisResponses: any[] = [];
      console.log('Info: Anamnesis integration will be added later');
      
      let clinicInfo = null;
      if (contact?.clinic_id) {
        clinicInfo = await this.storage.getClinic(contact.clinic_id);
      }

      return {
        contact,
        appointments,
        medicalRecords,
        anamnesisResponses,
        clinicInfo
      };
    } catch (error) {
      console.error('Error in getContactContext:', error);
      throw error;
    }
  }

  private createSimpleSystemPrompt(context: ContactContext, currentUser?: any): string {
    const { contact, appointments, medicalRecords, anamnesisResponses, clinicInfo } = context;
    
    return `Você é Mara, uma assistente médica conversacional e amigável da ${clinicInfo?.name || 'clínica'}.

PROFISSIONAL CONVERSANDO:
${currentUser ? `Nome: ${currentUser.name}
Email: ${currentUser.email}
Função: ${currentUser.role === 'admin' ? 'Administrador' : 'Profissional'}` : 'Usuário não identificado'}

NOSSA CLÍNICA:
${clinicInfo ? `Nome: ${clinicInfo.name}
${clinicInfo.address ? `Endereço: ${clinicInfo.address}` : ''}
${clinicInfo.phone ? `Telefone: ${clinicInfo.phone}` : ''}
Especialidade: ${clinicInfo.specialty || 'Medicina Geral'}` : 'Informações da clínica não disponíveis'}

DADOS DO PACIENTE:
Nome: ${contact.name}
${contact.phone ? `Telefone: ${contact.phone}` : ''}
${contact.email ? `Email: ${contact.email}` : ''}
Status: ${contact.status}
${contact.notes ? `Observações: ${contact.notes}` : ''}

HISTÓRICO DE CONSULTAS (${appointments.length}):
${appointments.map(apt => `• ${new Date(apt.scheduled_date).toLocaleDateString('pt-BR')} - ${apt.appointment_type} com ${apt.doctor_name}
  Especialidade: ${apt.specialty} | Status: ${apt.status}${apt.session_notes ? `
  Notas: ${apt.session_notes}` : ''}`).join('\n\n')}

PRONTUÁRIOS (${medicalRecords.length}):
${medicalRecords.map(record => `• ${new Date(record.created_at).toLocaleDateString('pt-BR')} - ${record.record_type}${record.chief_complaint ? `
  Queixa: ${record.chief_complaint}` : ''}${record.diagnosis ? `
  Diagnóstico: ${record.diagnosis}` : ''}${record.treatment_plan ? `
  Tratamento: ${record.treatment_plan}` : ''}${record.observations ? `
  Obs: ${record.observations}` : ''}`).join('\n\n')}

INSTRUÇÕES:
- Se dirija ao profissional pelo nome quando apropriado
- Represente nossa clínica de forma profissional
- Responda de forma natural e conversacional
- Use os dados acima para fundamentar suas respostas
- Seja concisa mas informativa (2-4 parágrafos curtos)
- Use quebras de linha entre parágrafos para facilitar leitura
- Não invente informações que não estão nos dados
- Use linguagem médica apropriada mas acessível
- Responda diretamente o que foi perguntado`;
  }

  async generatePatientSummary(contactId: number): Promise<string> {
    try {
      const result = await this.analyzeContact(contactId, 'Faça um resumo geral deste paciente destacando os pontos principais do histórico médico.');
      return result.response;
      
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      return "Não foi possível gerar o resumo do paciente.";
    }
  }
}

// Export da classe para instanciação nas rotas