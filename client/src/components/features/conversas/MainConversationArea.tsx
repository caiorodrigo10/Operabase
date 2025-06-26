import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Send, Paperclip, Mic, MessageCircle, FileText, Info } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { EventMarker } from "./EventMarker";
import { ActionNotification } from "./ActionNotification";
import { FileUploadModal } from "./FileUploadModal";
import { AudioRecordingModal } from "./AudioRecordingModal";

// Simple date formatting function
const formatDateLabel = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Hoje';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ontem';
  } else {
    return date.toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'short' 
    });
  }
};

interface TimelineItem {
  id: string | number;
  type: 'message' | 'event' | 'action';
  data: any;
}

interface PatientInfo {
  id: string | number;
  name: string;
  phone?: string;
  lastMessage?: string;
  unreadCount?: number;
  avatar?: string;
}

const shouldShowDateHeader = (currentItem: TimelineItem, previousItem?: TimelineItem): boolean => {
  if (!previousItem) return true;
  
  const currentDate = currentItem.data?.timestamp || currentItem.data?.created_at;
  const previousDate = previousItem.data?.timestamp || previousItem.data?.created_at;
  
  if (!currentDate || !previousDate) return false;
  
  const current = new Date(currentDate).toDateString();
  const previous = new Date(previousDate).toDateString();
  
  return current !== previous;
};

interface MainConversationAreaProps {
  timelineItems: TimelineItem[];
  patientInfo?: PatientInfo;
  onSendMessage?: (message: string, isNote?: boolean) => void;
  showInfoButton?: boolean;
  onInfoClick?: () => void;
  selectedConversationId?: string | number;
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
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Posiciona instantaneamente nas mensagens mais recentes
  useEffect(() => {
    if (messagesEndRef.current && timelineItems.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [timelineItems]);

  const handleSendMessage = () => {
    if (message.trim() && onSendMessage) {
      onSendMessage(message.trim(), isNoteMode);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };



  const handleFileUpload = async (files: File[], caption?: string) => {
    if (!selectedConversationId) {
      console.error('❌ No selectedConversationId for file upload');
      return;
    }

    console.log('📤 Starting file upload:', {
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      caption,
      conversationId: selectedConversationId
    });

    try {
      const formData = new FormData();
      files.forEach(file => {
        console.log('📎 Adding file to FormData:', file.name, file.type, file.size);
        formData.append('file', file);
      });
      if (caption) formData.append('caption', caption);
      formData.append('sendToWhatsApp', 'true');
      
      // Para áudio gravado, adicionar messageType específico
      if (files[0] && (files[0].name.includes('gravacao_') || files[0].type.includes('audio/webm'))) {
        formData.append('messageType', 'audio_voice');
        console.log('🎤 Marked as audio_voice for Evolution API routing');
      }

      const uploadUrl = `/api/conversations/${selectedConversationId}/upload`;
      console.log('📡 Making request to:', uploadUrl);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      console.log('📡 Upload response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload response error:', errorText);
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Upload successful:', result);
    } catch (error) {
      console.error('❌ Upload error details:', error);
    }
    
    setShowUploadModal(false);
  };

  const handleAudioReady = async (audioFile: File) => {
    console.log('🎤 Audio ready for upload:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
      selectedConversationId
    });
    
    if (!selectedConversationId) {
      console.error('❌ No conversation selected for audio upload');
      setShowAudioRecorder(false);
      return;
    }
    
    // Usar rota isolada para áudio gravado
    try {
      console.log('📤 Starting audio upload via isolated route...');
      
      const formData = new FormData();
      formData.append('file', audioFile);
      
      const response = await fetch(`/api/conversations/${selectedConversationId}/upload-voice`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload response error:', errorText);
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Audio upload via isolated route successful:', result);
      
      // Invalidate cache to refresh conversation
      queryClient.invalidateQueries({ queryKey: ['/api/conversations-simple'] });
    } catch (error) {
      console.error('❌ Audio upload failed:', error);
    } finally {
      // SEMPRE fechar o modal e limpar recursos
      console.log('🔒 Closing audio recorder modal');
      setShowAudioRecorder(false);
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
                  {showDateHeader && dateToShow && (
                    <div className="flex justify-center my-4">
                      <div className="bg-blue-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                        {formatDateLabel(dateToShow)}
                      </div>
                    </div>
                  )}
                  
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
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4 shadow-lg">
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
            <span>Nota Interna</span>
          </Button>

          {showInfoButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={onInfoClick}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            >
              <Info className="w-4 h-4" />
              <span>Informações do Paciente</span>
            </Button>
          )}
        </div>

        <div className="flex space-x-2 items-end">
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
              placeholder={isNoteMode ? "Digite sua nota interna..." : "Digite sua mensagem..."}
              className={cn(
                "resize-none pr-4 transition-all duration-200",
                isNoteMode 
                  ? "border-amber-300 focus:border-amber-500 focus:ring-amber-200" 
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
              )}
              rows={1}
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 flex-shrink-0 w-10 h-10"
            title="Gravar áudio"
            onClick={() => setShowAudioRecorder(true)}
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
      </div>

      {/* Upload Modal */}
      {showUploadModal && selectedConversationId && (
        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          conversationId={selectedConversationId.toString()}
          onUploadSuccess={() => {
            console.log('✅ Upload completed successfully');
            setShowUploadModal(false);
          }}
        />
      )}

      {/* Audio Recording Modal */}
      {showAudioRecorder && (
        <AudioRecordingModal
          isOpen={showAudioRecorder}
          onClose={() => setShowAudioRecorder(false)}
          onAudioReady={handleAudioReady}
        />
      )}

    </div>
  );
}