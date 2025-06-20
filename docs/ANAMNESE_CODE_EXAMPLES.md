# Exemplos de Código - Sistema de Anamneses

## 🚀 Funções Prontas para Execução

### Verificar Anamneses de um Paciente

```typescript
async function checkPatientAnamnesis(contactId: number) {
  try {
    const response = await fetch(`/api/contacts/${contactId}/anamnesis`);
    if (!response.ok) throw new Error('Failed to fetch anamnesis');
    
    const anamneses = await response.json();
    
    return {
      total: anamneses.length,
      completed: anamneses.filter(a => a.status === 'completed').length,
      pending: anamneses.filter(a => a.status === 'pending').length,
      expired: anamneses.filter(a => 
        a.status === 'pending' && new Date(a.expires_at) < new Date()
      ).length,
      latest: anamneses[0] || null
    };
  } catch (error) {
    console.error('Error checking anamnesis:', error);
    return null;
  }
}
```

### Criar Anamnese Automaticamente

```typescript
async function createAnamnesisForPatient(contactId: number, specialty: string = 'geral') {
  const templateMap = {
    'geral': 1,
    'cirurgia': 2,
    'pediatria': 3,
    'ortodontia': 4
  };
  
  const templateId = templateMap[specialty] || 1;
  
  try {
    const response = await fetch(`/api/contacts/${contactId}/anamnesis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId,
        status: 'solicitado'
      })
    });
    
    if (!response.ok) throw new Error('Failed to create anamnesis');
    
    const anamnesis = await response.json();
    const publicLink = `${window.location.origin}/anamnese/${anamnesis.share_token}`;
    
    return {
      id: anamnesis.id,
      token: anamnesis.share_token,
      publicLink,
      expiresAt: anamnesis.expires_at,
      success: true
    };
  } catch (error) {
    console.error('Error creating anamnesis:', error);
    return { success: false, error: error.message };
  }
}
```

### Validar Anamnese Antes de Consulta

```typescript
async function validateAnamnesisForAppointment(contactId: number, appointmentDate: string) {
  const anamnesis = await checkPatientAnamnesis(contactId);
  const appointmentTime = new Date(appointmentDate);
  const now = new Date();
  const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (!anamnesis || anamnesis.total === 0) {
    return {
      status: 'MISSING',
      action: 'CREATE_REQUIRED',
      message: 'Paciente não possui anamnese. Criação obrigatória.',
      urgency: hoursUntilAppointment < 24 ? 'HIGH' : 'NORMAL'
    };
  }
  
  if (anamnesis.pending > 0 && hoursUntilAppointment < 2) {
    return {
      status: 'CRITICAL',
      action: 'URGENT_FOLLOWUP',
      message: 'Anamnese pendente com consulta em menos de 2 horas.',
      urgency: 'CRITICAL'
    };
  }
  
  if (anamnesis.completed === 0) {
    return {
      status: 'INCOMPLETE',
      action: 'FOLLOW_UP',
      message: 'Anamnese enviada mas não preenchida pelo paciente.',
      urgency: hoursUntilAppointment < 24 ? 'HIGH' : 'NORMAL'
    };
  }
  
  return {
    status: 'OK',
    action: 'NONE',
    message: 'Anamnese completa.',
    urgency: 'NONE'
  };
}
```

### Monitorar Anamneses Expiradas

```typescript
async function checkExpiredAnamnesis() {
  try {
    const response = await fetch('/api/anamnesis/expired', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      // Se endpoint não existe, usar SQL direto
      const expiredQuery = `
        SELECT ar.id, ar.contact_id, c.name, ar.expires_at, ar.share_token
        FROM anamnesis_responses ar
        JOIN contacts c ON ar.contact_id = c.id
        WHERE ar.status = 'pending' AND ar.expires_at < NOW()
        ORDER BY ar.expires_at DESC
      `;
      
      // Executar via execute_sql_tool se disponível
      return { needsCustomQuery: true, query: expiredQuery };
    }
    
    const expired = await response.json();
    
    return {
      total: expired.length,
      list: expired.map(item => ({
        id: item.id,
        patientName: item.name,
        expiredAt: item.expires_at,
        token: item.share_token
      }))
    };
  } catch (error) {
    console.error('Error checking expired anamnesis:', error);
    return { error: error.message };
  }
}
```

### Renovar Token Expirado

```typescript
async function renewExpiredAnamnesis(anamnesisId: number, extendDays: number = 30) {
  try {
    // Primeiro, buscar dados da anamnese atual
    const currentResponse = await fetch(`/api/anamnesis/${anamnesisId}`);
    const current = await currentResponse.json();
    
    if (current.status === 'completed') {
      return { success: false, message: 'Anamnese já foi preenchida' };
    }
    
    // Gerar novo token
    const newToken = require('nanoid').nanoid();
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + extendDays);
    
    // Atualizar com novo token e data
    const updateResponse = await fetch(`/api/anamnesis/${anamnesisId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        share_token: newToken,
        expires_at: newExpiryDate.toISOString(),
        status: 'pending'
      })
    });
    
    if (!updateResponse.ok) throw new Error('Failed to renew anamnesis');
    
    const newPublicLink = `${window.location.origin}/anamnese/${newToken}`;
    
    return {
      success: true,
      newToken,
      newLink: newPublicLink,
      expiresAt: newExpiryDate,
      message: 'Token renovado com sucesso'
    };
  } catch (error) {
    console.error('Error renewing anamnesis:', error);
    return { success: false, error: error.message };
  }
}
```

### Analisar Respostas de Anamnese

```typescript
async function analyzeAnamnesisResponses(anamnesisId: number) {
  try {
    const response = await fetch(`/api/anamnesis/${anamnesisId}`);
    if (!response.ok) throw new Error('Anamnesis not found');
    
    const anamnesis = await response.json();
    
    if (anamnesis.status !== 'completed') {
      return { error: 'Anamnesis not completed yet' };
    }
    
    const responses = anamnesis.responses;
    const analysis = {
      completionDate: anamnesis.completed_at,
      patientInfo: {
        name: anamnesis.patient_name,
        email: anamnesis.patient_email,
        phone: anamnesis.patient_phone
      },
      keyFindings: [],
      riskFactors: [],
      followUpNeeded: false
    };
    
    // Analisar respostas específicas
    Object.keys(responses).forEach(questionId => {
      const answer = responses[questionId];
      
      // Identificar fatores de risco
      if (questionId.includes('alergia') && answer && answer.toLowerCase() !== 'não') {
        analysis.riskFactors.push(`Alergia: ${answer}`);
      }
      
      if (questionId.includes('medicamento') && answer && answer.trim()) {
        analysis.keyFindings.push(`Medicamentos em uso: ${answer}`);
      }
      
      if (questionId.includes('cirurgia') && answer && answer.toLowerCase().includes('sim')) {
        analysis.keyFindings.push(`Histórico cirúrgico: ${answer}`);
      }
      
      if ((questionId.includes('dor') || questionId.includes('queixa')) && answer) {
        analysis.keyFindings.push(`Queixa principal: ${answer}`);
      }
    });
    
    // Determinar se precisa de follow-up
    analysis.followUpNeeded = analysis.riskFactors.length > 0 || 
                             analysis.keyFindings.some(f => 
                               f.includes('dor') || f.includes('sangramento')
                             );
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing anamnesis:', error);
    return { error: error.message };
  }
}
```

### Relatório de Performance de Anamneses

```typescript
async function generateAnamnesisReport(clinicId: number = 1, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  try {
    // Buscar dados via SQL (usar execute_sql_tool)
    const reportQuery = `
      SELECT 
        COUNT(*) as total_sent,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' AND expires_at > NOW() THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'pending' AND expires_at <= NOW() THEN 1 END) as expired,
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) as avg_completion_hours,
        at.name as template_name,
        COUNT(*) as template_usage
      FROM anamnesis_responses ar
      LEFT JOIN anamnesis_templates at ON ar.template_id = at.id
      WHERE ar.clinic_id = ${clinicId} 
        AND ar.created_at >= '${startDate.toISOString()}'
      GROUP BY at.name
      ORDER BY template_usage DESC;
    `;
    
    return {
      query: reportQuery,
      period: `${days} dias`,
      needsExecution: true
    };
  } catch (error) {
    console.error('Error generating report:', error);
    return { error: error.message };
  }
}
```

### Automatizar Envio de Anamnese Pré-Consulta

```typescript
async function autoSendAnamnesisForUpcomingAppointments() {
  try {
    // Buscar consultas dos próximos 7 dias
    const appointmentsResponse = await fetch('/api/appointments?upcoming=7');
    const appointments = await appointmentsResponse.json();
    
    const results = [];
    
    for (const appointment of appointments) {
      // Verificar se paciente tem anamnese recente
      const anamnesisCheck = await checkPatientAnamnesis(appointment.contact_id);
      
      if (!anamnesisCheck || anamnesisCheck.completed === 0) {
        // Determinar tipo de anamnese baseado na consulta
        let specialty = 'geral';
        
        if (appointment.appointment_type?.includes('cirurg')) {
          specialty = 'cirurgia';
        } else if (appointment.specialty?.includes('ortodon')) {
          specialty = 'ortodontia';
        }
        
        // Criar anamnese
        const created = await createAnamnesisForPatient(
          appointment.contact_id, 
          specialty
        );
        
        if (created.success) {
          results.push({
            contactId: appointment.contact_id,
            appointmentDate: appointment.scheduled_date,
            anamnesisId: created.id,
            publicLink: created.publicLink,
            status: 'SENT'
          });
        } else {
          results.push({
            contactId: appointment.contact_id,
            status: 'FAILED',
            error: created.error
          });
        }
      } else {
        results.push({
          contactId: appointment.contact_id,
          status: 'ALREADY_EXISTS'
        });
      }
    }
    
    return {
      processed: appointments.length,
      sent: results.filter(r => r.status === 'SENT').length,
      failed: results.filter(r => r.status === 'FAILED').length,
      skipped: results.filter(r => r.status === 'ALREADY_EXISTS').length,
      details: results
    };
  } catch (error) {
    console.error('Error auto-sending anamnesis:', error);
    return { error: error.message };
  }
}
```

### Utilidade para Debug

```typescript
async function debugAnamnesisSystem() {
  const debug = {
    templates: await fetch('/api/anamnesis/templates').then(r => r.json()),
    recentResponses: await fetch('/api/anamnesis/recent?limit=10').then(r => r.json().catch(() => [])),
    systemStatus: 'CHECKING'
  };
  
  // Verificar integridade dos templates
  debug.templateIntegrity = debug.templates.every(t => 
    t.fields && t.fields.questions && Array.isArray(t.fields.questions)
  );
  
  // Verificar tokens válidos
  const now = new Date();
  debug.validTokens = debug.recentResponses.filter(r => 
    r.status === 'pending' && new Date(r.expires_at) > now
  ).length;
  
  debug.systemStatus = debug.templateIntegrity ? 'HEALTHY' : 'NEEDS_ATTENTION';
  
  return debug;
}
```

## 📋 Comandos SQL Diretos

### Buscar Pacientes Sem Anamnese

```sql
SELECT 
  c.id,
  c.name,
  c.phone,
  c.email,
  COUNT(ar.id) as anamnesis_count,
  MAX(a.scheduled_date) as next_appointment
FROM contacts c
LEFT JOIN anamnesis_responses ar ON c.id = ar.contact_id
LEFT JOIN appointments a ON c.id = a.contact_id 
  AND a.scheduled_date > NOW()
  AND a.status = 'agendada'
WHERE c.clinic_id = 1
GROUP BY c.id, c.name, c.phone, c.email
HAVING COUNT(ar.id) = 0 
  AND MAX(a.scheduled_date) IS NOT NULL
ORDER BY MAX(a.scheduled_date) ASC;
```

### Limpeza de Anamneses Expiradas

```sql
UPDATE anamnesis_responses 
SET status = 'expired' 
WHERE status = 'pending' 
  AND expires_at < NOW() - INTERVAL '7 days';
```

### Estatísticas de Uso por Template

```sql
SELECT 
  at.name as template_name,
  COUNT(ar.id) as total_uses,
  COUNT(CASE WHEN ar.status = 'completed' THEN 1 END) as completed,
  ROUND(
    COUNT(CASE WHEN ar.status = 'completed' THEN 1 END) * 100.0 / COUNT(ar.id), 
    2
  ) as completion_rate,
  AVG(EXTRACT(EPOCH FROM (ar.completed_at - ar.created_at))/3600) as avg_hours_to_complete
FROM anamnesis_templates at
LEFT JOIN anamnesis_responses ar ON at.id = ar.template_id
WHERE at.clinic_id = 1 AND at.is_active = true
GROUP BY at.id, at.name
ORDER BY total_uses DESC;
```

Estes exemplos de código podem ser executados diretamente por um agente de IA para automatizar o gerenciamento de anamneses no sistema.