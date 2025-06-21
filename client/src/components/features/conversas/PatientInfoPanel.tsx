import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientInfo } from "@/types/conversations";
import { Phone, Mail, Calendar, Clock, User } from "lucide-react";

interface PatientInfoPanelProps {
  patientInfo?: PatientInfo;
}

export function PatientInfoPanel({ patientInfo }: PatientInfoPanelProps) {
  if (!patientInfo) {
    return (
      <div className="w-full h-full bg-gray-50 p-4">
        <div className="animate-pulse">
          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white border-l border-gray-200 p-4 overflow-y-auto">
      {/* Dados Básicos */}
      <div className="text-center mb-6">
        <Avatar className="w-20 h-20 mx-auto mb-4">
          <AvatarImage src={patientInfo.avatar} />
          <AvatarFallback className="text-2xl">
            {patientInfo.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {patientInfo.name}
        </h3>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center justify-center space-x-2">
            <Phone className="w-4 h-4" />
            <span>{patientInfo.phone}</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>{patientInfo.email}</span>
          </div>
        </div>
      </div>

      {/* Última Consulta */}
      {patientInfo.last_appointment && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Última Consulta</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {patientInfo.last_appointment.date} às {patientInfo.last_appointment.time}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>
                  {patientInfo.last_appointment.doctor} - {patientInfo.last_appointment.specialty}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão Agendar */}
      <Button className="w-full mb-4" size="lg">
        <Calendar className="w-4 h-4 mr-2" />
        Agendar Nova Consulta
      </Button>

      {/* Histórico de Consultas */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Consultas Recentes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {patientInfo.recent_appointments.slice(0, 3).map((appointment, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{appointment.date}</span>
                <span className="text-gray-900 font-medium">{appointment.specialty}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Botão Ver Histórico Completo */}
      <Button variant="outline" className="w-full">
        Ver Histórico Completo
      </Button>
    </div>
  );
}