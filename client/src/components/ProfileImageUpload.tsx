import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ProfileImageUploadProps {
  currentImageUrl?: string | null;
  onImageChange?: (newImageUrl: string | null) => void;
}

export function ProfileImageUpload({ currentImageUrl, onImageChange }: ProfileImageUploadProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation para upload de imagem
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/user/upload-profile-picture', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao fazer upload da imagem');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso!",
        description: "Imagem de perfil atualizada com sucesso."
      });
      
      // Invalidar cache do usuário
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      // Chamar callback se fornecido
      if (onImageChange) {
        onImageChange(data.profilePictureUrl);
      }
      
      // Fechar modal e limpar estado
      setIsModalOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para remover imagem
  const removeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/user/profile-picture', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao remover imagem');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Imagem de perfil removida com sucesso."
      });
      
      // Invalidar cache do usuário
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      // Chamar callback se fornecido
      if (onImageChange) {
        onImageChange(null);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Arquivo inválido",
        description: "Selecione uma imagem JPEG, PNG ou WebP.",
        variant: "destructive"
      });
      return;
    }

    // Validar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleRemove = () => {
    removeMutation.mutate();
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  // Gerar iniciais do usuário para fallback
  const getUserInitials = (name?: string): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <>
      {/* Avatar atual com botão de alterar */}
      <div className="relative inline-block">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-teal-600 flex items-center justify-center">
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt="Foto de perfil"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-white">
              {getUserInitials('Usuario')}
            </span>
          )}
        </div>
        
        <Button
          onClick={openModal}
          size="sm"
          className="absolute bottom-2 right-2 rounded-full w-8 h-8 p-0 bg-teal-600 hover:bg-teal-700"
        >
          <Camera className="w-4 h-4" />
        </Button>
      </div>

      {/* Modal de upload */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Alterar Foto de Perfil</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModal}
                className="p-0 w-8 h-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Preview da imagem */}
            <div className="mb-4 flex justify-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : currentImageUrl ? (
                  <img
                    src={currentImageUrl}
                    alt="Foto atual"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-8 h-8 text-gray-400" />
                )}
              </div>
            </div>

            {/* Input de arquivo */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Botões de ação */}
            <div className="space-y-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                variant="outline"
              >
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Nova Imagem
              </Button>

              {selectedFile && (
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Nova Imagem'
                  )}
                </Button>
              )}

              {currentImageUrl && (
                <Button
                  onClick={handleRemove}
                  disabled={removeMutation.isPending}
                  variant="destructive"
                  className="w-full"
                >
                  {removeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Removendo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover Imagem
                    </>
                  )}
                </Button>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-3 text-center">
              Formatos aceitos: JPEG, PNG, WebP. Máximo: 5MB.
            </p>
          </div>
        </div>
      )}
    </>
  );
}