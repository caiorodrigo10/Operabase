import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PatientInfo } from "@/types/conversations";
import { Phone, Mail, Calendar } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

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
    <div className="w-full h-full bg-white p-6 overflow-y-auto">
      {/* Foto de Perfil */}
      <div className="text-center mb-8">
        <Avatar className="w-16 h-16 mx-auto mb-4">
          <AvatarImage src={patientInfo.avatar} />
          <AvatarFallback className="text-lg font-medium bg-gray-200 text-gray-700">
            {patientInfo.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* Dados Básicos */}
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          {patientInfo.name}
        </h3>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center justify-center space-x-2">
            <Phone className="w-3 h-3" />
            <span>{patientInfo.phone}</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Mail className="w-3 h-3" />
            <span>{patientInfo.email}</span>
          </div>
        </div>
      </div>

      {/* Última Consulta */}
      {patientInfo.last_appointment && (
        <div className="mb-8">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Última Consulta
          </h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p>
              {patientInfo.last_appointment.date} - {patientInfo.last_appointment.time}
            </p>
            <p>
              {patientInfo.last_appointment.doctor} - {patientInfo.last_appointment.specialty}
            </p>
          </div>
        </div>
      )}

      {/* Botão Agendar Nova Consulta */}
      <Button 
        className="w-full mb-8 h-10 bg-blue-600 hover:bg-blue-700 text-white font-normal"
      >
        <Calendar className="w-4 h-4 mr-2" />
        Agendar Nova Consulta
      </Button>

      {/* Consultas Recentes */}
      <div className="mb-8">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Consultas Recentes
        </h4>
        <RecentAppointmentsList contactId={patientInfo.id} />
      </div>

      {/* Botão Ver Histórico Completo */}
      <Button 
        variant="ghost" 
        className="w-full h-9 text-gray-500 hover:bg-gray-50 font-normal"
      >
        Ver Histórico Completo
      </Button>
    </div>
  );
}