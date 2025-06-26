import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, Square, Send, X, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAudioRecorder, useFormatDuration, type AudioRecorderError } from "@/hooks/useAudioRecorder";

interface AudioRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onAudioReady: (audioFile: File) => void;
}

// Mensagens de erro user-friendly
const ERROR_MESSAGES: Record<AudioRecorderError, string> = {
  permission_denied: "Permissão para acessar o microfone foi negada. Verifique as configurações do navegador.",
  not_supported: "Gravação de áudio não é suportada neste navegador.",
  recording_failed: "Falha na gravação. Tente novamente.",
  processing_failed: "Erro ao processar o áudio gravado.",
  too_short: "Gravação muito curta. Mínimo de 1 segundo.",
  too_long: "Gravação muito longa. Máximo de 5 minutos."
};

export function AudioRecorder({ isOpen, onClose, onAudioReady }: AudioRecorderProps) {
  const {
    state,
    duration,
    error,
    audioFile,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
    isSupported
  } = useAudioRecorder();

  const formattedDuration = useFormatDuration(duration);

  // Reset quando modal fecha
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Auto-fechar quando áudio estiver pronto e for enviado
  const handleSendAudio = () => {
    if (audioFile) {
      console.log('🎤 Sending audio and cleaning up resources');
      onAudioReady(audioFile);
      // Limpar recursos IMEDIATAMENTE após envio
      reset();
      onClose();
    }
  };

  const handleClose = () => {
    if (state === 'recording') {
      cancelRecording();
    }
    onClose();
  };

  // Se não suportado, mostrar erro
  if (!isSupported) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Gravação de Áudio
            </DialogTitle>
          </DialogHeader>
          
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Gravação de áudio não é suportada neste navegador.
              Tente usar uma versão mais recente do Chrome, Firefox ou Edge.
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Gravação de Áudio
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status da Gravação */}
          <div className="text-center space-y-4">
            {/* Indicador Visual */}
            <div className="flex justify-center">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
                state === 'recording' 
                  ? "bg-red-100 text-red-600 animate-pulse" 
                  : state === 'requesting'
                  ? "bg-yellow-100 text-yellow-600"
                  : state === 'processing'
                  ? "bg-blue-100 text-blue-600"
                  : state === 'ready'
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-600"
              )}>
                {state === 'recording' && <Mic className="w-8 h-8" />}
                {state === 'requesting' && <Clock className="w-8 h-8" />}
                {state === 'processing' && <Clock className="w-8 h-8 animate-spin" />}
                {state === 'ready' && <Send className="w-8 h-8" />}
                {(state === 'idle' || state === 'stopped') && <Mic className="w-8 h-8" />}
              </div>
            </div>

            {/* Status Text */}
            <div className="space-y-1">
              <p className="font-medium">
                {state === 'idle' && 'Pronto para gravar'}
                {state === 'requesting' && 'Solicitando permissão...'}
                {state === 'recording' && 'Gravando...'}
                {state === 'stopped' && 'Gravação finalizada'}
                {state === 'processing' && 'Processando áudio...'}
                {state === 'ready' && 'Áudio pronto para envio'}
                {state === 'error' && 'Erro na gravação'}
              </p>
              
              {/* Timer durante gravação */}
              {(state === 'recording' || state === 'stopped' || state === 'ready') && duration > 0 && (
                <p className="text-2xl font-mono text-blue-600">
                  {formattedDuration}
                </p>
              )}
            </div>
          </div>

          {/* Erro */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                {ERROR_MESSAGES[error]}
              </AlertDescription>
            </Alert>
          )}

          {/* Controles */}
          <div className="flex justify-center gap-3">
            {/* Estado Idle - Mostrar botão Gravar */}
            {state === 'idle' && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={startRecording} className="bg-red-600 hover:bg-red-700">
                  <Mic className="w-4 h-4 mr-2" />
                  Gravar
                </Button>
              </>
            )}

            {/* Estado Recording - Mostrar botão Parar */}
            {state === 'recording' && (
              <>
                <Button variant="outline" onClick={cancelRecording}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={stopRecording} variant="destructive">
                  <Square className="w-4 h-4 mr-2" />
                  Parar
                </Button>
              </>
            )}

            {/* Estado Ready - Mostrar opções */}
            {state === 'ready' && (
              <>
                <Button variant="outline" onClick={cancelRecording}>
                  <X className="w-4 h-4 mr-2" />
                  Descartar
                </Button>
                <Button onClick={handleSendAudio} className="bg-green-600 hover:bg-green-700">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </Button>
              </>
            )}

            {/* Estados de loading */}
            {(state === 'requesting' || state === 'processing') && (
              <Button variant="outline" onClick={cancelRecording}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            )}

            {/* Estado de erro */}
            {state === 'error' && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Fechar
                </Button>
                <Button onClick={() => { reset(); }} variant="default">
                  Tentar Novamente
                </Button>
              </>
            )}
          </div>

          {/* Dicas */}
          {state === 'idle' && (
            <div className="text-sm text-gray-500 space-y-1">
              <p>• Duração mínima: 1 segundo</p>
              <p>• Duração máxima: 5 minutos</p>
              <p>• O áudio será enviado automaticamente para o WhatsApp</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}