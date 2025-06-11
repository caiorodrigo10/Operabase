import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, List, Clock, User, Stethoscope, CalendarDays, ChevronLeft, ChevronRight, Phone, MessageCircle, MapPin } from "lucide-react";
import { mockAppointments, mockContacts } from "@/lib/mock-data";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Appointment } from "@/../../shared/schema";

const statusLabels = {
  agendado: { label: "Agendado", color: "bg-green-100 text-green-800" },
  realizado: { label: "Realizado", color: "bg-blue-100 text-blue-800" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

export function Consultas() {
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const getPatientName = (contactId: number | null) => {
    if (!contactId) return "Paciente não identificado";
    const contact = mockContacts.find(c => c.id === contactId);
    return contact ? contact.name : "Paciente não encontrado";
  };

  const getPatientInfo = (contactId: number | null) => {
    if (!contactId) return null;
    return mockContacts.find(c => c.id === contactId);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  const getAppointmentsForDate = (date: Date) => {
    return mockAppointments.filter(appointment => 
      isSameDay(new Date(appointment.scheduled_date!), date)
    );
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-96 bg-slate-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Consultas</h1>
        <p className="text-slate-600">Gerencie e visualize todas as sessões agendadas</p>
      </div>

      {/* View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            className="flex items-center gap-2"
          >
            <List className="w-4 h-4" />
            Lista
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            onClick={() => setViewMode("calendar")}
            className="flex items-center gap-2"
          >
            <CalendarDays className="w-4 h-4" />
            Calendário
          </Button>
        </div>

        {viewMode === "calendar" && (
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold text-slate-800">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {viewMode === "list" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Próximas Consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAppointments
                .sort((a, b) => new Date(a.scheduled_date!).getTime() - new Date(b.scheduled_date!).getTime())
                .map((appointment) => {
                  const patientName = getPatientName(appointment.contact_id);
                  const status = statusLabels[appointment.status as keyof typeof statusLabels];
                  const appointmentDate = new Date(appointment.scheduled_date!);
                  const isToday = isSameDay(appointmentDate, new Date());
                  const isPast = appointmentDate < new Date();

                  return (
                    <div
                      key={appointment.id}
                      className={`p-4 rounded-lg border transition-colors hover:bg-slate-50 ${
                        isToday ? "border-medical-blue bg-blue-50" : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 bg-medical-blue rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {patientName.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-800">{patientName}</h3>
                              <p className="text-sm text-slate-600">{appointment.specialty}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-slate-600 ml-13">
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>{appointment.doctor_name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{format(appointmentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {isToday && (
                            <Badge variant="outline" className="text-medical-blue border-medical-blue">
                              Hoje
                            </Badge>
                          )}
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Calendário de Consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div key={day} className="p-2 text-center font-medium text-slate-600 text-sm">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dayAppointments = getAppointmentsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-24 p-1 border border-slate-200 ${
                      !isCurrentMonth ? "bg-slate-50 text-slate-400" : "bg-white"
                    } ${isToday ? "border-medical-blue bg-blue-50" : ""}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? "text-medical-blue" : ""}`}>
                      {format(day, "d")}
                    </div>
                    
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((appointment) => {
                        const patientName = getPatientName(appointment.contact_id);
                        const time = format(new Date(appointment.scheduled_date!), "HH:mm");
                        
                        return (
                          <div
                            key={appointment.id}
                            className="text-xs p-1 bg-medical-blue text-white rounded truncate cursor-pointer hover:bg-blue-700 transition-colors"
                            title={`${time} - ${patientName} - ${appointment.specialty}`}
                            onClick={() => handleAppointmentClick(appointment)}
                          >
                            {time} {patientName.split(' ')[0]}
                          </div>
                        );
                      })}
                      
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-slate-500 font-medium">
                          +{dayAppointments.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-medical-blue" />
              Detalhes da Consulta
            </DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-6">
              {/* Patient Information */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Informações do Paciente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Nome</p>
                    <p className="font-medium">{getPatientName(selectedAppointment.contact_id)}</p>
                  </div>
                  {getPatientInfo(selectedAppointment.contact_id) && (
                    <>
                      <div>
                        <p className="text-sm text-slate-600">Telefone</p>
                        <p className="font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {getPatientInfo(selectedAppointment.contact_id)?.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">WhatsApp</p>
                        <p className="font-medium flex items-center gap-1">
                          <MessageCircle className="w-3 h-3 text-green-600" />
                          {getPatientInfo(selectedAppointment.contact_id)?.whatsapp_number}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Localização</p>
                        <p className="font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {getPatientInfo(selectedAppointment.contact_id)?.location || 'Não informado'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Appointment Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Informações da Consulta
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Data e Hora</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(selectedAppointment.scheduled_date!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Especialidade</p>
                    <p className="font-medium">{selectedAppointment.specialty}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Profissional</p>
                    <p className="font-medium flex items-center gap-1">
                      <Stethoscope className="w-3 h-3" />
                      {selectedAppointment.doctor_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Status</p>
                    <Badge className={statusLabels[selectedAppointment.status as keyof typeof statusLabels].color}>
                      {statusLabels[selectedAppointment.status as keyof typeof statusLabels].label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedAppointment.notes && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-slate-800 mb-3">Observações</h3>
                  <p className="text-slate-700">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Fechar
                </Button>
                <Button className="bg-medical-blue hover:bg-blue-700">
                  Editar Consulta
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}