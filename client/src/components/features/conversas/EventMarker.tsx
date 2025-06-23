import { SystemEvent } from "@/types/conversations";

interface EventMarkerProps {
  event: SystemEvent;
}

export function EventMarker({ event }: EventMarkerProps) {
  return (
    <div className="flex justify-center mb-4">
      <div className="bg-gray-50 border border-dashed border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-medium max-w-xs text-center">
        {event.content}
      </div>
    </div>
  );
}