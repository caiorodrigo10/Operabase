import { SystemEvent } from "@/types/conversations";
import { Calendar, CheckCircle, Zap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventMarkerProps {
  event: SystemEvent;
}

const eventStyles = {
  availability_check: {
    background: "bg-blue-50",
    border: "border-blue-200",
    icon: Calendar,
    color: "text-blue-700"
  },
  appointment_created: {
    background: "bg-green-50",
    border: "border-green-200",
    icon: CheckCircle,
    color: "text-green-700"
  },
  webhook_executed: {
    background: "bg-purple-50",
    border: "border-purple-200",
    icon: Zap,
    color: "text-purple-700"
  },
  other: {
    background: "bg-gray-50",
    border: "border-gray-200",
    icon: Activity,
    color: "text-gray-700"
  }
};

export function EventMarker({ event }: EventMarkerProps) {
  const style = eventStyles[event.type];
  const Icon = style.icon;
  
  return (
    <div className="flex justify-center mb-4">
      <div className={cn(
        "flex items-center px-3 py-2 rounded-lg border border-dashed max-w-sm",
        style.background,
        style.border
      )}>
        <Icon className={cn("w-4 h-4 mr-2", style.color)} />
        <div className="flex flex-col">
          <span className={cn("text-sm font-medium", style.color)}>
            {event.content}
          </span>
          {event.metadata && (
            <div className="text-xs text-gray-600 mt-1">
              {event.metadata.appointment_date && event.metadata.appointment_time && (
                <span>Criado por: {event.metadata.doctor_name || 'Sistema'}</span>
              )}
              {event.metadata.webhook_name && (
                <span>Status: {event.metadata.status === 'success' ? 'Sucesso' : 'Erro'}</span>
              )}
            </div>
          )}
          <span className="text-xs text-gray-500 mt-1">
            {event.timestamp}
          </span>
        </div>
      </div>
    </div>
  );
}