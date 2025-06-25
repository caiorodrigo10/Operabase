import { CheckCircle, Loader2, AlertCircle, Upload, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioSendStatusProps {
  status: 'idle' | 'uploading' | 'processing' | 'sending' | 'success' | 'error';
  progress: number;
  message: string;
}

export function AudioSendStatus({ status, progress, message }: AudioSendStatusProps) {
  if (status === 'idle') return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Upload className="w-4 h-4 animate-pulse" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'sending':
        return <Send className="w-4 h-4 animate-pulse" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
      case 'processing':
      case 'sending':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={cn(
      "mt-3 p-3 rounded-lg border transition-all duration-200",
      getStatusColor()
    )}>
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{message}</span>
            {status !== 'success' && status !== 'error' && (
              <span className="text-xs">{progress}%</span>
            )}
          </div>
          
          {/* Progress bar for uploading/processing/sending */}
          {(status === 'uploading' || status === 'processing' || status === 'sending') && (
            <div className="w-full bg-white bg-opacity-50 rounded-full h-1.5">
              <div 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  status === 'uploading' && "bg-blue-500",
                  status === 'processing' && "bg-purple-500", 
                  status === 'sending' && "bg-green-500"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}