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
      console.log('📤 useUpload: Received parameters:', {
        conversationId,
        conversationIdType: typeof conversationId,
        conversationIdLength: conversationId?.length,
        fileName: file.name,
        fileSize: file.size
      });

      const formData = new FormData();
      formData.append('file', file);
      if (caption) formData.append('caption', caption);
      formData.append('sendToWhatsApp', sendToWhatsApp.toString());

      console.log(`📤 Uploading file: ${file.name} (${file.size} bytes) to conversation ${conversationId}`);

      console.log(`📤 Frontend: Making upload request to /api/conversations/${conversationId}/upload`);
      console.log(`📤 Frontend: FormData keys:`, Array.from(formData.keys()));
      console.log(`📤 Frontend: File info:`, file.name, file.size, file.type);
      
      const response = await fetch(`/api/conversations/${conversationId}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          // Não adicionar Content-Type - deixar o browser definir boundary para multipart
        }
      });
      
      console.log(`📤 Frontend: Response status:`, response.status);
      console.log(`📤 Frontend: Response headers:`, Object.fromEntries(response.headers.entries()));

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
      console.log('✅ UPLOAD FRONTEND: Upload completed successfully');
      
      // 🚀 PERFORMANCE FIX: Cache invalidation completo como nas mensagens de texto
      console.log('🧹 UPLOAD FRONTEND: Iniciando cache invalidation...');
      
      try {
        // Invalidar cache da conversa específica (mesma chave do sistema de mensagens)
        queryClient.invalidateQueries({ 
          queryKey: ['/api/conversations-simple', variables.conversationId] 
        });
        console.log('✅ UPLOAD FRONTEND: Cache da conversa invalidado');
        
        // Invalidar cache da lista de conversas
        queryClient.invalidateQueries({ 
          queryKey: ['/api/conversations-simple'] 
        });
        console.log('✅ UPLOAD FRONTEND: Cache da lista invalidado');
        
        // 📡 WEBSOCKET: Tentar emitir evento WebSocket se disponível
        const webSocketEmit = (window as any).webSocketEmit;
        if (webSocketEmit) {
          webSocketEmit('conversation:updated', {
            conversationId: variables.conversationId,
            type: 'file_upload',
            messageId: data.data.message.id,
            attachmentId: data.data.attachment.id
          });
          console.log('📡 UPLOAD FRONTEND: WebSocket evento emitido');
        }
        
        console.log('⚡ UPLOAD FRONTEND: Cache invalidation completo');
        
      } catch (error) {
        console.log('⚠️ UPLOAD FRONTEND: Cache invalidation falhou:', error);
      }
    },
    onError: (error) => {
      console.error('❌ Upload failed:', error);
      console.error('Upload error:', error);
    }
  });
}