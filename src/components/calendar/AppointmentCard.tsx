import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, Phone, Edit, Trash2, Eye } from 'lucide-react';
import type { Appointment } from '../../../server/domains/appointments/appointments.schema';

interface AppointmentCardProps {
  appointment: Appointment;
  patientName: string;
  patientPhone?: string;
  professionalName: string;
  onView: (appointment: Appointment) => void;
  onEdit: (appointmentId: number) => void;
  onDelete: (appointmentId: number) => void;
}

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

export function AppointmentCard({
  appointment,
  patientName,
  patientPhone,
  professionalName,
  onView,
  onEdit,
  onDelete,
}: AppointmentCardProps) {
  const statusConfig = getStatusConfig(appointment.status);

  const handleCardClick = () => {
    onView(appointment);
  };

  const formatDateTime = (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return 'Data não definida';
    }
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Time */}
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              <span className="text-sm">
                {appointment.scheduled_date 
                  ? formatDateTime(appointment.scheduled_date)
                  : 'Data não definida'
                }
              </span>
            </div>

            {/* Patient info */}
            <div className="flex items-center text-gray-800">
              <User className="w-4 h-4 mr-1" />
              <span className="font-medium">{patientName}</span>
            </div>

            {/* Professional */}
            <div className="text-sm text-gray-600">
              Dr(a). {professionalName}
            </div>

            {/* Phone */}
            {patientPhone && (
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-1" />
                <span className="text-sm">{patientPhone}</span>
              </div>
            )}

            {/* Type/Duration */}
            {appointment.appointment_type && (
              <div className="text-sm text-gray-500">
                {appointment.appointment_type}
                {appointment.duration_minutes && ` (${appointment.duration_minutes}min)`}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Status badge */}
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>

            {/* Action buttons */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(appointment);
                }}
                title="Visualizar"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(appointment.id);
                }}
                title="Editar"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(appointment.id);
                }}
                title="Excluir"
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Notes preview */}
        {appointment.notes && (
          <div className="mt-2 text-sm text-gray-600 truncate">
            <strong>Observações:</strong> {appointment.notes}
          </div>
        )}

        {/* Payment status */}
        {appointment.payment_status && appointment.payment_status !== 'pendente' && (
          <div className="mt-2 text-sm">
            <span className="text-gray-600">Pagamento:</span>
            <Badge 
              variant="outline" 
              className={`ml-2 ${
                appointment.payment_status === 'pago' 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}
            >
              {appointment.payment_status}
            </Badge>
            {appointment.payment_amount && (
              <span className="ml-2 text-sm text-gray-600">
                R$ {(appointment.payment_amount / 100).toFixed(2)}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 