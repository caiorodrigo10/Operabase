import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image, Video, Music, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  conversationId: string;
  onUploadSuccess?: (result: any) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // em bytes
  acceptedTypes?: string[];
  disabled?: boolean;
}

interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  message: string;
  result?: any;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  conversationId,
  onUploadSuccess,
  onUploadError,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  acceptedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mov', 'video/avi', 'video/webm',
    'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/mp4', 'audio/webm',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  disabled = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return <Image className="w-8 h-8 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="w-8 h-8 text-purple-500" />;
    if (type.startsWith('audio/')) return <Music className="w-8 h-8 text-green-500" />;
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de arquivo não suportado: ${file.type}`;
    }
    
    if (file.size > maxFileSize) {
      return `Arquivo muito grande. Máximo: ${formatFileSize(maxFileSize)}`;
    }
    
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadStatus({
        status: 'error',
        progress: 0,
        message: error
      });
      return;
    }
    
    setSelectedFile(file);
    setUploadStatus({
      status: 'idle',
      progress: 0,
      message: ''
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploadStatus({
      status: 'uploading',
      progress: 0,
      message: 'Fazendo upload...'
    });
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('caption', caption);
      formData.append('sendToWhatsApp', 'true');
      
      console.log('📤 Starting file upload:', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        conversationId,
        caption
      });
      
      // Simular progresso durante upload
      const progressInterval = setInterval(() => {
        setUploadStatus(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);
      
      const response = await fetch(`/api/conversations-simple/${conversationId}/upload`, {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setUploadStatus({
          status: 'success',
          progress: 100,
          message: result.whatsapp.sent 
            ? 'Arquivo enviado com sucesso!' 
            : 'Arquivo salvo, mas falha no WhatsApp',
          result
        });
        
        // Limpar form
        setSelectedFile(null);
        setCaption('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Callback de sucesso
        if (onUploadSuccess) {
          onUploadSuccess(result);
        }
        
        // Auto-limpar status após 3 segundos
        setTimeout(() => {
          setUploadStatus({
            status: 'idle',
            progress: 0,
            message: ''
          });
        }, 3000);
        
      } else {
        throw new Error(result.error || 'Erro no upload');
      }
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setUploadStatus({
        status: 'error',
        progress: 0,
        message: errorMessage
      });
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setCaption('');
    setUploadStatus({
      status: 'idle',
      progress: 0,
      message: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
      
      {/* Área de drop */}
      {!selectedFile && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={!disabled ? openFileDialog : undefined}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            Arraste um arquivo aqui ou clique para selecionar
          </p>
          <p className="text-sm text-gray-500">
            Máximo: {formatFileSize(maxFileSize)}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Formatos: Imagens, Vídeos, Áudios, PDFs, Documentos
          </p>
        </div>
      )}
      
      {/* Arquivo selecionado */}
      {selectedFile && (
        <div className="border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              {getFileIcon(selectedFile)}
              <div>
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
              disabled={uploadStatus.status === 'uploading'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Campo de caption */}
          <div className="mb-3">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Adicione uma legenda (opcional)..."
              className="w-full p-2 border rounded text-sm resize-none"
              rows={2}
              disabled={uploadStatus.status === 'uploading'}
            />
          </div>
          
          {/* Status do upload */}
          {uploadStatus.status !== 'idle' && (
            <div className="mb-3">
              <div className="flex items-center space-x-2 mb-2">
                {uploadStatus.status === 'uploading' && (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                )}
                {uploadStatus.status === 'success' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {uploadStatus.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${
                  uploadStatus.status === 'success' ? 'text-green-600' :
                  uploadStatus.status === 'error' ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {uploadStatus.message}
                </span>
              </div>
              
              {uploadStatus.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadStatus.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Botão de upload */}
          <button
            onClick={handleUpload}
            disabled={uploadStatus.status === 'uploading' || disabled}
            className={`
              w-full py-2 px-4 rounded text-sm font-medium transition-colors
              ${uploadStatus.status === 'uploading' || disabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
              }
            `}
          >
            {uploadStatus.status === 'uploading' ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando...</span>
              </div>
            ) : (
              'Enviar Arquivo'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader; 