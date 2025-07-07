import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar, List, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CalendarView, ViewMode } from '../../hooks/useCalendarState';

interface CalendarHeaderProps {
  // View state
  viewMode: ViewMode;
  calendarView: CalendarView;
  currentDate: Date;
  
  // Actions
  setViewMode: (mode: ViewMode) => void;
  setCalendarView: (view: CalendarView) => void;
  navigateCalendar: (direction: 'prev' | 'next') => void;
  onCreateAppointment: () => void;
  
  // Professional selection
  selectedProfessional: number | null;
  availableProfessionals: Array<{
    user_id: number;
    name: string;
    is_professional: boolean;
    is_active: boolean;
  }>;
  onSelectProfessional: (professionalId: number) => void;
  
  // Data stats
  appointmentsCount?: number;
  isLoading?: boolean;
}

export function CalendarHeader({
  viewMode,
  calendarView,
  currentDate,
  setViewMode,
  setCalendarView,
  navigateCalendar,
  onCreateAppointment,
  selectedProfessional,
  availableProfessionals,
  onSelectProfessional,
  appointmentsCount = 0,
  isLoading = false,
}: CalendarHeaderProps) {
  const getDateRangeText = () => {
    switch (calendarView) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: ptBR });
      case 'week':
        return `Semana de ${format(currentDate, 'dd/MM/yyyy', { locale: ptBR })}`;
      case 'day':
        return format(currentDate, 'dd/MM/yyyy - EEEE', { locale: ptBR });
      default:
        return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    }
  };

  const selectedProfessionalName = selectedProfessional 
    ? availableProfessionals.find(p => p.user_id === selectedProfessional)?.name || 'Profissional'
    : 'Todos os profissionais';

  return (
    <div className="space-y-4">
      {/* Top row: Title and Create button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Consultas</h1>
          {appointmentsCount > 0 && (
            <Badge variant="secondary" className="text-sm">
              {appointmentsCount} consulta{appointmentsCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {isLoading && (
            <Badge variant="outline" className="text-sm animate-pulse">
              Carregando...
            </Badge>
          )}
        </div>
        
        <Button 
          onClick={onCreateAppointment}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Consulta
        </Button>
      </div>

      {/* Second row: View mode tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Lista
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Third row: Calendar navigation and view controls */}
      {viewMode === 'calendar' && (
        <div className="flex items-center justify-between">
          {/* Calendar navigation */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateCalendar('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="min-w-[200px] text-center">
                <span className="font-medium text-gray-900">
                  {getDateRangeText()}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateCalendar('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Calendar view selector */}
            <Tabs value={calendarView} onValueChange={(value) => setCalendarView(value as CalendarView)}>
              <TabsList className="grid w-fit grid-cols-3">
                <TabsTrigger value="day" className="text-xs">Dia</TabsTrigger>
                <TabsTrigger value="week" className="text-xs">Semana</TabsTrigger>
                <TabsTrigger value="month" className="text-xs">Mês</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Professional filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Profissional:</span>
            <div className="flex gap-1">
              {/* "Todos" button */}
              <Button
                variant={selectedProfessional === null ? "default" : "outline"}
                size="sm"
                onClick={() => onSelectProfessional(null as any)}
                className="text-xs"
              >
                Todos
              </Button>
              
              {/* Individual professional buttons */}
              {availableProfessionals.map((professional) => {
                const isSelected = selectedProfessional === professional.user_id;
                
                return (
                  <Button
                    key={professional.user_id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => onSelectProfessional(professional.user_id)}
                    className="text-xs"
                  >
                    {professional.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Professional filter for list view */}
      {viewMode === 'list' && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Exibindo consultas de: <span className="font-medium">{selectedProfessionalName}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filtrar por:</span>
            <div className="flex gap-1">
              {/* "Todos" button */}
              <Button
                variant={selectedProfessional === null ? "default" : "outline"}
                size="sm"
                onClick={() => onSelectProfessional(null as any)}
                className="text-xs"
              >
                Todos
              </Button>
              
              {/* Individual professional buttons */}
              {availableProfessionals.map((professional) => {
                const isSelected = selectedProfessional === professional.user_id;
                
                return (
                  <Button
                    key={professional.user_id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => onSelectProfessional(professional.user_id)}
                    className="text-xs"
                  >
                    {professional.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 