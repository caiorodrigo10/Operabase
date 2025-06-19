import { db } from './db.js';

export async function initializeAnamnesisSystem() {
  
  try {
    // Create anamnesis_templates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS anamnesis_templates (
        id SERIAL PRIMARY KEY,
        clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        fields JSONB NOT NULL,
        is_default BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create anamnesis_responses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS anamnesis_responses (
        id SERIAL PRIMARY KEY,
        template_id INTEGER REFERENCES anamnesis_templates(id) ON DELETE CASCADE,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
        responses JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        share_token VARCHAR(255) UNIQUE,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_anamnesis_templates_clinic ON anamnesis_templates(clinic_id);
      CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_template ON anamnesis_responses(template_id);
      CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_contact ON anamnesis_responses(contact_id);
      CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_clinic ON anamnesis_responses(clinic_id);
      CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_token ON anamnesis_responses(share_token);
      CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_status ON anamnesis_responses(status);
    `);

    console.log('✅ Anamnesis tables created successfully');
    
    // Always recreate templates to ensure updates
    await client.query('DELETE FROM anamnesis_templates WHERE is_default = true');
    
    const defaultTemplates = [
      {
        name: 'Anamnese Geral',
        description: 'Formulário padrão para coleta de informações gerais do paciente',
        fields: {
          questions: [
            { id: '1', text: 'Queixa principal', type: 'textarea', required: true },
            { id: '2', text: 'Tem pressão alta?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true, hasAdditional: true },
            { id: '3', text: 'Possui alguma alergia? (Como penicilinas, AAS ou outra)', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true, hasAdditional: true },
            { id: '4', text: 'Possui alguma alteração sanguínea?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true, hasAdditional: true },
            { id: '5', text: 'Já teve hemorragia diagnosticada?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true },
            { id: '6', text: 'Possui alguma alteração cardiovascular?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true, hasAdditional: true },
            { id: '7', text: 'Possui diabetes?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true, hasAdditional: true },
            { id: '8', text: 'Possui asma?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true },
            { id: '9', text: 'Possui anemia?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true },
            { id: '10', text: 'Possui alguma disfunção hepática?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true, hasAdditional: true },
            { id: '11', text: 'Apresenta alguma disfunção renal?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true, hasAdditional: true },
            { id: '12', text: 'Possui alguma disfunção respiratória?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true, hasAdditional: true },
            { id: '13', text: 'Possui alguma alteração óssea?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true, hasAdditional: true },
            { id: '14', text: 'Possui alguma doença transmissível?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true, hasAdditional: true },
            { id: '15', text: 'Possui alguma outra doença/síndrome não mencionada?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true, hasAdditional: true },
            { id: '16', text: 'Já sofreu alguma reação alérgica ao receber anestesia?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true, hasAdditional: true },
            { id: '17', text: 'Possui azia, má digestão, refluxo, úlcera ou gastrite?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true },
            { id: '18', text: 'Tem dificuldade de abrir a boca?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true },
            { id: '19', text: 'Possui algum antecedente de febre reumática?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true },
            { id: '20', text: 'Escuta algum estalido ao abrir a boca?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true },
            { id: '21', text: 'Está grávida?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true, hasAdditional: true },
            { id: '22', text: 'Está amamentando?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true },
            { id: '23', text: 'Toma anticoncepcional?', type: 'radio', options: ['Sim', 'Não', 'Não sei'], required: true, hasAdditional: true }
          ]
        }
      },
      {
        name: 'Anamnese Cirúrgica/Implante',
        description: 'Avaliação pré-operatória para procedimentos cirúrgicos e implantes',
        fields: {
          questions: [
            { id: '1', text: 'Procedimento a ser realizado', type: 'text', required: true },
            { id: '2', text: 'Histórico de cirurgias anteriores', type: 'textarea', required: true },
            { id: '3', text: 'Medicamentos em uso', type: 'textarea', required: true },
            { id: '4', text: 'Alergias (medicamentos, látex, outros)', type: 'textarea', required: true },
            { id: '5', text: 'Problemas de coagulação', type: 'radio', options: ['Sim', 'Não'], required: true },
            { id: '6', text: 'Pressão arterial controlada', type: 'radio', options: ['Sim', 'Não'], required: true },
            { id: '7', text: 'Diabetes controlado', type: 'radio', options: ['Sim', 'Não'], required: true },
            { id: '8', text: 'Problemas cardíacos', type: 'radio', options: ['Sim', 'Não'], required: true },
            { id: '9', text: 'Consumo de álcool ou tabaco', type: 'textarea', required: false },
            { id: '10', text: 'Expectativas com o procedimento', type: 'textarea', required: true }
          ]
        }
      },
      {
        name: 'Anamnese Pediátrica',
        description: 'Formulário específico para atendimento infantil',
        fields: {
          questions: [
            { id: '1', text: 'Idade da criança', type: 'text', required: true },
            { id: '2', text: 'Responsável', type: 'text', required: true },
            { id: '3', text: 'Motivo da consulta', type: 'textarea', required: true },
            { id: '4', text: 'Histórico de nascimento', type: 'textarea', required: true },
            { id: '5', text: 'Vacinação em dia', type: 'radio', options: ['Sim', 'Não'], required: true },
            { id: '6', text: 'Alergias conhecidas', type: 'textarea', required: false },
            { id: '7', text: 'Medicamentos em uso', type: 'textarea', required: false },
            { id: '8', text: 'Desenvolvimento motor', type: 'textarea', required: true },
            { id: '9', text: 'Alimentação atual', type: 'textarea', required: true },
            { id: '10', text: 'Sono e comportamento', type: 'textarea', required: true }
          ]
        }
      },
      {
        name: 'Anamnese Ortodôntica',
        description: 'Avaliação específica para tratamento ortodôntico',
        fields: {
          questions: [
            { id: '1', text: 'Queixa principal relacionada aos dentes', type: 'textarea', required: true },
            { id: '2', text: 'Histórico de tratamento ortodôntico anterior', type: 'textarea', required: false },
            { id: '3', text: 'Hábitos (chupar dedo, ranger dentes)', type: 'textarea', required: true },
            { id: '4', text: 'Dor na ATM', type: 'radio', options: ['Sim', 'Não'], required: true },
            { id: '5', text: 'Respiração bucal', type: 'radio', options: ['Sim', 'Não'], required: true },
            { id: '6', text: 'Histórico familiar de problemas ortodônticos', type: 'textarea', required: false },
            { id: '7', text: 'Expectativas com o tratamento', type: 'textarea', required: true },
            { id: '8', text: 'Disponibilidade para consultas regulares', type: 'radio', options: ['Sim', 'Não'], required: true }
          ]
        }
      },
      {
        name: 'Anamnese Psicológica',
        description: 'Formulário para primeira consulta psicológica',
        fields: {
          questions: [
            { id: '1', text: 'Motivo da busca por terapia', type: 'textarea', required: true },
            { id: '2', text: 'Quando os sintomas começaram', type: 'textarea', required: true },
            { id: '3', text: 'Tratamento psicológico anterior', type: 'textarea', required: false },
            { id: '4', text: 'Uso de medicação psiquiátrica', type: 'textarea', required: true },
            { id: '5', text: 'Histórico familiar de transtornos mentais', type: 'textarea', required: false },
            { id: '6', text: 'Relacionamentos interpessoais', type: 'textarea', required: true },
            { id: '7', text: 'Sono e apetite', type: 'textarea', required: true },
            { id: '8', text: 'Situação financeira atual', type: 'textarea', required: false },
            { id: '9', text: 'Expectativas com o tratamento', type: 'textarea', required: true }
          ]
        }
      }
    ];

    for (const template of defaultTemplates) {
      await client.query(
        'INSERT INTO anamnesis_templates (clinic_id, name, description, fields, is_default, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
        [1, template.name, template.description, JSON.stringify(template.fields), true, true]
      );
    }
    
    console.log('✅ Default anamnesis templates created');
    
  } catch (error) {
    console.error('❌ Error initializing anamnesis system:', error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}