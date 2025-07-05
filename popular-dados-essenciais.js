import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lkwrevhxugaxfpwiktdy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrd3Jldmh4dWdheGZwd2lrdGR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTgyODQ2MywiZXhwIjoyMDY1NDA0NDYzfQ.Ty6qHcLKLZNKqsxJmJvhKzqEYLKL8iQqUmZvmqjnXJo';

async function popularDadosEssenciais() {
  console.log('🌱 POPULANDO BANCO COM DADOS ESSENCIAIS');
  console.log('======================================\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 1. Inserir clínica principal
    console.log('🏥 1. Inserindo clínica principal...');
    
    const { data: clinicExists } = await supabase
      .from('clinics')
      .select('id')
      .eq('id', 1)
      .single();

    if (!clinicExists) {
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .insert([
          {
            id: 1,
            name: 'Clínica Principal',
            work_start: '08:00',
            work_end: '18:00',
            lunch_start: '12:00',
            lunch_end: '13:00',
            has_lunch_break: true,
            working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            timezone: 'America/Sao_Paulo',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (clinicError) {
        console.log('❌ Erro ao inserir clínica:', clinicError.message);
      } else {
        console.log('✅ Clínica inserida:', clinic.name);
      }
    } else {
      console.log('✅ Clínica já existe (ID: 1)');
    }

    // 2. Verificar se usuário Supabase existe
    console.log('\n👤 2. Verificando usuário Supabase...');
    
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById('e35fc90d-4509-4eb4-a17a-7df154917f9f');
    
    if (authError) {
      console.log('❌ Usuário Supabase não encontrado:', authError.message);
    } else {
      console.log('✅ Usuário Supabase encontrado:', authUser.user.email);
      
      // 3. Inserir usuário na tabela users
      console.log('\n📝 3. Inserindo usuário na tabela users...');
      
      const { data: userExists } = await supabase
        .from('users')
        .select('id')
        .eq('email', authUser.user.email)
        .single();

      if (!userExists) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .insert([
            {
              id: authUser.user.id,
              name: 'Admin Principal',
              email: authUser.user.email,
              role: 'admin',
              clinic_id: 1,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (userError) {
          console.log('❌ Erro ao inserir usuário:', userError.message);
        } else {
          console.log('✅ Usuário inserido:', user.email);
        }
      } else {
        console.log('✅ Usuário já existe na tabela users');
      }
    }

    // 4. Inserir contatos de teste
    console.log('\n👥 4. Inserindo contatos de teste...');
    
    const contatos = [
      {
        name: 'Maria Silva',
        phone: '11999887766',
        email: 'maria.silva@email.com',
        clinic_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: 'João Santos',
        phone: '11888776655',
        email: 'joao.santos@email.com',
        clinic_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: 'Ana Costa',
        phone: '11777665544',
        email: 'ana.costa@email.com',
        clinic_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    for (const contato of contatos) {
      const { data: contactExists } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', contato.email)
        .single();

      if (!contactExists) {
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .insert([contato])
          .select()
          .single();

        if (contactError) {
          console.log(`❌ Erro ao inserir contato ${contato.name}:`, contactError.message);
        } else {
          console.log(`✅ Contato inserido: ${contact.name}`);
        }
      } else {
        console.log(`✅ Contato já existe: ${contato.name}`);
      }
    }

    // 5. Inserir agendamentos de teste
    console.log('\n📅 5. Inserindo agendamentos de teste...');
    
    // Buscar contatos para usar nos agendamentos
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, name')
      .limit(3);

    if (contacts && contacts.length > 0) {
      const hoje = new Date();
      const agendamentos = [
        {
          contact_id: contacts[0].id,
          user_id: 'e35fc90d-4509-4eb4-a17a-7df154917f9f',
          clinic_id: 1,
          doctor_name: 'Dr. Silva',
          specialty: 'Clínica Geral',
          appointment_type: 'consulta',
          scheduled_date: new Date(hoje.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Amanhã
          duration_minutes: 60,
          status: 'agendada',
          payment_status: 'pendente',
          session_notes: 'Consulta de rotina',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          contact_id: contacts[1].id,
          user_id: 'e35fc90d-4509-4eb4-a17a-7df154917f9f',
          clinic_id: 1,
          doctor_name: 'Dr. Santos',
          specialty: 'Cardiologia',
          appointment_type: 'consulta',
          scheduled_date: new Date(hoje.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Depois de amanhã
          duration_minutes: 45,
          status: 'agendada',
          payment_status: 'pendente',
          session_notes: 'Acompanhamento cardiológico',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          contact_id: contacts[2].id,
          user_id: 'e35fc90d-4509-4eb4-a17a-7df154917f9f',
          clinic_id: 1,
          doctor_name: 'Dr. Costa',
          specialty: 'Dermatologia',
          appointment_type: 'consulta',
          scheduled_date: new Date(hoje.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Em 3 dias
          duration_minutes: 30,
          status: 'agendada',
          payment_status: 'pago',
          session_notes: 'Consulta dermatológica',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      for (const agendamento of agendamentos) {
        const { data: appointment, error: appointmentError } = await supabase
          .from('appointments')
          .insert([agendamento])
          .select()
          .single();

        if (appointmentError) {
          console.log(`❌ Erro ao inserir agendamento:`, appointmentError.message);
        } else {
          console.log(`✅ Agendamento inserido: ${appointment.doctor_name} - ${contacts.find(c => c.id === appointment.contact_id)?.name}`);
        }
      }
    } else {
      console.log('❌ Nenhum contato encontrado para criar agendamentos');
    }

    // 6. Verificar dados inseridos
    console.log('\n📊 6. Verificando dados inseridos...');
    
    const verificacoes = [
      { tabela: 'clinics', nome: 'Clínicas' },
      { tabela: 'users', nome: 'Usuários' },
      { tabela: 'contacts', nome: 'Contatos' },
      { tabela: 'appointments', nome: 'Agendamentos' }
    ];

    for (const verificacao of verificacoes) {
      const { data, error, count } = await supabase
        .from(verificacao.tabela)
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        console.log(`❌ ${verificacao.nome}: ${error.message}`);
      } else {
        console.log(`✅ ${verificacao.nome}: ${count} registros`);
      }
    }

    console.log('\n🎉 DADOS ESSENCIAIS POPULADOS COM SUCESSO!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Testar backend AWS com dados populados');
    console.log('2. Verificar se as rotas de calendário funcionam');
    console.log('3. Testar frontend com dados reais');

  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

// Executar script
popularDadosEssenciais().catch(console.error); 