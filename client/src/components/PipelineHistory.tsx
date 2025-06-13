import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar,
  Clock,
  User,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Activity,
  RefreshCw
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PipelineHistoryItem {
  id: number;
  type: 'stage_change' | 'appointment_created' | 'appointment_completed' | 'note_added' | 'contact_updated';
  title: string;
  description: string;
  contact_name?: string;
  opportunity_title?: string;
  from_stage?: string;
  to_stage?: string;
  appointment_date?: string;
  created_at: string;
  created_by?: string;
  metadata?: any;
}

const activityIcons = {
  stage_change: Activity,
  appointment_created: Calendar,
  appointment_completed: CheckCircle,
  note_added: FileText,
  contact_updated: User,
};

const activityColors = {
  stage_change: "bg-blue-50 border-blue-200 text-blue-700",
  appointment_created: "bg-green-50 border-green-200 text-green-700",
  appointment_completed: "bg-emerald-50 border-emerald-200 text-emerald-700",
  note_added: "bg-purple-50 border-purple-200 text-purple-700",
  contact_updated: "bg-orange-50 border-orange-200 text-orange-700",
};

const stageLabels = {
  novo: "Novo Contato",
  em_conversa: "Em Conversa", 
  agendado: "Consulta Agendada",
  pos_atendimento: "Pós Atendimento",
  perdido: "Perdido"
};

export function PipelineHistory() {
  const [showAll, setShowAll] = useState(false);

  // Buscar histórico real do pipeline
  const { data: historyItems = [], isLoading } = useQuery({
    queryKey: ['/api/pipeline/history'],
    enabled: true
  });

  // Mock data para demonstração visual
  const mockHistoryItems: PipelineHistoryItem[] = [
    {
      id: 1,
      type: 'stage_change',
      title: 'Oportunidade atualizada',
      description: 'Eliude Costa movido de Reunião Confirmada para Proposta',
      contact_name: 'Eliude Costa',
      opportunity_title: 'Get Brands PT',
      from_stage: 'agendado',
      to_stage: 'pos_atendimento',
      created_at: new Date().toISOString(),
      created_by: 'Dr. João Silva'
    },
    {
      id: 2,
      type: 'appointment_created', 
      title: 'Nova consulta criada',
      description: 'Consulta marcada para 12 de Jun, 2025 às 15:00',
      contact_name: 'Eliude Costa',
      appointment_date: '2025-06-12T15:00:00',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      created_by: 'Dr. João Silva'
    },
    {
      id: 3,
      type: 'stage_change',
      title: 'Oportunidade criada',
      description: 'Eliude Costa criado no estágio Reunião Confirmada',
      contact_name: 'Eliude Costa',
      opportunity_title: 'Get Brands PT',
      to_stage: 'agendado',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      created_by: 'Sistema'
    },
    {
      id: 4,
      type: 'appointment_completed',
      title: 'Consulta finalizada',
      description: 'Consulta de 12 de Jun, 2025 às 15:00 foi concluída',
      contact_name: 'Eliude Costa',
      appointment_date: '2025-06-12T15:00:00',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      created_by: 'Dr. João Silva'
    }
  ];

  const displayItems = showAll ? mockHistoryItems : mockHistoryItems.slice(0, 3);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Histórico do Funil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Activity className="w-5 h-5 text-blue-600" />
            Histórico do Funil
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {displayItems.map((item, index) => {
            const IconComponent = activityIcons[item.type];
            const isLast = index === displayItems.length - 1;
            
            return (
              <div key={item.id} className="relative">
                {/* Timeline Line */}
                {!isLast && (
                  <div className="absolute left-5 top-12 w-px h-16 bg-gray-200" />
                )}
                
                {/* Activity Card */}
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${activityColors[item.type]}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {item.title}
                          </h4>
                          <p className="text-gray-600 text-sm mt-1">
                            {item.description}
                          </p>
                        </div>
                        <div className="ml-4 text-right">
                          <Badge variant="secondary" className="text-xs">
                            {item.contact_name || 'Sistema'}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Stage Change Visual */}
                      {item.type === 'stage_change' && item.from_stage && item.to_stage && (
                        <div className="flex items-center gap-2 mt-3 p-2 bg-gray-50 rounded-md">
                          <Badge variant="outline" className="text-xs">
                            {stageLabels[item.from_stage as keyof typeof stageLabels] || item.from_stage}
                          </Badge>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <Badge variant="outline" className="text-xs">
                            {stageLabels[item.to_stage as keyof typeof stageLabels] || item.to_stage}
                          </Badge>
                        </div>
                      )}
                      
                      {/* Appointment Details */}
                      {item.appointment_date && (
                        <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(item.appointment_date), "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })}</span>
                        </div>
                      )}
                      
                      {/* Opportunity Title */}
                      {item.opportunity_title && (
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <span className="font-medium text-blue-600">{item.opportunity_title}</span>
                          <Button variant="link" size="sm" className="h-auto p-0 text-blue-600 text-xs">
                            Ver oportunidade
                          </Button>
                        </div>
                      )}
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}</span>
                        </div>
                        {item.created_by && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            <span>{item.created_by}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Show More/Less Button */}
        {mockHistoryItems.length > 3 && (
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => setShowAll(!showAll)}
              className="text-blue-600 hover:text-blue-700"
            >
              {showAll ? 'Mostrar menos' : `Mostrar mais (${mockHistoryItems.length - 3} itens)`}
            </Button>
          </div>
        )}
        
        {displayItems.length === 0 && (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Nenhuma atividade encontrada</p>
            <p className="text-sm text-gray-400">As atividades do funil aparecerão aqui</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}