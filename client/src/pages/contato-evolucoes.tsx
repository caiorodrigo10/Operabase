import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Edit,
  Info,
  Plus,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ContactLayout } from "@/components/ContactLayout";
import EvolucaoEditor from "@/components/EvolucaoEditor";

interface Appointment {
  id: number;
  contact_id: number;
  clinic_id: number;
  user_id: number;
  doctor_name?: string;
  specialty?: string;
  appointment_type?: string;
  scheduled_date: string;
  duration_minutes: number;
  status: string;
  cancellation_reason?: string;
  session_notes?: string;
  next_appointment_suggested?: string;
  payment_status?: string;
  payment_amount?: number;
  google_calendar_event_id?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'agendada':
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Agendada</Badge>;
    case 'confirmada':
      return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">Confirmada</Badge>;
    case 'realizada':
      return <Badge variant="default" className="bg-[#0f766e] text-white border-[#0f766e]">Realizada</Badge>;
    case 'cancelada':
      return <Badge variant="destructive">Cancelada</Badge>;
    case 'nao_compareceu':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Não compareceu</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function ContatoEvolucoes() {
  const { id } = useParams<{ id: string }>();
  const contactId = parseInt(id || '0');
  const [showEvolucaoEditor, setShowEvolucaoEditor] = useState(false);

  // Fetch appointments
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments', { contact_id: contactId }],
    enabled: !!contactId
  });

  return (
    <ContactLayout currentTab="evolucoes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Evoluções</h1>
            <p className="text-slate-600 mt-1">Histórico completo de consultas e evoluções do paciente</p>
          </div>
          <Button 
            onClick={() => setShowEvolucaoEditor(true)}
            className="bg-[#0f766e] hover:bg-teal-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Evolução
          </Button>
        </div>

        {/* Evolutions List */}
        {appointments.length === 0 ? (
          <Card className="border border-slate-200">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-[#0f766e]" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Nenhuma evolução registrada
                </h3>
                <p className="text-slate-500 mb-6">
                  Este paciente ainda não possui evoluções ou consultas registradas. 
                  Registre a primeira evolução para começar o acompanhamento.
                </p>
                <Button 
                  onClick={() => setShowEvolucaoEditor(true)}
                  className="bg-[#0f766e] hover:bg-teal-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar primeira evolução
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments
              .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
              .map((appointment) => (
              <Card key={appointment.id} className="border border-slate-200 hover:border-slate-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#0f766e] bg-opacity-10 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-[#0f766e]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            Consulta - {format(new Date(appointment.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}
                          </h3>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                          <p>
                            <strong>Data:</strong> {format(new Date(appointment.scheduled_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {format(new Date(appointment.scheduled_date), "HH:mm", { locale: ptBR })}
                          </p>
                          {appointment.doctor_name && (
                            <p><strong>Profissional:</strong> {appointment.doctor_name}</p>
                          )}
                          {appointment.specialty && (
                            <p><strong>Especialidade:</strong> {appointment.specialty}</p>
                          )}
                          {appointment.appointment_type && (
                            <p><strong>Tipo:</strong> {appointment.appointment_type}</p>
                          )}
                          <p><strong>Duração:</strong> {appointment.duration_minutes} minutos</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Info className="w-4 h-4 mr-2" />
                        Detalhes
                      </Button>
                    </div>
                  </div>

                  {/* Session Notes */}
                  {appointment.session_notes && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-slate-900 mb-2">Notas da Sessão</h4>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {appointment.session_notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Additional Notes */}
                  {appointment.notes && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium text-slate-900 mb-2">Observações</h4>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {appointment.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Next Appointment */}
                  {appointment.next_appointment_suggested && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium text-slate-900 mb-2">Próxima Consulta Sugerida</h4>
                      <p className="text-sm text-slate-600">{appointment.next_appointment_suggested}</p>
                    </div>
                  )}

                  {/* Payment Info */}
                  {appointment.payment_status && (
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-slate-900">Status do Pagamento</h4>
                          <p className="text-sm text-slate-600">{appointment.payment_status}</p>
                        </div>
                        {appointment.payment_amount && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-900">
                              R$ {appointment.payment_amount.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cancellation Reason */}
                  {appointment.cancellation_reason && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium text-slate-900 mb-2">Motivo do Cancelamento</h4>
                      <p className="text-sm text-slate-600">{appointment.cancellation_reason}</p>
                    </div>
                  )}

                  {/* Creation Date */}
                  <div className="border-t pt-4 mt-4">
                    <p className="text-xs text-slate-500">
                      Registrado em {format(new Date(appointment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Evolution Editor Modal */}
      {showEvolucaoEditor && (
        <EvolucaoEditor
          contactId={contactId}
          onSuccess={() => setShowEvolucaoEditor(false)}
          onCancel={() => setShowEvolucaoEditor(false)}
        />
      )}
    </ContactLayout>
  );
}