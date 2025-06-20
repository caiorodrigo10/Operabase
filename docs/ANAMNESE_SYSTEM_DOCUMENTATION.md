# Sistema de Anamneses - Documentação Completa

## 📋 Visão Geral

O sistema de anamneses é uma funcionalidade completa que permite aos profissionais de saúde criar, gerenciar e coletar informações médicas dos pacientes através de formulários estruturados. O sistema opera com base em templates reutilizáveis e respostas seguras via tokens únicos.

## 🏗️ Arquitetura do Sistema

### Componentes Principais

1. **Templates de Anamnese** (`anamnesis_templates`)
2. **Respostas de Anamnese** (`anamnesis_responses`)
3. **Interface de Gerenciamento** (Profissionais)
4. **Interface Pública** (Pacientes)
5. **Sistema de Compartilhamento Seguro**

### Fluxo de Dados

```
Profissional → Cria/Seleciona Template → Envia para Paciente → Paciente Preenche → Dados Salvos → Profissional Visualiza
```

## 🗄️ Estrutura de Banco de Dados

### Tabela: `anamnesis_templates`

```sql
CREATE TABLE anamnesis_templates (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  fields JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Estrutura do campo `fields`:**
```json
{
  "questions": [
    {
      "id": "string",
      "text": "string",
      "type": "text|textarea|radio|checkbox|sim_nao_nao_sei",
      "options": ["string"],
      "required": boolean,
      "additionalInfo": boolean
    }
  ]
}
```

### Tabela: `anamnesis_responses`

```sql
CREATE TABLE anamnesis_responses (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL,
  clinic_id INTEGER NOT NULL,
  template_id INTEGER NOT NULL,
  responses JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  share_token VARCHAR(255) UNIQUE NOT NULL,
  patient_name VARCHAR(255),
  patient_email VARCHAR(255),
  patient_phone VARCHAR(255),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Estrutura do campo `responses`:**
```json
{
  "questionId": "resposta_do_paciente",
  "questionId_additional": "informação_adicional_se_aplicável"
}
```

## 📊 Estados do Sistema

### Status de Anamnese
- `pending` / `solicitado` - Enviado para o paciente, aguardando preenchimento
- `completed` - Preenchido pelo paciente
- `expired` - Token expirado
- `draft` - Rascunho (não usado atualmente)

### Tipos de Pergunta
- `text` - Campo de texto simples
- `textarea` - Campo de texto longo
- `radio` - Seleção única (múltipla escolha)
- `checkbox` - Seleção múltipla
- `sim_nao_nao_sei` - Opções específicas: Sim, Não, Não sei

## 🔧 API Endpoints

### Templates (Gerenciamento)

#### `GET /api/anamneses`
Lista todos os templates da clínica
- **Autenticação:** Obrigatória
- **Retorno:** Array de templates com contagem de perguntas

#### `POST /api/anamneses`
Cria novo template
- **Autenticação:** Obrigatória
- **Body:** `{ name, description, questions, copyFromId? }`
- **Retorno:** Template criado

#### `GET /api/anamneses/:id/editar`
Busca template para edição
- **Autenticação:** Obrigatória
- **Params:** ID do template
- **Retorno:** Template completo com perguntas

#### `PUT /api/anamneses/:id`
Atualiza template existente
- **Autenticação:** Obrigatória
- **Body:** Dados do template
- **Retorno:** Template atualizado

#### `DELETE /api/anamneses/:id`
Remove template
- **Autenticação:** Obrigatória
- **Efeito:** Marca template como inativo

### Perguntas (Gerenciamento de Template)

#### `POST /api/anamneses/:id/perguntas`
Adiciona pergunta ao template
- **Body:** `{ text, type, options?, required, additionalInfo }`

#### `PUT /api/anamneses/:id/perguntas/:perguntaId`
Atualiza pergunta específica
- **Body:** Dados da pergunta

#### `DELETE /api/anamneses/:id/perguntas/:perguntaId`
Remove pergunta do template

#### `POST /api/anamneses/:id/perguntas/reorder`
Reordena perguntas no template
- **Body:** `{ questionIds: [] }`

### Respostas (Operações com Pacientes)

#### `POST /api/contacts/:contactId/anamnesis`
Cria nova anamnese para um contato
- **Autenticação:** Obrigatória
- **Body:** `{ template_id, status? }`
- **Retorno:** Anamnese criada com token

#### `GET /api/contacts/:contactId/anamnesis`
Lista anamneses do contato
- **Autenticação:** Obrigatória
- **Retorno:** Array de anamneses

#### `GET /api/public/anamnesis/:token`
Acessa anamnese via token público
- **Autenticação:** Não obrigatória
- **Params:** Token único
- **Retorno:** Anamnese com template e dados

#### `POST /api/public/anamnesis/:token/submit`
Submete respostas do paciente
- **Body:** `{ responses, patient_name, patient_email?, patient_phone? }`
- **Retorno:** Confirmação de submissão

#### `GET /api/anamnesis/:responseId`
Visualiza respostas específicas
- **Retorno:** Anamnese completa com respostas

#### `PUT /api/anamnesis/:responseId`
Atualiza respostas existentes
- **Body:** Novas respostas

#### `DELETE /api/anamnesis/:responseId`
Remove anamnese
- **Autenticação:** Obrigatória

### Auxiliares

#### `POST /api/anamnesis/templates/init`
Inicializa templates padrão do sistema
- **Efeito:** Cria templates básicos se não existirem

#### `GET /api/public/contact/:contactId/name`
Busca nome do contato para interface pública
- **Retorno:** `{ name }`

## 🎯 Templates Padrão

### 1. Anamnese Geral
```json
{
  "name": "Anamnese Geral",
  "description": "Formulário básico de histórico médico",
  "questions": [
    {
      "id": "queixa_principal",
      "text": "Qual é a sua queixa principal?",
      "type": "textarea",
      "required": true
    },
    {
      "id": "historico_familiar",
      "text": "Há casos de doenças na família?",
      "type": "sim_nao_nao_sei",
      "required": true,
      "additionalInfo": true
    }
  ]
}
```

### 2. Anamnese Cirúrgica/Implante
Focada em procedimentos cirúrgicos com perguntas sobre:
- Histórico de cirurgias
- Medicamentos em uso
- Alergias
- Problemas de coagulação
- Condições médicas pré-existentes

### 3. Anamnese Pediátrica
Específica para atendimento infantil:
- Desenvolvimento motor
- Histórico de vacinação
- Alimentação
- Comportamento
- Histórico familiar

### 4. Anamnese Ortodôntica
Para tratamentos ortodônticos:
- Histórico de tratamentos anteriores
- Hábitos parafuncionais
- Problemas de ATM
- Respiração
- Motivação para tratamento

## 🔐 Sistema de Segurança

### Autenticação
- **Área Profissional:** Requer autenticação completa via Supabase
- **Área Pública:** Acesso via token único sem autenticação

### Autorização
- **Multi-tenant:** Isolamento por clínica
- **Roles:** Super admin, admin, usuário
- **Verificação:** Middleware `hasClinicAccess`

### Tokens de Compartilhamento
- **Geração:** `nanoid()` para tokens únicos
- **Validade:** 30 dias por padrão
- **Único:** Constraint de unicidade na base
- **Expiração:** Campo `expires_at` obrigatório

### Validação de Dados
- **Schemas Zod:** Validação rigorosa de entrada
- **Sanitização:** Limpeza automática de dados
- **Tipos TypeScript:** Tipagem forte

## 🖥️ Interface de Usuário

### Componentes Frontend

#### `AnamnesisManager`
- **Localização:** `/client/src/components/AnamnesisManager.tsx`
- **Função:** Gerencia anamneses de um contato
- **Estados:** Lista, visualização, compartilhamento, exclusão

#### `AnamnesisViewer`
- **Função:** Visualiza respostas formatadas
- **Recursos:** Modal, impressão, exportação

#### `AnamnesisShareDialog`
- **Função:** Gera e compartilha links
- **Recursos:** Cópia de link, QR code, configurações

#### `AnamnesisCreator`
- **Função:** Cria e edita templates
- **Recursos:** Drag & drop, preview, validação

### Rotas Frontend

```typescript
// Gerenciamento (autenticado)
'/contatos/:id/anamnese' // Lista de anamneses
'/contatos/:id/preencher-anamnese' // Seleção de template
'/contatos/:id/anamnese/:responseId/editar' // Edição

// Público (sem autenticação)
'/anamnese/:token' // Interface para paciente
```

### Estados Visuais

```typescript
// Badges de status
'completed' → Verde: "Preenchido pelo paciente"
'pending' → Laranja: "Preenchimento solicitado"
'expired' → Vermelho: "Link expirado"
```

## 🔄 Fluxos de Trabalho

### 1. Criação de Nova Anamnese

```typescript
// Passo 1: Profissional acessa perfil do paciente
navigate('/contatos/{contactId}')

// Passo 2: Clica em "Preencher anamnese"
// Redireciona para seleção de template

// Passo 3: Seleciona template
POST /api/contacts/{contactId}/anamnesis
{
  template_id: number,
  status: 'solicitado'
}

// Passo 4: Sistema gera token e retorna link
// Link: /anamnese/{token}

// Passo 5: Profissional compartilha link com paciente
```

### 2. Preenchimento pelo Paciente

```typescript
// Passo 1: Paciente acessa link
GET /api/public/anamnesis/{token}

// Passo 2: Sistema carrega template e dados
// Verifica validade do token

// Passo 3: Paciente preenche formulário
// Validação em tempo real

// Passo 4: Submissão
POST /api/public/anamnesis/{token}/submit
{
  responses: { questionId: 'resposta' },
  patient_name: 'string',
  patient_email?: 'string',
  patient_phone?: 'string'
}

// Passo 5: Status muda para 'completed'
```

### 3. Visualização pelo Profissional

```typescript
// Passo 1: Acessa lista de anamneses
GET /api/contacts/{contactId}/anamnesis

// Passo 2: Clica em anamnese específica
GET /api/anamnesis/{responseId}

// Passo 3: Visualiza respostas formatadas
// Opções: imprimir, exportar, editar
```

## ⚠️ Cuidados e Limitações

### Segurança
- **Nunca expor tokens:** Logs devem omitir tokens
- **Validar expiração:** Sempre verificar `expires_at`
- **Sanitizar dados:** Prevenir XSS e SQL injection
- **Auditoria:** Log de todas as operações

### Performance
- **Cache templates:** Templates são cachados por clínica
- **Paginação:** Para grandes volumes de anamneses
- **Índices:** Otimização de consultas por clinic_id

### Experiência do Usuário
- **Feedback visual:** Estados de loading e erro
- **Validação:** Mensagens claras de erro
- **Responsividade:** Interface adaptada para mobile
- **Acessibilidade:** Suporte a leitores de tela

### Dados
- **Backup:** Anamneses são dados críticos
- **Retenção:** Definir política de retenção
- **LGPD:** Cumprimento de regulamentações
- **Integridade:** Verificações de consistência

## 🔧 Troubleshooting

### Problemas Comuns

#### Token Expirado
```typescript
// Verificar validade
if (new Date() > new Date(anamnesis.expires_at)) {
  // Gerar novo token ou estender prazo
}
```

#### Template Não Encontrado
```typescript
// Verificar se template existe e está ativo
const template = await db.query(`
  SELECT * FROM anamnesis_templates 
  WHERE id = $1 AND is_active = true
`, [templateId]);
```

#### Respostas Incompletas
```typescript
// Validar campos obrigatórios
const requiredFields = template.fields.questions
  .filter(q => q.required)
  .map(q => q.id);

const missingFields = requiredFields.filter(
  field => !responses[field]
);
```

### Logs Importantes

```typescript
// Criação de anamnese
console.log('Anamnesis created:', { 
  contactId, templateId, token: 'HIDDEN' 
});

// Submissão de respostas
console.log('Anamnesis submitted:', { 
  responseId, completedAt, patientName 
});

// Erros de validação
console.error('Validation error:', { 
  field, error, value: 'SANITIZED' 
});
```

## 📈 Métricas e Monitoramento

### KPIs Recomendados
- Taxa de preenchimento (completed/sent)
- Tempo médio de preenchimento
- Templates mais utilizados
- Tokens expirados
- Erros de validação

### Queries Úteis

```sql
-- Taxa de preenchimento por clínica
SELECT 
  clinic_id,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  ROUND(
    COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2
  ) as completion_rate
FROM anamnesis_responses 
GROUP BY clinic_id;

-- Templates mais utilizados
SELECT 
  t.name,
  COUNT(r.id) as usage_count
FROM anamnesis_templates t
LEFT JOIN anamnesis_responses r ON t.id = r.template_id
GROUP BY t.id, t.name
ORDER BY usage_count DESC;
```

## 🚀 Futuras Melhorias

### Funcionalidades Planejadas
- **Assinatura Digital:** Validação legal de anamneses
- **Anexos:** Upload de arquivos pelo paciente
- **Condicionais:** Perguntas baseadas em respostas anteriores
- **Relatórios:** Dashboard analítico
- **Integração:** Prontuário eletrônico
- **Notificações:** Lembretes automáticos

### Otimizações Técnicas
- **Cache Redis:** Para templates frequentes
- **CDN:** Para assets estáticos
- **Compressão:** Para respostas grandes
- **Indexação:** Para busca textual

---

Esta documentação deve ser atualizada sempre que houver mudanças no sistema. Para dúvidas específicas, consulte o código-fonte ou os testes automatizados.