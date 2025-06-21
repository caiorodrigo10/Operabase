import { SystemEvent } from "@/types/conversations";

interface EventMarkerProps {
  event: SystemEvent;
}

export function EventMarker({ event }: EventMarkerProps) {
  return (
    <div className="flex justify-center mb-4">
      <div className="bg-gray-50 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs font-medium max-w-sm text-center">
        {event.content}
        {event.metadata && (
          <div className="text-gray-500 mt-1">
            {event.metadata.appointment_date && event.metadata.appointment_time && (
              <span>Criado por: {event.metadata.doctor_name || 'Sistema'}</span>
            )}
            {event.metadata.webhook_name && (
              <span>Status: {event.metadata.status === 'success' ? 'Sucesso' : 'Erro'}</span>
            )}
          </div>
        )}
        <div className="text-gray-400 mt-1">
          {event.timestamp}
        </div>
      </div>
    </div>
  );
}