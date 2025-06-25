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
    console.log('🎵 Starting audio recording...');
    
    if (!isSupported) {
      const errorMsg = 'Gravação de áudio não é suportada neste navegador';
      console.error('❌', errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      setError(null);
      console.log('🎤 Requesting microphone access...');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      console.log('✅ Microphone access granted');
      
      streamRef.current = stream;
      chunksRef.current = [];

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';
        
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        
        // Create URL for preview
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        setRecordingState('stopped');
        stopTimer();
        
        // Cleanup stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Erro durante a gravação');
        setRecordingState('idle');
        stopTimer();
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setRecordingState('recording');
      setRecordingTime(0);
      startTimer();

    } catch (err) {
      console.error('❌ Error starting recording:', err);
      console.error('❌ Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err)
      });
      
      if (err instanceof Error && err.name === 'NotAllowedError') {
        const errorMsg = 'Permissão de microfone negada. Permita o acesso ao microfone e tente novamente.';
        console.error('🚫 Permission denied:', errorMsg);
        setError(errorMsg);
      } else if (err instanceof Error && err.name === 'NotFoundError') {
        const errorMsg = 'Microfone não encontrado. Verifique se há um microfone conectado.';
        console.error('🎤 No microphone:', errorMsg);
        setError(errorMsg);
      } else {
        const errorMsg = `Erro ao acessar o microfone: ${err instanceof Error ? err.message : String(err)}`;
        console.error('💥 Generic error:', errorMsg);
        setError(errorMsg);
      }
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