import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageBubble } from "./MessageBubble";
import { EventMarker } from "./EventMarker";
import { ActionNotification } from "./ActionNotification";
import { FileUploader } from "./FileUploader";
import { FileUploadModal } from "./FileUploadModal";
import { TimelineItem, PatientInfo } from "@/types/conversations";
import { Send, Paperclip, Mic, MoreVertical, Info, MessageCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper function to format date as "23 de Junho"
const formatDateLabel = (date: string) => {
  const messageDate = new Date(date);
  return messageDate.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long'
  });
};

// Helper function to check if item should show date header
const shouldShowDateHeader = (currentItem: TimelineItem, previousItem?: TimelineItem): boolean => {
  if (!currentItem.data?.timestamp && !currentItem.data?.created_at) return false;
  
  const currentDate = new Date(currentItem.data?.timestamp || currentItem.data?.created_at);
  
  if (!previousItem) return true; // First item always shows date
  
  const prevDate = new Date(previousItem.data?.timestamp || previousItem.data?.created_at || '');
  
  // Show date header if it's a different day
  return currentDate.toDateString() !== prevDate.toDateString();
};

interface MainConversationAreaProps {
  timelineItems: TimelineItem[];
  patientInfo?: PatientInfo;
  onSendMessage?: (message: string, isNote?: boolean) => void;
  showInfoButton?: boolean;
  onInfoClick?: () => void;
  selectedConversationId?: string | number; // Para uploads
}

export function MainConversationArea({
  timelineItems,
  patientInfo,
  onSendMessage,
  showInfoButton = false,
  onInfoClick,
  selectedConversationId
}: MainConversationAreaProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Posiciona instantaneamente nas mensagens mais recentes
  useEffect(() => {
    if (messagesEndRef.current && timelineItems.length > 0) {
      // Posicionamento instantâneo sem animação
      messagesEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [timelineItems]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    console.log('🚀 MainConversationArea: Sending message:', message);
    console.log('🚀 onSendMessage function:', !!onSendMessage);
    
    if (onSendMessage) {
      onSendMessage(message.trim(), isNoteMode);
      setMessage("");
      // Scroll suave apenas para novas mensagens enviadas
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      console.error('❌ onSendMessage function not provided');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUploadSuccess = (result: any) => {
    console.log('✅ Upload successful:', result);
    
    // Notificar usuário sobre o resultado
    if (result.data?.whatsapp?.sent) {
      console.log('📱 Arquivo enviado via WhatsApp');
    } else if (result.data?.whatsapp?.error) {
      console.log('⚠️ Arquivo salvo, mas falha no WhatsApp:', result.data.whatsapp.error);
    } else {
      console.log('💾 Arquivo salvo internamente');
    }
    
    // Fechar modal
    setShowUploadModal(false);
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
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Messages Timeline - Scrollable */}
      <div 
        ref={timelineRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-5"
      >
        {timelineItems.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Nenhuma mensagem ainda</p>
          </div>
        ) : (
          <>
            {timelineItems.map((item, index) => {
              const previousItem = index > 0 ? timelineItems[index - 1] : undefined;
              const showDateHeader = shouldShowDateHeader(item, previousItem);
              const dateToShow = item.data?.timestamp || item.data?.created_at;

              return (
                <div key={item.id}>
                  {/* Date Header */}
                  {showDateHeader && dateToShow && (
                    <div className="flex justify-center my-4">
                      <div className="bg-blue-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                        {formatDateLabel(dateToShow)}
                      </div>
                    </div>
                  )}
                  
                  {/* Timeline Item */}
                  {item.type === 'message' ? (
                    <MessageBubble message={item.data as any} />
                  ) : item.type === 'action' ? (
                    <ActionNotification action={item.data as any} />
                  ) : (
                    <EventMarker event={item.data as any} />
                  )}
                </div>
              );
            })}
            {/* Scroll anchor - invisible element at the end */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        {/* Mensagem/Nota Toggle Buttons */}
        <div className="flex mb-3 space-x-2">
          <Button
            variant={!isNoteMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsNoteMode(false)}
            className={cn(
              "flex items-center space-x-2 transition-all",
              !isNoteMode 
                ? "bg-blue-500 text-white hover:bg-blue-600" 
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            )}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Mensagem</span>
          </Button>
          
          <Button
            variant={isNoteMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsNoteMode(true)}
            className={cn(
              "flex items-center space-x-2 transition-all",
              isNoteMode 
                ? "bg-amber-500 text-white hover:bg-amber-600" 
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            )}
          >
            <FileText className="w-4 h-4" />
            <span>Nota</span>
          </Button>
        </div>

        <div className="flex items-end space-x-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 flex-shrink-0 w-10 h-10"
            title="Anexar arquivo"
            onClick={() => setShowUploadModal(true)}
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <div className="flex-1 relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isNoteMode ? "Digite uma nota interna..." : "Digite sua mensagem..."}
              className={cn(
                "min-h-[40px] max-h-[100px] resize-none rounded-lg focus:ring-1 transition-all",
                isNoteMode 
                  ? "bg-amber-50 border-amber-300 focus:border-amber-500 focus:ring-amber-500 text-amber-900 placeholder:text-amber-600" 
                  : "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              )}
              rows={1}
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-gray-500 hover:text-gray-700 flex-shrink-0 w-10 h-10",
              isRecording && "text-red-500 bg-red-50"
            )}
            onClick={() => setIsRecording(!isRecording)}
          >
            <Mic className="w-4 h-4" />
          </Button>

          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            size="sm"
            className={cn(
              "flex-shrink-0 w-10 h-10 disabled:bg-gray-300",
              isNoteMode 
                ? "bg-amber-500 hover:bg-amber-600" 
                : "bg-emerald-500 hover:bg-emerald-600"
            )}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {isRecording && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
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

        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          conversationId={String(selectedConversationId || '')}
          onUploadSuccess={handleUploadSuccess}
        />
      </div>
    </div>
  );
}