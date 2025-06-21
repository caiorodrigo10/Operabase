import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageBubble } from "./MessageBubble";
import { EventMarker } from "./EventMarker";
import { TimelineItem, PatientInfo } from "@/types/conversations";
import { Send, Paperclip, Mic, MoreVertical, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface MainConversationAreaProps {
  timelineItems: TimelineItem[];
  patientInfo?: PatientInfo;
  onSendMessage?: (message: string) => void;
  showInfoButton?: boolean;
  onInfoClick?: () => void;
}

export function MainConversationArea({
  timelineItems,
  patientInfo,
  onSendMessage,
  showInfoButton = false,
  onInfoClick
}: MainConversationAreaProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const handleSendMessage = () => {
    if (message.trim() && onSendMessage) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!patientInfo) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <Info className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium">Selecione uma conversa para começar</p>
          <p className="text-sm">Escolha uma conversa da lista ao lado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {timelineItems.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Nenhuma mensagem ainda</p>
          </div>
        ) : (
          timelineItems.map((item) => (
            <div key={item.id}>
              {item.type === 'message' ? (
                <MessageBubble message={item.data as any} />
              ) : (
                <EventMarker event={item.data as any} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <div className="flex-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="min-h-[40px] max-h-[120px] resize-none"
              rows={1}
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-gray-500 hover:text-gray-700",
              isRecording && "text-red-500"
            )}
            onClick={() => setIsRecording(!isRecording)}
          >
            <Mic className="w-4 h-4" />
          </Button>

          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {isRecording && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-700">Gravando áudio...</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRecording(false)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                Parar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}