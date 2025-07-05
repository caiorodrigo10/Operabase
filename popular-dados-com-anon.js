import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lkwrevhxugaxfpwiktdy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrd3Jldmh4dWdheGZwd2lrdGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4Mjg0NjMsImV4cCI6MjA2NTQwNDQ2M30.sWOsGKa_PWfjth6iaXcTpyGa95xmGZO_vnBnrFnK-sc';

async function popularDadosComAnon() {
  console.log('🌱 POPULANDO DADOS COM CHAVE ANON');
  console.log('=================================\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Primeiro, fazer login para ter permissões
    console.log('🔐 1. Fazendo login no Supabase...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@teste.com',
      password: 'NovaSeinha123!'
    });
    
    if (authError) {
      console.log('❌ Erro no login:', authError.message);
      return;
    }
    
    console.log('✅ Login realizado com sucesso');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);

    // 2. Verificar se clínica já existe
    console.log('\n🏥 2. Verificando clínica...');
    
    const { data: existingClinic, error: clinicCheckError } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (clinicCheckError && clinicCheckError.code !== 'PGRST116') {
      console.log('❌ Erro ao verificar clínica:', clinicCheckError.message);
    } else if (!existingClinic) {
      // Inserir clínica
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
            timezone: 'America/Sao_Paulo'
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
      console.log('✅ Clínica já existe:', existingClinic.name);
    }

    // 3. Inserir usuário na tabela users
    console.log('\n👤 3. Inserindo usuário...');
    
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.log('❌ Erro ao verificar usuário:', userCheckError.message);
    } else if (!existingUser) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            name: 'Admin Principal',
            email: authData.user.email,
            role: 'admin',
            clinic_id: 1,
            is_active: true
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
      console.log('✅ Usuário já existe:', existingUser.email);
    }

    // 4. Inserir contatos de teste
    console.log('\n👥 4. Inserindo contatos...');
    
    const contatos = [
      {
        name: 'Maria Silva',
        phone: '11999887766',
        email: 'maria.silva@email.com',
        clinic_id: 1
      },
      {
        name: 'João Santos',
        phone: '11888776655',
        email: 'joao.santos@email.com',
        clinic_id: 1
      },
      {
        name: 'Ana Costa',
        phone: '11777665544',
        email: 'ana.costa@email.com',
        clinic_id: 1
      }
    ];

    for (const contato of contatos) {
      const { data: existingContact, error: contactCheckError } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', contato.email)
        .single();

      if (contactCheckError && contactCheckError.code !== 'PGRST116') {
        console.log(`❌ Erro ao verificar contato ${contato.name}:`, contactCheckError.message);
      } else if (!existingContact) {
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

    // 5. Inserir agendamentos
    console.log('\n📅 5. Inserindo agendamentos...');
    
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, name')
      .limit(3);

    if (contacts && contacts.length > 0) {
      const hoje = new Date();
      const agendamentos = [
        {
          contact_id: contacts[0].id,
          user_id: authData.user.id,
          clinic_id: 1,
          doctor_name: 'Dr. Silva',
          specialty: 'Clínica Geral',
          appointment_type: 'consulta',
          scheduled_date: new Date(hoje.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 60,
          status: 'agendada',
          payment_status: 'pendente',
          session_notes: 'Consulta de rotina'
        },
        {
          contact_id: contacts[1].id,
          user_id: authData.user.id,
          clinic_id: 1,
          doctor_name: 'Dr. Santos',
          specialty: 'Cardiologia',
          appointment_type: 'consulta',
          scheduled_date: new Date(hoje.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 45,
          status: 'agendada',
          payment_status: 'pendente',
          session_notes: 'Acompanhamento cardiológico'
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
    }

    // 6. Verificar dados finais
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

    console.log('\n🎉 DADOS POPULADOS COM SUCESSO!');
    console.log('\n📋 Agora você pode:');
    console.log('1. Executar o diagnóstico novamente');
    console.log('2. Testar o backend com dados reais');
    console.log('3. Verificar se o calendário carrega');

  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

popularDadosComAnon().catch(console.error); 