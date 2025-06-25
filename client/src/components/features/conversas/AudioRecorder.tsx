import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Send, X, AlertTriangle } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { AudioRecordingPreview } from './AudioRecordingPreview';
import { cn } from '@/lib/utils';

interface AudioRecorderProps {
  onSendAudio: (audioBlob: Blob) => void;
  className?: string;
}

export function AudioRecorder({ onSendAudio, className }: AudioRecorderProps) {
  const [showRecorder, setShowRecorder] = useState(false);
  const {
    recordingState,
    recordingTime,
    audioBlob,
    audioUrl,
    isSupported,
    startRecording,
    stopRecording,
    clearRecording,
    error
  } = useAudioRecorder();

  const handleStartRecording = async () => {
    setShowRecorder(true);
    await startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleSendAudio = () => {
    if (audioBlob) {
      onSendAudio(audioBlob);
      clearRecording();
      setShowRecorder(false);
    }
  };

  const handleCancel = () => {
    clearRecording();
    setShowRecorder(false);
  };

  // Se não suporta gravação, não mostrar botão
  if (!isSupported) {
    return null;
  }

  return (
    <>
      {!showRecorder ? (
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700 flex-shrink-0 w-10 h-10"
          title="Gravar áudio"
          onClick={handleStartRecording}
        >
          <Mic className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          variant={recordingState === 'recording' ? "destructive" : "ghost"}
          size="sm"
          className={cn(
            "flex-shrink-0 w-10 h-10",
            recordingState === 'recording' 
              ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
              : "text-gray-500 hover:text-gray-700"
          )}
          title={recordingState === 'recording' ? "Parar gravação" : "Gravar áudio"}
          onClick={recordingState === 'recording' ? handleStopRecording : handleStartRecording}
        >
          {recordingState === 'recording' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
      )}

      {/* Recording UI - positioned outside the flex row */}
      {showRecorder && (
        <div className="absolute bottom-full left-0 right-0 mb-2 z-10">
          {/* Recording Interface */}
          {recordingState === 'recording' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-700">
                    Gravando... {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:
                    {(recordingTime % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="shadow-lg">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Audio Preview */}
          {recordingState === 'stopped' && audioUrl && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
              <AudioRecordingPreview
                audioUrl={audioUrl}
                recordingTime={recordingTime}
                onSend={handleSendAudio}
                onCancel={handleCancel}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}