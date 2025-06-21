import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PatientInfo } from "@/types/conversations";
import { Phone, Mail, Calendar } from "lucide-react";

interface PatientInfoPanelProps {
  patientInfo?: PatientInfo;
}

export function PatientInfoPanel({ patientInfo }: PatientInfoPanelProps) {
  if (!patientInfo) {
    return (
      <div className="w-full h-full bg-white p-5 overflow-y-auto">
        <div className="animate-pulse">
          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-6"></div>
          <div className="h-5 bg-gray-200 rounded mb-3 mx-8"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 mx-12"></div>
          <div className="h-4 bg-gray-200 rounded mb-6 mx-12"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 rounded mt-6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white p-5 overflow-y-auto">
      {/* Foto de Perfil */}
      <div className="text-center mb-6">
        <Avatar className="w-20 h-20 mx-auto mb-4 border-2 border-gray-100">
          <AvatarImage src={patientInfo.avatar} />
          <AvatarFallback className="text-2xl font-semibold bg-blue-500 text-white">
            {patientInfo.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* Dados Básicos */}
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          {patientInfo.name}
        </h3>
        
        <div className="space-y-3 text-base">
          <div className="flex items-center justify-center space-x-3 text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{patientInfo.phone}</span>
          </div>
          <div className="flex items-center justify-center space-x-3 text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{patientInfo.email}</span>
          </div>
        </div>
      </div>

      {/* Última Consulta */}
      {patientInfo.last_appointment && (
        <div className="mb-6">
          <h4 className="text-base font-semibold text-gray-900 mb-3">
            Última Consulta
          </h4>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              {patientInfo.last_appointment.date} - {patientInfo.last_appointment.time}
            </p>
            <p className="text-sm text-gray-700">
              {patientInfo.last_appointment.doctor} - {patientInfo.last_appointment.specialty}
            </p>
          </div>
        </div>
      )}

      {/* Botão Agendar Nova Consulta */}
      <Button 
        className="w-full mb-6 h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
        size="lg"
      >
        <Calendar className="w-4 h-4 mr-2" />
        Agendar Nova Consulta
      </Button>

      {/* Consultas Recentes */}
      <div className="mb-6">
        <h4 className="text-base font-semibold text-gray-900 mb-3">
          Consultas Recentes
        </h4>
        <div className="space-y-1">
          {patientInfo.recent_appointments.slice(0, 3).map((appointment, index) => (
            <div key={index} className="text-sm text-gray-600 py-1">
              • {appointment.date} - {appointment.specialty}
            </div>
          ))}
        </div>
      </div>

      {/* Botão Ver Histórico Completo */}
      <Button 
        variant="outline" 
        className="w-full h-9 text-gray-600 border-gray-300 hover:bg-gray-50"
      >
        Ver Histórico Completo
      </Button>
    </div>
  );
}