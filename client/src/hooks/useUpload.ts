import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface UploadParams {
  conversationId: string;
  file: File;
  caption?: string;
  sendToWhatsApp?: boolean;
}

interface UploadResult {
  success: boolean;
  data: {
    message: any;
    attachment: any;
    signedUrl: string;
    expiresAt: string;
    whatsapp: {
      sent: boolean;
      messageId?: string;
      error?: string;
    };
  };
}

export function useUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, file, caption, sendToWhatsApp = true }: UploadParams): Promise<UploadResult> => {
      const formData = new FormData();
      formData.append('file', file);
      if (caption) formData.append('caption', caption);
      formData.append('sendToWhatsApp', sendToWhatsApp.toString());

      console.log(`📤 Uploading file: ${file.name} (${file.size} bytes) to conversation ${conversationId}`);

      const response = await fetch(`/api/conversations/${conversationId}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Upload failed with status ${response.status}:`, errorText);
        const error = JSON.parse(errorText || '{}').error || errorText || `HTTP ${response.status}`;
        throw new Error(error);
      }

      const result = await response.json();
      console.log(`✅ Upload successful:`, result);
      
      return result;
    },
    onSuccess: (data, variables) => {
      console.log(`🔄 Invalidating cache for conversation ${variables.conversationId}`);
      
      // Invalidar cache da conversa específica
      queryClient.invalidateQueries({
        queryKey: ['/api/conversations-simple', variables.conversationId]
      });
      
      // Invalidar lista de conversas
      queryClient.invalidateQueries({
        queryKey: ['/api/conversations-simple']
      });
    },
    onError: (error) => {
      console.error('❌ Upload failed:', error);
      console.error('Upload error:', error);
    }
  });
}