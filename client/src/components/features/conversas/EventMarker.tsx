import { SystemEvent } from "@/types/conversations";

interface EventMarkerProps {
  event: SystemEvent;
}

export function EventMarker({ event }: EventMarkerProps) {
  return (
    <div className="flex justify-center mb-4">
      <div className="bg-blue-50 border border-dashed border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-xs font-medium max-w-xs text-center">
        {event.content}
        {event.metadata && (
          <div className="text-blue-600 mt-1">
            {event.metadata.appointment_date && event.metadata.appointment_time && (
              <span>Criado por: {event.metadata.doctor_name || 'Sistema'}</span>
            )}
            {event.metadata.webhook_name && (
              <span>Status: {event.metadata.status === 'success' ? 'Sucesso' : 'Erro'}</span>
            )}
          </div>
        )}
        <div className="text-blue-500 mt-1">
          {event.timestamp}
        </div>
      </div>
    </div>
  );
}