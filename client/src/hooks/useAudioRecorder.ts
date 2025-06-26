import { useState, useRef, useCallback } from 'react';

export interface AudioRecorderState {
  isRecording: boolean;
  isPlaying: boolean;
  audioUrl: string | null;
  duration: number;
  currentTime: number;
  volume: number;
}

export interface UseAudioRecorderReturn {
  state: AudioRecorderState;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  playRecording: () => void;
  pauseRecording: () => void;
  resetRecording: () => void;
  onAudioReady: (callback: (audioFile: File) => void) => void;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPlaying: false,
    audioUrl: null,
    duration: 0,
    currentTime: 0,
    volume: 0
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioReadyCallbackRef = useRef<((audioFile: File) => void) | null>(null);
  const volumeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 Starting audio recording...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🎤 Recording stopped, processing audio...');
        
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Create audio file
        const audioFile = new File(
          [audioBlob], 
          `gravacao_${Date.now()}.webm`, 
          { type: 'audio/webm;codecs=opus' }
        );

        // Get the actual recording duration from the timer
        const recordingDuration = (Date.now() - recordingStartTimeRef.current) / 1000;
        
        setState(prev => ({
          ...prev,
          isRecording: false,
          audioUrl,
          volume: 0,
          duration: recordingDuration,
          currentTime: 0
        }));

        // Trigger callback with audio file
        if (audioReadyCallbackRef.current) {
          audioReadyCallbackRef.current(audioFile);
        }

        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(1000); // Collect data every 1 second
      
      // Start recording timer
      recordingStartTimeRef.current = Date.now();
      
      setState(prev => ({
        ...prev,
        isRecording: true,
        audioUrl: null,
        duration: 0,
        currentTime: 0
      }));

      // Start recording timer to track duration
      recordingTimerRef.current = setInterval(() => {
        const elapsed = (Date.now() - recordingStartTimeRef.current) / 1000;
        setState(prev => ({
          ...prev,
          currentTime: elapsed
        }));
      }, 100);

      // Start volume monitoring
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      volumeIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const volume = Math.min(100, Math.max(0, (average / 255) * 100));
        
        setState(prev => ({
          ...prev,
          volume
        }));
      }, 100);

    } catch (error) {
      console.error('❌ Error starting recording:', error);
      setState(prev => ({
        ...prev,
        isRecording: false,
        volume: 0
      }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    console.log('🛑 Stopping audio recording...');
    
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    // Stop all timers
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, [state.isRecording]);

  const playRecording = useCallback(() => {
    if (state.audioUrl && !state.isPlaying) {
      if (!audioRef.current) {
        audioRef.current = new Audio(state.audioUrl);
        
        // Set loop to false to prevent infinite playback
        audioRef.current.loop = false;
        
        audioRef.current.ontimeupdate = () => {
          if (audioRef.current && !audioRef.current.ended) {
            setState(prev => ({
              ...prev,
              currentTime: audioRef.current!.currentTime
            }));
          }
        };
        
        audioRef.current.onloadedmetadata = () => {
          if (audioRef.current && isFinite(audioRef.current.duration)) {
            // Only update duration if it's a valid finite number
            setState(prev => ({
              ...prev,
              duration: audioRef.current!.duration
            }));
          }
        };
        
        audioRef.current.onended = () => {
          setState(prev => ({
            ...prev,
            isPlaying: false,
            currentTime: 0
          }));
        };

        audioRef.current.onerror = (e) => {
          console.error('Audio playback error:', e);
          setState(prev => ({
            ...prev,
            isPlaying: false
          }));
        };
      }
      
      audioRef.current.play().catch(error => {
        console.error('Failed to play audio:', error);
        setState(prev => ({
          ...prev,
          isPlaying: false
        }));
      });
      
      setState(prev => ({
        ...prev,
        isPlaying: true
      }));
    }
  }, [state.audioUrl, state.isPlaying]);

  const pauseRecording = useCallback(() => {
    if (audioRef.current && state.isPlaying) {
      audioRef.current.pause();
      setState(prev => ({
        ...prev,
        isPlaying: false
      }));
    }
  }, [state.isPlaying]);

  const resetRecording = useCallback(() => {
    // Stop any ongoing recording
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Clear all intervals
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    // Clean up stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clean up audio URL
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    
    // Reset timers
    recordingStartTimeRef.current = 0;
    
    // Reset state
    setState({
      isRecording: false,
      isPlaying: false,
      audioUrl: null,
      duration: 0,
      currentTime: 0,
      volume: 0
    });
    
    console.log('🔄 Audio recorder reset');
  }, [state.isRecording, state.audioUrl]);

  const onAudioReady = useCallback((callback: (audioFile: File) => void) => {
    audioReadyCallbackRef.current = callback;
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    playRecording,
    pauseRecording,
    resetRecording,
    onAudioReady
  };
};