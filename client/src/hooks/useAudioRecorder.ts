import { useState, useRef, useCallback, useEffect } from 'react';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

interface AudioRecorderHook {
  recordingState: RecordingState;
  recordingTime: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  isSupported: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
  error: string | null;
}

export function useAudioRecorder(): AudioRecorderHook {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if MediaRecorder is supported
  const isSupported = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm');

  // Start timer for recording duration
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  }, []);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    console.log('🎤 useAudioRecorder: startRecording called');
    console.log('🎵 Starting audio recording...');
    
    if (!isSupported) {
      const errorMsg = 'Gravação de áudio não é suportada neste navegador';
      console.error('❌', errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      setError(null);
      setRecordingState('recording');
      setRecordingTime(0);
      
      console.log('🎤 Requesting microphone access...');
      
      // Request microphone access with simple configuration
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true
      });
      
      console.log('✅ Microphone access granted');
      
      streamRef.current = stream;
      chunksRef.current = [];

      // Create MediaRecorder with simpler configuration
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';
      
      console.log('🎵 Creating MediaRecorder with type:', mimeType);
        
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        console.log('🎵 Data available, size:', event.data.size);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        console.log('🎵 Recording stopped, creating blob...');
        if (chunksRef.current.length === 0) {
          console.warn('⚠️ No audio data collected');
          setError('Nenhum áudio foi gravado. Tente novamente.');
          setRecordingState('idle');
          return;
        }
        
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        
        // Create URL for preview
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        console.log('🎵 Audio URL created:', url);
        setRecordingState('stopped');
        stopTimer();
      };

      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        setError('Erro durante a gravação');
        setRecordingState('idle');
        stopTimer();
      };

      // Start recording without collection interval to avoid auto-stop
      console.log('🎵 Starting MediaRecorder...');
      mediaRecorder.start();
      
      // Start timer
      startTimer();

    } catch (err) {
      console.error('❌ Error starting recording:', err);
      console.error('❌ Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : 'No stack'
      });
      
      let errorMsg = 'Erro ao acessar o microfone. Verifique as permissões.';
      
      if (err instanceof Error && err.name === 'NotAllowedError') {
        errorMsg = `Acesso ao microfone bloqueado pelo navegador Arc.

COMO RESOLVER:
1. Clique no ícone de cadeado/escudo na barra de endereço
2. Permita o acesso ao microfone para este site
3. Recarregue a página e tente novamente

Se não funcionar:
• Vá em Configurações > Privacidade > Câmera e microfone
• Certifique-se que o microfone está habilitado para este domínio`;
        
        console.error('🚫 Permission denied by browser');
      } else if (err instanceof Error && err.name === 'NotFoundError') {
        errorMsg = `Microfone não encontrado.

VERIFIQUE:
• Se há um microfone conectado ao seu computador
• Se o microfone está funcionando em outros aplicativos
• Se não há outros aplicativos usando o microfone`;
        
        console.error('🎤 No microphone device found');
      } else if (err instanceof Error && err.name === 'NotReadableError') {
        errorMsg = `Microfone em uso por outro aplicativo.

SOLUÇÃO:
• Feche outros aplicativos que possam estar usando o microfone
• Reinicie o navegador Arc
• Tente novamente`;
        
        console.error('🎤 Microphone already in use');
      } else if (err instanceof Error && err.name === 'OverconstrainedError') {
        errorMsg = `Configuração de áudio não suportada pelo seu microfone.

SOLUÇÃO: Tentando configuração alternativa...`;
        
        console.error('🎤 Audio constraints not supported');
        
        // Tentar com configurações mais simples
        try {
          console.log('🔄 Trying fallback audio settings...');
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ 
            audio: true // Configuração mais simples
          });
          
          streamRef.current = fallbackStream;
          chunksRef.current = [];
          
          const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
            ? 'audio/webm' 
            : 'audio/mp4';
            
          const mediaRecorder = new MediaRecorder(fallbackStream, { mimeType });
          mediaRecorderRef.current = mediaRecorder;
          
          // Configurar eventos do MediaRecorder (mesmo código anterior)
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunksRef.current.push(event.data);
            }
          };
          
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: mimeType });
            setAudioBlob(blob);
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            setRecordingState('stopped');
            stopTimer();
            
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }
          };
          
          mediaRecorder.onstart = () => {
            setRecordingState('recording');
            setRecordingTime(0);
            startTimer();
          };
          
          mediaRecorder.onerror = (event) => {
            console.error('❌ MediaRecorder fallback error:', event);
            setError('Erro durante a gravação');
            setRecordingState('idle');
            stopTimer();
          };
          
          console.log('✅ Fallback recording started');
          mediaRecorder.start(1000);
          return; // Sucesso com fallback
          
        } catch (fallbackErr) {
          console.error('❌ Fallback also failed:', fallbackErr);
          errorMsg = 'Microfone não compatível com este navegador. Tente usar Chrome ou Firefox.';
        }
      } else {
        errorMsg = `Erro desconhecido ao acessar microfone.

DETALHES: ${err instanceof Error ? err.message : String(err)}

TENTE:
• Recarregar a página
• Usar outro navegador (Chrome, Firefox)
• Verificar se o microfone funciona em outros sites`;
        
        console.error('💥 Unknown microphone error');
      }
      
      setError(errorMsg);
      setRecordingState('idle');
    }
  }, [isSupported, startTimer, stopTimer]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [recordingState]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      stopTimer();
    }
  }, [recordingState, stopTimer]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      startTimer();
    }
  }, [recordingState, startTimer]);

  // Clear recording
  const clearRecording = useCallback(() => {
    // Stop any ongoing recording
    if (mediaRecorderRef.current && recordingState !== 'idle') {
      mediaRecorderRef.current.stop();
    }

    // Cleanup stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Cleanup audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    // Reset state
    setRecordingState('idle');
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setError(null);
    stopTimer();
    
    chunksRef.current = [];
    mediaRecorderRef.current = null;
  }, [recordingState, audioUrl, stopTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRecording();
    };
  }, [clearRecording]);

  // Format recording time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    recordingState,
    recordingTime,
    audioBlob,
    audioUrl,
    isSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    error
  };
}

// Helper function to format duration
export function formatRecordingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}