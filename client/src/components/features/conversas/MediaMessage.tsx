import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileIcon, 
  FileImage, 
  FileVideo, 
  FileAudio, 
  FileText,
  Play,
  Pause,
  Download,
  ZoomIn
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaMessageProps {
  media_type: 'image' | 'video' | 'audio' | 'document';
  media_url: string;
  media_filename?: string;
  media_size?: number;
  media_duration?: number;
  media_thumbnail?: string;
  className?: string;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getFileIcon(filename?: string) {
  if (!filename) return <FileIcon className="w-8 h-8" />;
  
  const ext = filename.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'pdf':
      return <FileText className="w-8 h-8 text-red-500" />;
    case 'doc':
    case 'docx':
      return <FileText className="w-8 h-8 text-blue-500" />;
    case 'xls':
    case 'xlsx':
      return <FileText className="w-8 h-8 text-green-500" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <FileImage className="w-8 h-8 text-purple-500" />;
    case 'mp4':
    case 'avi':
    case 'mov':
      return <FileVideo className="w-8 h-8 text-orange-500" />;
    case 'mp3':
    case 'wav':
    case 'ogg':
      return <FileAudio className="w-8 h-8 text-indigo-500" />;
    default:
      return <FileIcon className="w-8 h-8 text-gray-500" />;
  }
}

export function MediaMessage({ 
  media_type, 
  media_url, 
  media_filename, 
  media_size, 
  media_duration,
  media_thumbnail,
  className 
}: MediaMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  if (media_type === 'image') {
    return (
      <div className={cn("max-w-[200px]", className)}>
        <Dialog>
          <DialogTrigger asChild>
            <div className="relative group cursor-pointer">
              <img
                src={media_url}
                alt={media_filename || "Imagem"}
                className="w-full h-auto max-h-[150px] object-cover rounded-lg border"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] p-2">
            <img
              src={media_url}
              alt={media_filename || "Imagem"}
              className="w-full h-auto max-h-full object-contain"
            />
            {media_filename && (
              <p className="text-sm text-gray-600 text-center mt-2">{media_filename}</p>
            )}
          </DialogContent>
        </Dialog>
        {media_filename && (
          <p className="text-xs text-gray-500 mt-1 truncate">{media_filename}</p>
        )}
        {media_size && (
          <p className="text-xs text-gray-400">{formatFileSize(media_size)}</p>
        )}
      </div>
    );
  }

  if (media_type === 'video') {
    return (
      <div className={cn("max-w-[250px]", className)}>
        <div className="relative">
          <video
            src={media_url}
            poster={media_thumbnail}
            controls
            className="w-full h-auto max-h-[150px] rounded-lg border"
            preload="metadata"
          >
            Seu navegador não suporta reprodução de vídeo.
          </video>
          {media_duration && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {formatDuration(media_duration)}
            </div>
          )}
        </div>
        {media_filename && (
          <p className="text-xs text-gray-500 mt-1 truncate">{media_filename}</p>
        )}
        {media_size && (
          <p className="text-xs text-gray-400">{formatFileSize(media_size)}</p>
        )}
      </div>
    );
  }

  if (media_type === 'audio') {
    return (
      <div className={cn("min-w-[200px] max-w-[250px]", className)}>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </Button>
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                {media_filename || "Áudio"}
              </div>
              <div className="text-xs text-gray-500">
                {formatDuration(currentTime)} / {formatDuration(media_duration)}
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-1" />
          <audio
            src={media_url}
            className="hidden"
            onTimeUpdate={(e) => {
              const audio = e.target as HTMLAudioElement;
              setCurrentTime(audio.currentTime);
              setProgress((audio.currentTime / audio.duration) * 100);
            }}
          />
        </div>
        {media_size && (
          <p className="text-xs text-gray-400 mt-1">{formatFileSize(media_size)}</p>
        )}
      </div>
    );
  }

  if (media_type === 'document') {
    return (
      <div className={cn("min-w-[200px] max-w-[250px]", className)}>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {getFileIcon(media_filename)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {media_filename || "Documento"}
              </div>
              {media_size && (
                <div className="text-xs text-gray-500">{formatFileSize(media_size)}</div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}