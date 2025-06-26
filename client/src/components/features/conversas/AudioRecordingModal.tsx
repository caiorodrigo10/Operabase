import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Mic, Square, Play, Pause, RotateCcw, Send } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { cn } from '@/lib/utils';

interface AudioRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAudioReady: (audioFile: File) => void;
}

export function AudioRecordingModal({ isOpen, onClose, onAudioReady }: AudioRecordingModalProps) {
  const {
    state,
    startRecording,
    stopRecording,
    playRecording,
    pauseRecording,
    resetRecording,
    onAudioReady: setAudioReadyCallback
  } = useAudioRecorder();

  useEffect(() => {
    setAudioReadyCallback(onAudioReady);
  }, [onAudioReady, setAudioReadyCallback]);

  const handleClose = () => {
    resetRecording();
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVolumeBar = () => {
    const bars = Array.from({ length: 5 }, (_, i) => {
      const threshold = (i + 1) * 20;
      const isActive = state.volume > threshold;
      return (
        <div
          key={i}
          className={cn(
            "w-1 h-4 mx-0.5 rounded-full transition-colors duration-150",
            isActive ? "bg-red-500" : "bg-gray-300"
          )}
        />
      );
    });
    return <div className="flex items-center">{bars}</div>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gravação de Áudio</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Timer */}
          <div className="text-center">
            {state.isRecording && (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-600">Gravando...</span>
                </div>
                <div className="text-lg font-mono">
                  {formatTime(state.currentTime)}
                </div>
                {getVolumeBar()}
              </div>
            )}

            {state.audioUrl && !state.isRecording && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Gravação concluída
                </div>
                <div className="text-lg font-mono">
                  {formatTime(state.duration)}
                </div>
              </div>
            )}

            {!state.isRecording && !state.audioUrl && (
              <div className="text-sm text-gray-600">
                Pressione o botão para começar a gravar
              </div>
            )}
          </div>

          {/* Audio Playback */}
          {state.audioUrl && (
            <div className="space-y-2">
              <Progress 
                value={(state.currentTime / state.duration) * 100} 
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatTime(state.currentTime)}</span>
                <span>{formatTime(state.duration)}</span>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex justify-center space-x-4">
            {!state.isRecording && !state.audioUrl && (
              <Button
                onClick={startRecording}
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16"
              >
                <Mic className="w-6 h-6" />
              </Button>
            )}

            {state.isRecording && (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                className="rounded-full w-16 h-16"
              >
                <Square className="w-6 h-6" />
              </Button>
            )}

            {state.audioUrl && (
              <>
                <Button
                  onClick={state.isPlaying ? pauseRecording : playRecording}
                  size="lg"
                  variant="outline"
                  className="rounded-full w-12 h-12"
                >
                  {state.isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>

                <Button
                  onClick={resetRecording}
                  size="lg"
                  variant="outline"
                  className="rounded-full w-12 h-12"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>

          {/* Action Buttons */}
          {state.audioUrl && (
            <div className="flex justify-between">
              <Button
                onClick={handleClose}
                variant="outline"
              >
                Cancelar
              </Button>
              
              <Button
                onClick={() => {
                  // The onAudioReady callback will be triggered automatically
                  // when the audio is ready, which will close the modal
                }}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar Áudio
              </Button>
            </div>
          )}

          {!state.audioUrl && !state.isRecording && (
            <div className="flex justify-center">
              <Button
                onClick={handleClose}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}