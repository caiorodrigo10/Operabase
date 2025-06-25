import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRecordingTime } from '@/hooks/useAudioRecorder';

interface AudioRecordingPreviewProps {
  audioUrl: string;
  recordingTime: number;
  onSend: () => void;
  onCancel: () => void;
  className?: string;
}

export function AudioRecordingPreview({
  audioUrl,
  recordingTime,
  onSend,
  onCancel,
  className
}: AudioRecordingPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setProgress(0);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      });

      audio.addEventListener('loadedmetadata', () => {
        // Audio is ready
      });

      return () => {
        audio.pause();
        audio.src = '';
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [audioUrl]);

  // Handle play/pause
  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      
      intervalRef.current = setInterval(() => {
        if (audioRef.current) {
          const current = audioRef.current.currentTime;
          const duration = recordingTime;
          setCurrentTime(current);
          setProgress((current / duration) * 100);
        }
      }, 100);
    }
  };

  // Handle restart
  const handleRestart = () => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    setProgress(0);
    setIsPlaying(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Handle progress click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const newTime = (percentage / 100) * recordingTime;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(percentage);
  };

  return (
    <div className={cn("bg-blue-50 border border-blue-200 rounded-lg p-4", className)}>
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <span className="text-sm font-medium text-blue-700">
          Gravação de áudio ({formatRecordingTime(recordingTime)})
        </span>
      </div>

      {/* Audio Player Controls */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </Button>
          
          <div className="flex-1">
            <div className="text-xs text-blue-600 mb-1">
              {formatRecordingTime(Math.floor(currentTime))} / {formatRecordingTime(recordingTime)}
            </div>
            <Progress 
              value={progress} 
              className="h-2 cursor-pointer" 
              onClick={handleProgressClick}
            />
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
            onClick={handleRestart}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-blue-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          >
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
          
          <Button
            size="sm"
            onClick={onSend}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Send className="w-4 h-4 mr-1" />
            Enviar áudio
          </Button>
        </div>
      </div>
    </div>
  );
}