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
import { Send, Paperclip, Mic, MoreVertical, Info, MessageCircle, FileText, Play, Pause, Settings } from "lucide-react";
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
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showAudioPreview, setShowAudioPreview] = useState(false);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // FASE 2: Audio Preview Controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // FASE 3: Audio Quality Controls
  const [audioQuality, setAudioQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const [compressionLevel, setCompressionLevel] = useState(0.7);
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);

  // Posiciona instantaneamente nas mensagens mais recentes
  useEffect(() => {
    if (messagesEndRef.current && timelineItems.length > 0) {
      // Posicionamento instantâneo sem animação
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
    };
  }, [mediaRecorder]);

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

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: noiseReduction,
          autoGainControl: true,
          sampleRate: audioQuality === 'high' ? 48000 : audioQuality === 'medium' ? 44100 : 22050
        }
      });

      // FASE 3: Setup audio analysis for real-time volume monitoring
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      
      setAudioContext(audioCtx);
      setAnalyser(analyserNode);
      
      // Start volume monitoring
      const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
      const updateVolume = () => {
        if (analyserNode && isRecording) {
          analyserNode.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setVolumeLevel(average / 255);
          requestAnimationFrame(updateVolume);
        }
      };
      updateVolume();

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { 
          type: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        });
        setAudioBlob(blob);
        setShowAudioPreview(true);
        
        // FASE 2: Create audio URL for playback
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Cleanup stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      recorder.start(1000);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      setAudioChunks([]);
      streamRef.current = stream;

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      alert('Erro ao acessar o microfone. Verifique as permissões.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const handleMicrophoneClick = async () => {
    if (!isRecording) {
      await startRecording();
    } else {
      stopRecording();
    }
  };

  const sendAudio = async () => {
    if (!audioBlob || !selectedConversationId) return;

    try {
      const formData = new FormData();
      const fileName = `voice_${Date.now()}.webm`;
      formData.append('files', audioBlob, fileName);
      formData.append('messageType', 'audio_voice'); // Specify as voice recording

      const response = await fetch(`/api/conversations/${selectedConversationId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Reset audio state
        setAudioBlob(null);
        setShowAudioPreview(false);
        setRecordingTime(0);
        console.log('Áudio enviado com sucesso');
      } else {
        console.error('Erro ao enviar áudio');
        alert('Erro ao enviar áudio. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao enviar áudio:', error);
      alert('Erro ao enviar áudio. Verifique sua conexão.');
    }
  };

  const cancelAudio = () => {
    setAudioBlob(null);
    setShowAudioPreview(false);
    setRecordingTime(0);
    
    // FASE 2: Cleanup audio URL and reset playback state
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  // FASE 2: Audio Playback Controls
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Format recording time
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
            onClick={handleMicrophoneClick}
            title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
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

        {/* FASE 3: Advanced Audio Recording Interface with Quality Controls */}
        {isRecording && (
          <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            {/* Recording Status Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-700 font-medium">Gravando áudio...</span>
                <span className="text-red-600 text-sm">{formatTime(recordingTime)}</span>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 text-gray-600" />
              </Button>
            </div>

            {/* Audio Quality Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Quality Control */}
              <div>
                <label className="text-xs text-gray-700 font-medium mb-1 block">Qualidade de Áudio</label>
                <select 
                  value={audioQuality} 
                  onChange={(e) => setAudioQuality(e.target.value as 'high' | 'medium' | 'low')}
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="high">Alta Qualidade (48kHz)</option>
                  <option value="medium">Qualidade Média (44kHz)</option>
                  <option value="low">Qualidade Básica (22kHz)</option>
                </select>
              </div>

              {/* Noise Reduction */}
              <div>
                <label className="text-xs text-gray-700 font-medium mb-1 block">Controles Avançados</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={noiseReduction}
                      onChange={(e) => setNoiseReduction(e.target.checked)}
                      className="mr-2 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Redução de Ruído</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Volume Level Indicator - Real-time */}
            <div className="mb-4">
              <label className="text-xs text-gray-700 font-medium mb-2 block">
                Nível de Volume em Tempo Real
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={cn(
                      "h-3 rounded-full transition-all duration-100",
                      volumeLevel > 0.8 ? "bg-red-500" : 
                      volumeLevel > 0.5 ? "bg-yellow-500" : "bg-green-500"
                    )}
                    style={{ width: `${volumeLevel * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono text-gray-600 w-12 text-right">
                  {Math.round(volumeLevel * 100)}%
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Silêncio</span>
                <span>Ideal</span>
                <span>Alto</span>
              </div>
            </div>

            {/* Compression Level Control */}
            <div className="mb-4">
              <label className="text-xs text-gray-700 font-medium mb-2 block">
                Nível de Compressão: {Math.round(compressionLevel * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={compressionLevel}
                onChange={(e) => setCompressionLevel(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Sem compressão</span>
                <span>Máxima compressão</span>
              </div>
            </div>

            {/* Recording Actions */}
            <div className="flex justify-center">
              <Button
                variant="destructive"
                size="sm"
                onClick={stopRecording}
                className="px-6"
              >
                Parar Gravação
              </Button>
            </div>
          </div>
        )}

        {/* FASE 2: Advanced Audio Preview with Playback Controls */}
        {!isRecording && showAudioPreview && audioBlob && audioUrl && (
          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            {/* Hidden audio element for playback */}
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleAudioEnded}
              style={{ display: 'none' }}
            />
            
            <div className="space-y-3">
              {/* Header with title and duration */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mic className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Áudio gravado</p>
                    <p className="text-xs text-blue-700">
                      {formatTime(Math.floor(currentTime))} / {formatTime(Math.floor(duration || recordingTime))}
                    </p>
                  </div>
                </div>
                
                {/* Play/Pause Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayback}
                  className="w-10 h-10 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>
              
              {/* Waveform Progress Bar */}
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max={duration || recordingTime}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((currentTime / (duration || recordingTime)) * 100)}%, #cbd5e1 ${((currentTime / (duration || recordingTime)) * 100)}%, #cbd5e1 100%)`
                    }}
                  />
                </div>
                
                {/* Simulated Waveform Visualization */}
                <div className="flex items-center justify-center space-x-1 h-8">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1 rounded-full bg-blue-300 transition-all duration-150",
                        i < (32 * (currentTime / (duration || recordingTime))) ? "bg-blue-500" : "bg-blue-200"
                      )}
                      style={{
                        height: `${Math.random() * 20 + 8}px`,
                        animation: isPlaying && i < (32 * (currentTime / (duration || recordingTime))) 
                          ? `pulse 0.5s ease-in-out infinite alternate` 
                          : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelAudio}
                  className="text-red-600 hover:text-red-800"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={sendAudio}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Enviar
                </Button>
              </div>
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