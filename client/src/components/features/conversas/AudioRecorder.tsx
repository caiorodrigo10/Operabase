import { Mic, Square, Play, Pause, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { formatTime } from '@/lib/utils';

interface AudioRecorderProps {
  onSendAudio: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
  isUploading?: boolean;
}

export function AudioRecorder({ onSendAudio, onCancel, isUploading = false }: AudioRecorderProps) {
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording
  } = useAudioRecorder();

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const handleSendAudio = () => {
    if (audioBlob && recordingTime > 0) {
      onSendAudio(audioBlob, recordingTime);
      resetRecording();
    }
  };

  const handleCancel = () => {
    resetRecording();
    onCancel();
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-600 text-sm">{error}</div>
        <Button size="sm" variant="outline" onClick={handleCancel}>
          Fechar
        </Button>
      </div>
    );
  }

  // Recording state
  if (isRecording || isPaused) {
    return (
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`} />
          <span className="text-sm font-medium">
            {isRecording ? 'Gravando...' : 'Pausado'}
          </span>
          <span className="text-sm text-gray-600">
            {formatTime(recordingTime)}
          </span>
        </div>
        
        <div className="flex items-center gap-1 ml-auto">
          {isRecording ? (
            <Button size="sm" variant="outline" onClick={pauseRecording}>
              <Pause className="w-4 h-4" />
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={resumeRecording}>
              <Play className="w-4 h-4" />
            </Button>
          )}
          
          <Button size="sm" variant="outline" onClick={stopRecording}>
            <Square className="w-4 h-4" />
          </Button>
          
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Preview state (recorded audio ready to send)
  if (audioBlob && audioUrl) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm font-medium">Áudio gravado</span>
          <span className="text-sm text-gray-600">
            {formatTime(recordingTime)}
          </span>
        </div>
        
        <audio 
          src={audioUrl} 
          controls 
          className="h-8 flex-1 max-w-xs"
          style={{ maxHeight: '32px' }}
        />
        
        <div className="flex items-center gap-1 ml-auto">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={resetRecording}
            disabled={isUploading}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          
          <Button 
            size="sm" 
            onClick={handleSendAudio}
            disabled={isUploading}
          >
            <Send className="w-4 h-4" />
            {isUploading ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </div>
    );
  }

  // Initial state - record button
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleStartRecording}
        className="flex items-center gap-2"
      >
        <Mic className="w-4 h-4" />
        Gravar áudio
      </Button>
      
      <Button size="sm" variant="ghost" onClick={onCancel}>
        Cancelar
      </Button>
    </div>
  );
}