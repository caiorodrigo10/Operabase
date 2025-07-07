import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { AppointmentCard } from './AppointmentCard';
import type { Appointment } from '../../../server/domains/appointments/appointments.schema';
import type { Contact } from '../../../server/domains/contacts/contacts.schema';

interface AppointmentsListProps {
  // Data
  appointments: Appointment[];
  contacts: Contact[];
  clinicUsers: any[];
  
  // Pagination
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  
  // Professional filter
  selectedProfessional: number | null;
  selectedProfessionalName: string | null;
  
  // Actions
  onCreateAppointment: () => void;
  onViewAppointment: (appointment: Appointment) => void;
  onEditAppointment: (appointmentId: number) => void;
  onDeleteAppointment: (appointmentId: number) => void;
}

export function AppointmentsList({
  appointments,
  contacts,
  clinicUsers,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  selectedProfessional,
  selectedProfessionalName,
  onCreateAppointment,
  onViewAppointment,
  onEditAppointment,
  onDeleteAppointment,
}: AppointmentsListProps) {
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

  // Calculate pagination info
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(currentPage * itemsPerPage, appointments.length);

  // Empty state
  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500 mb-4">
            {selectedProfessional 
              ? `Nenhuma consulta encontrada para ${selectedProfessionalName}`
              : 'Nenhuma consulta encontrada'
            }
          </p>
          <Button onClick={onCreateAppointment}>
            Agendar primeira consulta
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Appointments List */}
      <div className="space-y-3">
        {appointments.map((appointment: Appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            patientName={getPatientName(appointment.contact_id)}
            patientPhone={getPatientPhone(appointment.contact_id)}
            professionalName={getProfessionalName(appointment.user_id)}
            onView={onViewAppointment}
            onEdit={onEditAppointment}
            onDelete={onDeleteAppointment}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Mostrando {startIndex + 1} a {endIndex} de {appointments.length} consultas
                {selectedProfessionalName && (
                  <span className="ml-1">
                    para {selectedProfessionalName}
                  </span>
                )}
              </p>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                
                <div className="flex items-center space-x-1">
                  {/* Show page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(pageNumber)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary info */}
      <div className="text-sm text-gray-500 text-center">
        Total de {appointments.length} consulta{appointments.length !== 1 ? 's' : ''} encontrada{appointments.length !== 1 ? 's' : ''}
        {selectedProfessionalName && (
          <span> para Dr(a). {selectedProfessionalName}</span>
        )}
      </div>
    </div>
  );
} 