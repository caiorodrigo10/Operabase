import { useQuery, useMutation } from '@tanstack/react-query';
import { QUERY_KEYS, invalidateAppointmentQueries } from '../lib/queryKeys';
import { apiRequest, queryClient } from '../lib/queryClient';
import { buildApiUrl } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useToast } from './use-toast';
import type { Appointment } from '../../server/domains/appointments/appointments.schema';
import type { Contact } from '../../server/domains/contacts/contacts.schema';

interface AppointmentFormData {
  contact_id: string;
  user_id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration: string;
  type: string;
  notes?: string;
  tag_id?: number;
}

interface PatientFormData {
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  rg?: string;
  birth_date?: string;
  gender?: string;
  profession?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  landline_phone?: string;
  address_complement?: string;
  neighborhood?: string;
  responsible_name?: string;
  responsible_cpf?: string;
  responsible_birth_date?: string;
  insurance_type?: string;
  insurance_holder?: string;
  insurance_number?: string;
  insurance_responsible_cpf?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  reminder_preference?: string;
  how_found_clinic?: string;
}

export function useAppointmentData(clinicId: number = 1) {
  const { toast } = useToast();

  // Fetch appointments
  const {
    data: appointments = [],
    isLoading: appointmentsLoading,
    error: appointmentsError
  } = useQuery({
    queryKey: QUERY_KEYS.APPOINTMENTS(clinicId),
    queryFn: async () => {
      console.log('🚀 [Appointments] Starting fetch process...');
      
      const url = buildApiUrl(`/api/appointments?clinic_id=${clinicId}`);
      console.log('🔗 [Appointments] Built URL:', url);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ [Appointments] Session error:', sessionError);
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Appointments] Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ [Appointments] Data received:', {
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'not array',
        firstItem: Array.isArray(data) && data.length > 0 ? data[0] : 'no items'
      });
      
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch contacts
  const {
    data: contacts = [],
    isLoading: contactsLoading,
    error: contactsError
  } = useQuery({
    queryKey: QUERY_KEYS.CONTACTS(clinicId),
    queryFn: async () => {
      console.log('🚀 [Contacts] Starting fetch process...');
      
      const url = buildApiUrl(`/api/contacts?clinic_id=${clinicId}`);
      
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch clinic users
  const {
    data: clinicUsers = [],
    isLoading: clinicUsersLoading,
    error: clinicUsersError
  } = useQuery({
    queryKey: QUERY_KEYS.CLINIC_USERS(clinicId),
    queryFn: async () => {
      console.log('🚀 [Clinic Users] Starting fetch process...');
      
      const url = buildApiUrl(`/api/clinic/${clinicId}/users/management`);
      
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const selectedContact = contacts.find((contact: Contact) => contact.id.toString() === data.contact_id);
      const patientName = selectedContact?.name || "Paciente";
      
      const appointmentData = {
        contact_id: parseInt(data.contact_id),
        user_id: parseInt(data.user_id),
        clinic_id: clinicId,
        type: data.type,
        scheduled_date: data.scheduled_date,
        scheduled_time: data.scheduled_time,
        duration: parseInt(data.duration),
        status: "agendada",
        payment_status: "pendente",
        notes: data.notes || null,
        tag_id: data.tag_id || null,
        // Legacy fields for compatibility
        doctor_name: patientName,
        specialty: data.type,
        appointment_type: data.type,
        duration_minutes: parseInt(data.duration),
        payment_amount: 0,
        session_notes: data.notes || null
      };
      
      const res = await apiRequest("/api/appointments", "POST", appointmentData);
      return await res.json();
    },
    onSuccess: async () => {
      console.log('🎉 Appointment creation SUCCESS - invalidating cache...');
      await invalidateAppointmentQueries(queryClient, clinicId);
      toast({
        title: "Consulta criada",
        description: "A consulta foi agendada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar consulta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update appointment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: number; status: string }) => {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments', { clinic_id: clinicId }] });
      queryClient.refetchQueries({ queryKey: ['/api/appointments', { clinic_id: clinicId }] });
      toast({
        title: "Status atualizado",
        description: "O status da consulta foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da consulta.",
        variant: "destructive",
      });
    },
  });

  // Create patient mutation
  const createPatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      console.log('🚀 Starting patient creation with data:', data);
      
      const contactData = {
        clinic_id: clinicId,
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        status: 'novo',
        source: 'cadastro',
        gender: data.gender || null,
        profession: data.profession || null,
        address: data.address || null,
        notes: data.notes || null,
        emergency_contact: data.emergency_contact_name && data.emergency_contact_phone 
          ? `${data.emergency_contact_name} - ${data.emergency_contact_phone}` 
          : null,
      };
      
      console.log('📤 Sending contact data to API:', contactData);
      
      const response = await apiRequest("POST", "/api/contacts", contactData);
      const result = await response.json();
      console.log('✅ Patient created successfully:', result);
      
      return result;
    },
    onSuccess: (newPatient: any) => {
      console.log('Patient creation successful', { patientId: newPatient?.id });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Paciente cadastrado",
        description: "O paciente foi cadastrado com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Patient creation failed', { error: error?.message || String(error) });
      toast({
        title: "Erro",
        description: `Não foi possível cadastrar o paciente. ${error?.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
    },
  });

  // Loading states
  const isInitialDataLoading = appointmentsLoading || !clinicUsers.length || contactsLoading;

  return {
    // Data
    appointments,
    contacts,
    clinicUsers,
    
    // Loading states
    appointmentsLoading,
    contactsLoading,
    clinicUsersLoading,
    isInitialDataLoading,
    
    // Errors
    appointmentsError,
    contactsError,
    clinicUsersError,
    
    // Mutations
    createAppointmentMutation,
    updateStatusMutation,
    createPatientMutation,
  };
} 