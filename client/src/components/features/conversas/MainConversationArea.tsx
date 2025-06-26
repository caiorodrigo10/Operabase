import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Send, Paperclip, Mic, MessageCircle, FileText, Info, Play, Pause, X, Check } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { EventMarker } from "./EventMarker";
import { ActionNotification } from "./ActionNotification";
import { FileUploadModal } from "./FileUploadModal";
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
  
  const current = new Date(currentDate);
  const previous = new Date(previousDate);
  
  return current.toDateString() !== previous.toDateString();
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showAudioPreview, setShowAudioPreview] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Posiciona instantaneamente nas mensagens mais recentes
  useEffect(() => {
    if (messagesEndRef.current && timelineItems.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [timelineItems]);

  // Cleanup audio resources on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [mediaRecorder, audioUrl]);

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
    if (!selectedConversationId) return;

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('file', file));
      if (caption) formData.append('caption', caption);
      formData.append('sendToWhatsApp', 'true');

      const response = await fetch(`/api/conversations/${selectedConversationId}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      console.log('Files uploaded successfully');
    } catch (error) {
      console.error('Error uploading files:', error);
    }
    
    setShowUploadModal(false);
  };

  const handleMicrophoneClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      console.log('🎤 Starting audio recording...');
      
      // First, clean any existing state
      resetAudioState();
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      console.log('🎤 Got media stream, tracks:', stream.getTracks().length);
      
      // Test stream is active
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks found');
      }
      
      console.log('🎤 Audio track state:', audioTracks[0].readyState);
      
      // Try different MIME types based on browser support
      let mimeType = '';
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      console.log('🎤 Using MIME type:', mimeType || 'default');
      
      const recorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, recorderOptions);
      const chunks: BlobPart[] = [];
      
      console.log('🎤 MediaRecorder created, state:', recorder.state);
      
      recorder.ondataavailable = (event) => {
        console.log('🎤 Data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        console.log('🎤 Recording stopped, chunks:', chunks.length, 'recordingTime:', recordingTime);
        const finalMimeType = mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: finalMimeType });
        
        console.log('🎤 Created blob:', {
          size: blob.size,
          type: blob.type,
          recordingTime,
          chunksCount: chunks.length
        });
        
        // More lenient validation - allow any blob with data
        if (blob.size === 0) {
          console.error('🎤 Empty audio blob detected');
          alert('Erro: Não foi possível capturar áudio. Verifique o microfone e tente novamente.');
          resetAudioState();
          return;
        }
        
        console.log('🎤 Audio recorded successfully:', blob.size, 'bytes');
        
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setShowAudioPreview(true);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      recorder.onerror = (event) => {
        console.error('🎤 MediaRecorder error:', event);
        alert('Erro na gravação. Tente novamente.');
        resetAudioState();
      };

      recorder.onstart = () => {
        console.log('🎤 MediaRecorder started successfully');
      };
      
      // Store recorder before starting
      setMediaRecorder(recorder);
      
      // Wait for recorder to be ready and then start
      await new Promise((resolve, reject) => {
        recorder.onstart = () => {
          console.log('🎤 MediaRecorder started successfully');
          resolve(void 0);
        };
        
        recorder.onerror = (event) => {
          console.error('🎤 MediaRecorder startup error:', event);
          reject(new Error('MediaRecorder failed to start'));
        };
        
        console.log('🎤 Starting recorder...');
        recorder.start(250); // Collect data every 250ms
      });
      
      // Only set recording state after successful start
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('🎤 Error starting recording:', error);
      resetAudioState();
      
      if (error.name === 'NotAllowedError') {
        alert('Permissão de microfone negada. Por favor, permita o acesso ao microfone e tente novamente.');
      } else if (error.name === 'NotFoundError') {
        alert('Microfone não encontrado. Verifique se há um microfone conectado.');
      } else if (error.message.includes('MediaRecorder')) {
        alert('Erro no sistema de gravação. Tente usar um navegador diferente ou verifique se o microfone está funcionando.');
      } else {
        alert('Erro ao iniciar gravação. Verifique as permissões do microfone.');
      }
    }
  };

  const stopRecording = () => {
    console.log('🎤 Attempting to stop recording...');
    
    if (mediaRecorder) {
      console.log('🎤 MediaRecorder state:', mediaRecorder.state);
      
      if (mediaRecorder.state === 'recording') {
        console.log('🎤 Stopping MediaRecorder...');
        mediaRecorder.stop();
      } else if (mediaRecorder.state === 'paused') {
        console.log('🎤 Resuming and stopping MediaRecorder...');
        mediaRecorder.resume();
        mediaRecorder.stop();
      } else {
        console.log('🎤 MediaRecorder not in recording state:', mediaRecorder.state);
      }
    } else {
      console.error('🎤 No MediaRecorder instance found');
    }
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    setIsRecording(false);
  };

  const handleSendAudio = async () => {
    if (!audioBlob || !selectedConversationId) {
      console.error('🎤 Cannot send audio: missing blob or conversation ID');
      return;
    }
    
    try {
      console.log('🎤 Preparing to send audio:', {
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
        conversationId: selectedConversationId,
        recordingTime
      });

      // Additional validation
      if (audioBlob.size === 0) {
        alert('Erro: Áudio vazio. Grave novamente.');
        return;
      }

      if (recordingTime < 0.5) {
        alert('Áudio muito curto. Grave por pelo menos meio segundo.');
        return;
      }

      const formData = new FormData();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Determine file extension based on MIME type
      let extension = 'webm';
      if (audioBlob.type.includes('mp4')) {
        extension = 'mp4';
      } else if (audioBlob.type.includes('wav')) {
        extension = 'wav';
      }
      
      const audioFile = new File([audioBlob], `voice-recording-${timestamp}.${extension}`, {
        type: audioBlob.type || 'audio/webm'
      });
      
      console.log('🎤 Created file:', {
        name: audioFile.name,
        size: audioFile.size,
        type: audioFile.type
      });
      
      formData.append('file', audioFile);
      formData.append('sendToWhatsApp', 'true');
      formData.append('messageType', 'voice');
      formData.append('caption', 'Mensagem de voz');

      console.log('🎤 Sending upload request...');
      const response = await fetch(`/api/conversations/${selectedConversationId}/upload`, {
        method: 'POST',
        body: formData
      });

      console.log('🎤 Upload response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎤 Audio upload failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        
        if (response.status === 413) {
          alert('Áudio muito grande. Tente gravar um áudio mais curto.');
        } else if (response.status === 400) {
          alert('Formato de áudio não suportado. Tente novamente.');
        } else if (response.status === 401) {
          alert('Sessão expirada. Faça login novamente.');
        } else {
          alert(`Erro ao enviar áudio (${response.status}). Tente novamente.`);
        }
        return;
      }

      const result = await response.json();
      console.log('🎤 Audio upload successful:', result);

      resetAudioState();

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

    } catch (error) {
      console.error('🎤 Error uploading audio:', error);
      
      if (error.name === 'NetworkError' || error.message.includes('fetch')) {
        alert('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        alert('Erro ao enviar áudio. Tente novamente.');
      }
    }
  };

  const resetAudioState = () => {
    setAudioBlob(null);
    setShowAudioPreview(false);
    setRecordingTime(0);
    setIsPlaying(false);
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const handleCancelAudio = () => {
    resetAudioState();
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

      {/* Recording Interface - RED BLOCK */}
      {isRecording && (
        <div className="flex-shrink-0 bg-red-50 border-t border-red-200 p-4">
          <div className="flex items-center justify-between bg-red-500 text-white p-3 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="font-medium">Gravando...</span>
              <span className="text-red-100">{formatTime(recordingTime)}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMicrophoneClick}
              className="text-white hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Audio Preview Interface - BLUE BLOCK */}
      {showAudioPreview && audioUrl && (
        <div className="flex-shrink-0 bg-blue-50 border-t border-blue-200 p-4">
          <div className="bg-blue-500 text-white p-3 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayback}
                  className="text-white hover:bg-blue-600 w-8 h-8 p-0"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <span className="text-sm">Áudio gravado ({formatTime(recordingTime)})</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelAudio}
                  className="text-white hover:bg-blue-600"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSendAudio}
                  className="text-white hover:bg-blue-600"
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>
        </div>
      )}

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
            <span>Nota</span>
          </Button>
        </div>

        <div className="flex items-end space-x-3 relative">
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
            className="text-gray-500 hover:text-gray-700 flex-shrink-0 w-10 h-10"
            title="Gravar áudio"
            onClick={handleMicrophoneClick}
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
      {showUploadModal && (
        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleFileUpload}
        />
      )}
    </div>
  );
}