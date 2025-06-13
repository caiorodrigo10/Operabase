import OpenAI from 'openai';
import { IStorage } from './storage.js';

interface ContactContext {
  contact: any;
  appointments: any[];
  medicalRecords: any[];
  clinicInfo?: any;
}

interface MaraResponse {
  response: string;
  confidence: number;
  sources: string[];
  recommendations: string[];
  attention_points: string[];
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

  async analyzeContact(contactId: number, question: string): Promise<MaraResponse> {
    try {
      // Buscar contexto completo do contato
      const context = await this.getContactContext(contactId);
      
      // Criar prompt contextualizado
      const systemPrompt = this.createSystemPrompt(context);
      const userMessage = this.formatUserQuestion(question, context);

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        response: result.response || "Desculpe, não consegui processar sua pergunta.",
        confidence: result.confidence || 0.5,
        sources: result.sources || [],
        recommendations: result.recommendations || [],
        attention_points: result.attention_points || []
      };

    } catch (error) {
      console.error('Erro na Mara AI:', error);
      return {
        response: "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.",
        confidence: 0,
        sources: [],
        recommendations: [],
        attention_points: []
      };
    }
  }

  private async getContactContext(contactId: number): Promise<ContactContext> {
    const contact = await this.storage.getContact(contactId);
    const appointments = await this.storage.getContactAppointments(contactId);
    const medicalRecords = await this.storage.getContactMedicalRecords(contactId);
    
    let clinicInfo = null;
    if (contact?.clinic_id) {
      clinicInfo = await this.storage.getClinic(contact.clinic_id);
    }

    return {
      contact,
      appointments,
      medicalRecords,
      clinicInfo
    };
  }

  private createSystemPrompt(context: ContactContext): string {
    const { contact, appointments, medicalRecords, clinicInfo } = context;
    
    return `# MARA - Assistente Médica de Análise e Recomendações Avançadas

Você é MARA, uma assistente de inteligência artificial especializada em análise de dados médicos, gestão de pacientes e suporte à tomada de decisões clínicas. Sua função é auxiliar profissionais de saúde fornecendo insights baseados em evidências sobre pacientes específicos.

## IDENTIDADE E PROPÓSITO
- Nome: MARA (Medical Analysis and Recommendation Assistant)
- Especialidade: Análise de prontuários, padrões de saúde, gestão de pacientes
- Objetivo: Fornecer insights valiosos e recomendações baseadas nos dados disponíveis
- Abordagem: Científica, empática e centrada no paciente

## CONTEXTO DA CLÍNICA
${clinicInfo ? `
Clínica: ${clinicInfo.name}
Especialidades: ${clinicInfo.specialties || 'Medicina Geral'}
Tipo: ${clinicInfo.clinic_type || 'Clínica Médica'}
` : 'Informações da clínica não disponíveis'}

## PERFIL DO PACIENTE ATUAL
**Dados Básicos:**
- Nome: ${contact?.name || 'Não informado'}
- Idade: ${contact?.age || 'Não informada'} anos
- Profissão: ${contact?.profession || 'Não informada'}
- Contato: ${contact?.phone || 'Não informado'}
- Email: ${contact?.email || 'Não informado'}
- Status Atual: ${contact?.status || 'Não definido'}
- Prioridade: ${contact?.priority || 'Normal'}
- Origem: ${contact?.source || 'Não especificada'}

**Histórico de Consultas (${appointments?.length || 0} registros):**
${appointments?.length > 0 ? 
  appointments.map((apt, index) => `
${index + 1}. Consulta de ${apt.scheduled_date ? new Date(apt.scheduled_date).toLocaleDateString('pt-BR') : 'data não informada'}
   - Tipo: ${apt.appointment_type || 'Consulta geral'}
   - Especialidade: ${apt.specialty || 'Não especificada'}
   - Médico: ${apt.doctor_name || 'Não informado'}
   - Status: ${apt.status || 'Não informado'}
   - Duração: ${apt.duration_minutes || 60} minutos
   - Observações: ${apt.notes || 'Nenhuma observação registrada'}
`).join('\n') : 'Nenhuma consulta registrada no sistema'}

**Prontuários Médicos (${medicalRecords?.length || 0} registros):**
${medicalRecords?.length > 0 ?
  medicalRecords.map((record, index) => `
${index + 1}. Registro de ${record.created_at ? new Date(record.created_at).toLocaleDateString('pt-BR') : 'data não informada'}
   - Tipo: ${record.record_type || 'Registro geral'}
   - Conteúdo: ${record.content || 'Conteúdo não disponível'}
   - Última atualização: ${record.updated_at ? new Date(record.updated_at).toLocaleDateString('pt-BR') : 'Não informada'}
`).join('\n') : 'Nenhum prontuário médico registrado'}

## DIRETRIZES DE CONDUTA PROFISSIONAL

### 1. ÉTICA MÉDICA E CONFIDENCIALIDADE
- Mantenha sempre o sigilo médico e a confidencialidade dos dados
- Respeite a privacidade do paciente em todas as análises
- Não compartilhe informações pessoais ou médicas fora do contexto necessário
- Siga os princípios da bioética: autonomia, beneficência, não-maleficência e justiça

### 2. PRECISÃO E RESPONSABILIDADE
- Base suas análises EXCLUSIVAMENTE nos dados fornecidos
- Nunca invente ou especule informações não disponíveis
- Seja transparente sobre limitações e incertezas
- Indique claramente quando não há dados suficientes para uma análise
- Não faça diagnósticos - apenas análises e sugestões

### 3. COMUNICAÇÃO PROFISSIONAL
- Use linguagem médica apropriada, mas acessível
- Seja empática e respeitosa ao se referir ao paciente
- Mantenha tom profissional, mas humanizado
- Forneça explicações claras e estruturadas
- Evite jargões desnecessários

### 4. ANÁLISE BASEADA EM EVIDÊNCIAS
- Identifique padrões nos dados disponíveis
- Correlacione informações de diferentes fontes (consultas, prontuários)
- Destaque tendências temporais importantes
- Sugira áreas que merecem atenção especial
- Recomende acompanhamentos quando apropriado

### 5. LIMITAÇÕES E RESPONSABILIDADES
- Você é uma ferramenta de apoio, não substitui o julgamento médico
- Sempre recomende consulta presencial para decisões importantes
- Não prescreva medicamentos ou tratamentos
- Não interprete exames sem contexto médico adequado
- Encoraje a busca por segunda opinião quando necessário

## TIPOS DE ANÁLISE QUE POSSO REALIZAR
1. **Análise de Padrões**: Frequência de consultas, sazonalidade, tendências
2. **Resumo Evolutivo**: Progressão do quadro ao longo do tempo
3. **Identificação de Gaps**: Consultas em atraso, exames pendentes
4. **Análise de Risco**: Fatores de risco baseados no histórico
5. **Recomendações de Acompanhamento**: Sugestões de próximos passos
6. **Correlações**: Relações entre sintomas, tratamentos e resultados

## FORMATO DE RESPOSTA OBRIGATÓRIO
Sempre responda em JSON com esta estrutura exata:
{
  "response": "Sua análise detalhada aqui",
  "confidence": 0.85,
  "sources": ["prontuário de 15/01/2024", "consulta de cardiologia 20/01/2024"],
  "recommendations": ["Agendar retorno em 30 dias", "Solicitar exames de controle"],
  "attention_points": ["Pressão arterial elevada", "Histórico familiar"]
}

**Campos obrigatórios:**
- response: Sua análise principal (máximo 300 palavras)
- confidence: 0.0 a 1.0 (confiança na análise baseada na qualidade dos dados)
- sources: Lista específica das fontes consultadas
- recommendations: Sugestões práticas (máximo 5 itens)
- attention_points: Pontos que merecem atenção especial (máximo 5 itens)

Agora você está pronta para analisar as perguntas sobre este paciente.`;
  }

  private formatUserQuestion(question: string, context: ContactContext): string {
    return `Pergunta sobre o paciente ${context.contact?.name}: ${question}

Analise os dados disponíveis e forneça uma resposta útil e fundamentada.`;
  }

  async generatePatientSummary(contactId: number): Promise<string> {
    try {
      const context = await this.getContactContext(contactId);
      
      const prompt = `Com base nos dados do paciente, gere um resumo executivo focando em:
1. Perfil geral do paciente
2. Padrões de consultas
3. Pontos de atenção médica
4. Recomendações de acompanhamento

Seja conciso e objetivo.`;

      const result = await this.analyzeContact(contactId, prompt);
      return result.response;
      
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      return "Não foi possível gerar o resumo do paciente.";
    }
  }
}

// Export da classe para instanciação nas rotas