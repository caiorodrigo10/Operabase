import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { X, Upload, FileIcon, Image, Video, Music, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpload } from '@/hooks/useUpload';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  onUploadSuccess: (result: any) => void;
}

interface FileWithPreview {
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_TYPES = {
  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  'video/*': ['.mp4', '.mov', '.avi', '.webm'],
  'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/*': ['.txt']
};

const getFileType = (mimeType: string): FileWithPreview['type'] => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('doc') || mimeType.includes('text')) return 'document';
  return 'other';
};

const FileIcon_Component = ({ type, className }: { type: FileWithPreview['type']; className?: string }) => {
  switch (type) {
    case 'image': return <Image className={className} />;
    case 'video': return <Video className={className} />;
    case 'audio': return <Music className={className} />;
    case 'document': return <FileText className={className} />;
    default: return <FileIcon className={className} />;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function FileUploadModal({ isOpen, onClose, conversationId, onUploadSuccess }: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
        setError(`Arquivo muito grande. Limite: ${formatFileSize(MAX_FILE_SIZE)}`);
      } else if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
        setError('Tipo de arquivo não suportado');
      } else {
        setError('Erro ao selecionar arquivo');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const fileWithPreview: FileWithPreview = {
        file,
        type: getFileType(file.type)
      };

      // Create preview for images
      if (fileWithPreview.type === 'image') {
        fileWithPreview.preview = URL.createObjectURL(file);
      }

      setSelectedFile(fileWithPreview);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    accept: ACCEPTED_TYPES
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile.file);
      formData.append('caption', caption);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(`/api/conversations/${conversationId}/upload`, {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro no upload');
      }

      const result = await response.json();
      setProgress(100);

      // Wait a bit to show 100% progress
      setTimeout(() => {
        onUploadSuccess(result);
        handleClose();
      }, 500);

    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Erro no upload');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setCaption('');
    setProgress(0);
    setError(null);
    setUploading(false);
    onClose();
  };

  const removeFile = () => {
    if (selectedFile?.preview) {
      URL.revokeObjectURL(selectedFile.preview);
    }
    setSelectedFile(null);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Enviar Arquivo</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedFile ? (
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-gray-300 hover:border-gray-400"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              {isDragActive ? (
                <p className="text-blue-600">Solte o arquivo aqui...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    Arraste um arquivo aqui ou clique para selecionar
                  </p>
                  <p className="text-sm text-gray-400">
                    Imagens, vídeos, áudio, documentos (até {formatFileSize(MAX_FILE_SIZE)})
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {selectedFile.preview ? (
                    <img 
                      src={selectedFile.preview} 
                      alt="Preview" 
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                      <FileIcon_Component type={selectedFile.type} className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedFile.file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(selectedFile.file.size)}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  disabled={uploading}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {selectedFile && selectedFile.type !== 'audio' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Legenda (opcional)
              </label>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Adicione uma descrição para o arquivo..."
                disabled={uploading}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta mensagem será enviada junto com o arquivo no WhatsApp
              </p>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Enviando arquivo...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {uploading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}