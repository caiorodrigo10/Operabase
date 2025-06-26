import { useState, useRef, useCallback } from 'react';

// Estados do gravador de áudio
export type AudioRecorderState = 
  | 'idle'           // Pronto para gravar
  | 'requesting'     // Solicitando permissão
  | 'recording'      // Gravando
  | 'stopped'        // Gravação parada
  | 'processing'     // Processando áudio
  | 'ready'          // Arquivo pronto
  | 'error';         // Erro ocorrido

// Tipos de erro
export type AudioRecorderError = 
  | 'permission_denied'
  | 'not_supported'
  | 'recording_failed'
  | 'processing_failed'
  | 'too_short'
  | 'too_long';

// Configurações do MediaRecorder
const RECORDER_CONFIG = {
  // Prioridade de codecs (baseado na API Evolution que retorna audio/mp4)
  mimeTypes: [
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/wav'
  ],
  audioBitsPerSecond: 128000,
};

// Limites de duração
const MIN_DURATION_MS = 1000;  // 1 segundo mínimo
const MAX_DURATION_MS = 300000; // 5 minutos máximo

interface UseAudioRecorderReturn {
  // Estados
  state: AudioRecorderState;
  duration: number;
  error: AudioRecorderError | null;
  audioFile: File | null;
  
  // Métodos
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => void;
  reset: () => void;
  
  // Utilitários
  isSupported: boolean;
  supportedMimeType: string | null;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  // Estados
  const [state, setState] = useState<AudioRecorderState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<AudioRecorderError | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Detectar suporte e codec disponível
  const getSupportedMimeType = useCallback((): string | null => {
    if (!MediaRecorder.isTypeSupported) return null;
    
    for (const mimeType of RECORDER_CONFIG.mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }
    return null;
  }, []);

  const supportedMimeType = getSupportedMimeType();
  const isSupported = !!supportedMimeType && !!navigator.mediaDevices?.getUserMedia;

  // Timer para duração
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setDuration(elapsed);
      
      // Auto-stop se atingir limite máximo
      if (elapsed >= MAX_DURATION_MS) {
        stopRecording();
      }
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Limpar recursos
  const cleanup = useCallback(() => {
    stopTimer();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    
    chunksRef.current = [];
  }, [stopTimer]);

  // Processar áudio gravado
  const processAudioBlob = useCallback(async (blob: Blob): Promise<File> => {
    setState('processing');
    
    try {
      // Validar duração mínima
      if (duration < MIN_DURATION_MS) {
        throw new Error('too_short');
      }
      
      // Criar nome do arquivo baseado na data
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const extension = supportedMimeType?.includes('mp4') ? 'mp4' : 'webm';
      const fileName = `audio-gravado-${timestamp}.${extension}`;
      
      // Criar File object com tipo MIME correto
      const audioFile = new File([blob], fileName, {
        type: supportedMimeType || 'audio/webm',
        lastModified: Date.now()
      });
      
      return audioFile;
    } catch (error) {
      const errorType = error instanceof Error ? error.message as AudioRecorderError : 'processing_failed';
      setError(errorType);
      setState('error');
      throw error;
    }
  }, [duration, supportedMimeType]);

  // Iniciar gravação
  const startRecording = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      setError('not_supported');
      setState('error');
      return;
    }

    try {
      setState('requesting');
      setError(null);
      setDuration(0);
      
      // Solicitar permissão de microfone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      // Configurar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType!,
        audioBitsPerSecond: RECORDER_CONFIG.audioBitsPerSecond
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Event listeners
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(chunksRef.current, { 
            type: supportedMimeType! 
          });
          
          const file = await processAudioBlob(audioBlob);
          setAudioFile(file);
          setState('ready');
        } catch (error) {
          // Error já tratado no processAudioBlob
        }
      };
      
      mediaRecorder.onerror = () => {
        setError('recording_failed');
        setState('error');
        cleanup();
      };
      
      // Iniciar gravação
      mediaRecorder.start(100); // Coleta dados a cada 100ms
      setState('recording');
      startTimer();
      
    } catch (error) {
      setError('permission_denied');
      setState('error');
      cleanup();
    }
  }, [isSupported, supportedMimeType, startTimer, processAudioBlob, cleanup]);

  // Parar gravação
  const stopRecording = useCallback(async (): Promise<void> => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
      setState('stopped');
      stopTimer();
    }
  }, [state, stopTimer]);

  // Cancelar gravação
  const cancelRecording = useCallback(() => {
    cleanup();
    setState('idle');
    setDuration(0);
    setError(null);
    setAudioFile(null);
  }, [cleanup]);

  // Reset completo
  const reset = useCallback(() => {
    cancelRecording();
  }, [cancelRecording]);

  return {
    // Estados
    state,
    duration,
    error,
    audioFile,
    
    // Métodos
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
    
    // Utilitários
    isSupported,
    supportedMimeType
  };
};

// Hook para formatação de tempo
export const useFormatDuration = (durationMs: number): string => {
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};