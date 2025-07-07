import React, { useState, useMemo } from 'react';
import { useCalendarState } from '../hooks/useCalendarState';
import { useAppointmentData } from '../hooks/useAppointmentData';
import { useProfessionalSelection } from '../hooks/useProfessionalSelection';
import { CalendarHeader } from '../components/calendar/CalendarHeader';
import { AppointmentsList } from '../components/calendar/AppointmentsList';
import { Card, CardContent } from '../components/ui/card';
import type { Appointment } from '../../server/domains/appointments/appointments.schema';
import type { Contact } from '../../server/domains/contacts/contacts.schema';

// Status configuration
const getStatusConfig = (status: string) => {
  const configs = {
    agendada: { label: 'Agendada', color: 'bg-blue-100 text-blue-800' },
    confirmada: { label: 'Confirmada', color: 'bg-green-100 text-green-800' },
    em_andamento: { label: 'Em andamento', color: 'bg-yellow-100 text-yellow-800' },
    concluida: { label: 'Concluída', color: 'bg-gray-100 text-gray-800' },
    cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
    faltou: { label: 'Faltou', color: 'bg-orange-100 text-orange-800' },
  };
  return configs[status as keyof typeof configs] || { label: status, color: 'bg-gray-100 text-gray-800' };
};

// Pagination constants
const ITEMS_PER_PAGE = 10;

export default function Consultas() {
  const clinicId = 1; // TODO: Get from context

  // Calendar state management
  const calendarState = useCalendarState();

  // Data fetching and mutations
  const {
    appointments,
    contacts,
    clinicUsers,
    isInitialDataLoading,
    appointmentsLoading,
    createAppointmentMutation,
    updateStatusMutation,
    createPatientMutation,
  } = useAppointmentData(clinicId);

  // Professional selection logic
  const {
    selectedProfessional,
    selectProfessional,
    availableProfessionals,
    selectedProfessionalName,
    validUserIds,
  } = useProfessionalSelection(clinicUsers, appointments, clinicId);

  // Modal states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAppointmentDetailOpen, setIsAppointmentDetailOpen] = useState(false);

  // Filter appointments based on selected professional
  const filteredAppointments = useMemo(() => {
    if (!selectedProfessional) return appointments;
    return appointments.filter((appointment: Appointment) => 
      appointment.user_id === selectedProfessional
    );
  }, [appointments, selectedProfessional]);

  // Paginated appointments for list view
  const paginatedAppointments = useMemo(() => {
    const startIndex = (calendarState.currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAppointments.slice(startIndex, endIndex);
  }, [filteredAppointments, calendarState.currentPage]);

  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);

  // Helper functions
  const getPatientName = (contactId: number) => {
    const contact = contacts.find((c: Contact) => c.id === contactId);
    return contact?.name || 'Paciente não encontrado';
  };

  const getPatientPhone = (contactId: number) => {
    const contact = contacts.find((c: Contact) => c.id === contactId);
    return contact?.phone || '';
  };

  const getProfessionalName = (userId: number) => {
    const professional = clinicUsers.find((u: any) => u.user_id === userId);
    return professional?.name || 'Profissional não encontrado';
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsAppointmentDetailOpen(true);
  };

  const handleEditAppointment = (appointmentId: number) => {
    // TODO: Open edit modal
    console.log('Edit appointment:', appointmentId);
  };

  const handleDeleteAppointment = (appointmentId: number) => {
    // TODO: Implement delete confirmation
    console.log('Delete appointment:', appointmentId);
  };

  const handleStatusUpdate = (appointmentId: number, newStatus: string) => {
    updateStatusMutation.mutate({ appointmentId, status: newStatus });
  };

  // Show loading state while initial data is loading
  if (isInitialDataLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados do calendário...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with navigation and filters */}
      <CalendarHeader
        viewMode={calendarState.viewMode}
        calendarView={calendarState.calendarView}
        currentDate={calendarState.currentDate}
        setViewMode={calendarState.setViewMode}
        setCalendarView={calendarState.setCalendarView}
        navigateCalendar={calendarState.navigateCalendar}
        onCreateAppointment={() => setIsCreateDialogOpen(true)}
        selectedProfessional={selectedProfessional}
        availableProfessionals={availableProfessionals}
        onSelectProfessional={selectProfessional}
        appointmentsCount={filteredAppointments.length}
        isLoading={appointmentsLoading}
      />

      {/* Content based on view mode */}
      {calendarState.viewMode === 'list' ? (
        <AppointmentsList
          appointments={paginatedAppointments}
          contacts={contacts}
          clinicUsers={clinicUsers}
          currentPage={calendarState.currentPage}
          totalPages={totalPages}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={calendarState.setCurrentPage}
          selectedProfessional={selectedProfessional}
          selectedProfessionalName={selectedProfessionalName}
          onCreateAppointment={() => setIsCreateDialogOpen(true)}
          onViewAppointment={handleAppointmentClick}
          onEditAppointment={handleEditAppointment}
          onDeleteAppointment={handleDeleteAppointment}
        />
      ) : (
        /* Calendar View - TODO: Implement CalendarGrid component */
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">
              Visualização de calendário será implementada em breve
            </p>
            <p className="text-sm text-gray-400">
              Use a visualização em lista por enquanto
            </p>
          </CardContent>
        </Card>
      )}

      {/* TODO: Add modals for create/edit appointment */}
      {/* TODO: Add appointment detail modal */}
    </div>
  );
} 