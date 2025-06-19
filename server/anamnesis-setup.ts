import { pool } from './db';

export async function initializeAnamnesisSystem() {
  const client = await pool.connect();
  
  try {
    // Create anamnesis_templates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS anamnesis_templates (
        id SERIAL PRIMARY KEY,
        clinic_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        fields JSONB NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_by UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_anamnesis_templates_clinic ON anamnesis_templates(clinic_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_anamnesis_templates_default ON anamnesis_templates(is_default);
    `);

    // Create anamnesis_responses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS anamnesis_responses (
        id SERIAL PRIMARY KEY,
        contact_id INTEGER NOT NULL,
        clinic_id INTEGER NOT NULL,
        template_id INTEGER NOT NULL,
        responses JSONB NOT NULL,
        status TEXT DEFAULT 'pending',
        share_token TEXT NOT NULL UNIQUE,
        patient_name TEXT,
        patient_email TEXT,
        patient_phone TEXT,
        completed_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_by UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_contact ON anamnesis_responses(contact_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_clinic ON anamnesis_responses(clinic_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_token ON anamnesis_responses(share_token);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_status ON anamnesis_responses(status);
    `);

    console.log('✅ Anamnesis tables created successfully');
    
    // Insert default templates if they don't exist
    const existingTemplates = await client.query('SELECT COUNT(*) FROM anamnesis_templates WHERE is_default = true');
    
    if (parseInt(existingTemplates.rows[0].count) === 0) {
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
              { id: '1', text: 'Nome completo', type: 'text', required: true },
              { id: '2', text: 'Data de nascimento', type: 'date', required: true },
              { id: '3', text: 'Telefone', type: 'phone', required: true },
              { id: '4', text: 'Procedimento a ser realizado', type: 'text', required: true },
              { id: '5', text: 'Histórico de cirurgias anteriores', type: 'textarea', required: true },
              { id: '6', text: 'Medicamentos em uso', type: 'textarea', required: true },
              { id: '7', text: 'Alergias (medicamentos, látex, outros)', type: 'textarea', required: true },
              { id: '8', text: 'Problemas de coagulação', type: 'radio', options: ['Sim', 'Não'], required: true },
              { id: '9', text: 'Uso de anticoagulantes', type: 'radio', options: ['Sim', 'Não'], required: true },
              { id: '10', text: 'Histórico cardíaco', type: 'textarea', required: false },
              { id: '11', text: 'Diabetes ou outras doenças crônicas', type: 'textarea', required: true },
              { id: '12', text: 'Hábitos (fumo, álcool)', type: 'textarea', required: true },
              { id: '13', text: 'Experiências anteriores com anestesia', type: 'textarea', required: false }
            ]
          }
        },
        {
          name: 'Anamnese Pediátrica',
          description: 'Coleta de informações específicas para pacientes pediátricos',
          fields: {
            questions: [
              { id: '1', text: 'Nome da criança', type: 'text', required: true },
              { id: '2', text: 'Data de nascimento', type: 'date', required: true },
              { id: '3', text: 'Nome do responsável', type: 'text', required: true },
              { id: '4', text: 'Parentesco', type: 'select', options: ['Mãe', 'Pai', 'Avó', 'Avô', 'Outro'], required: true },
              { id: '5', text: 'Telefone do responsável', type: 'phone', required: true },
              { id: '6', text: 'Histórico da gestação', type: 'textarea', required: true },
              { id: '7', text: 'Tipo de parto', type: 'radio', options: ['Normal', 'Cesariana'], required: true },
              { id: '8', text: 'Peso ao nascer', type: 'text', required: false },
              { id: '9', text: 'Desenvolvimento neuromotor', type: 'textarea', required: true },
              { id: '10', text: 'Vacinação em dia', type: 'radio', options: ['Sim', 'Não'], required: true },
              { id: '11', text: 'Alimentação atual', type: 'textarea', required: true },
              { id: '12', text: 'Alergias alimentares ou medicamentosas', type: 'textarea', required: true },
              { id: '13', text: 'Histórico escolar', type: 'textarea', required: false },
              { id: '14', text: 'Queixa principal', type: 'textarea', required: true }
            ]
          }
        },
        {
          name: 'Anamnese Ortodôntica',
          description: 'Avaliação específica para tratamento ortodôntico',
          fields: {
            questions: [
              { id: '1', text: 'Nome completo', type: 'text', required: true },
              { id: '2', text: 'Data de nascimento', type: 'date', required: true },
              { id: '3', text: 'Telefone', type: 'phone', required: true },
              { id: '4', text: 'Motivo da consulta', type: 'textarea', required: true },
              { id: '5', text: 'Histórico de tratamento ortodôntico anterior', type: 'textarea', required: true },
              { id: '6', text: 'Hábitos parafuncionais (ranger/apertar dentes)', type: 'radio', options: ['Sim', 'Não'], required: true },
              { id: '7', text: 'Sucção digital ou chupeta', type: 'textarea', required: false },
              { id: '8', text: 'Respiração (nasal/bucal)', type: 'radio', options: ['Nasal', 'Bucal', 'Mista'], required: true },
              { id: '9', text: 'Problemas de ATM', type: 'radio', options: ['Sim', 'Não'], required: true },
              { id: '10', text: 'Dores de cabeça frequentes', type: 'radio', options: ['Sim', 'Não'], required: true },
              { id: '11', text: 'Histórico de trauma facial', type: 'textarea', required: false },
              { id: '12', text: 'Expectativas do tratamento', type: 'textarea', required: true }
            ]
          }
        },
        {
          name: 'Anamnese Psicológica',
          description: 'Avaliação inicial para acompanhamento psicológico',
          fields: {
            questions: [
              { id: '1', text: 'Nome completo', type: 'text', required: true },
              { id: '2', text: 'Data de nascimento', type: 'date', required: true },
              { id: '3', text: 'Telefone', type: 'phone', required: true },
              { id: '4', text: 'Profissão', type: 'text', required: true },
              { id: '5', text: 'Estado civil', type: 'select', options: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'], required: true },
              { id: '6', text: 'Escolaridade', type: 'select', options: ['Fundamental', 'Médio', 'Superior', 'Pós-graduação'], required: true },
              { id: '7', text: 'Motivo da busca por terapia', type: 'textarea', required: true },
              { id: '8', text: 'Quando os sintomas começaram', type: 'textarea', required: true },
              { id: '9', text: 'Tratamento psicológico anterior', type: 'textarea', required: false },
              { id: '10', text: 'Uso de medicação psiquiátrica', type: 'textarea', required: true },
              { id: '11', text: 'Histórico familiar de transtornos mentais', type: 'textarea', required: false },
              { id: '12', text: 'Relacionamentos interpessoais', type: 'textarea', required: true },
              { id: '13', text: 'Sono e apetite', type: 'textarea', required: true },
              { id: '14', text: 'Situação financeira atual', type: 'textarea', required: false },
              { id: '15', text: 'Expectativas com o treatment', type: 'textarea', required: true }
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
    }
    
  } catch (error) {
    console.error('❌ Error initializing anamnesis system:', error);
    throw error;
  } finally {
    client.release();
  }
}