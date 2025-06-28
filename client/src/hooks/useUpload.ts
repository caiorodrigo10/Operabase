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

interface OptimisticMessage {
  id: string;
  conversation_id: string;
  sender_type: 'professional';
  content: string;
  ai_action: 'file_upload';
  timestamp: string;
  device_type: 'manual';
  evolution_status: 'pending';
  message_type: string;
  isOptimistic: true;
  localFileUrl?: string;
}

interface OptimisticAttachment {
  id: string;
  message_id: string;
  clinic_id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  isOptimistic: true;
}

// Helper functions for optimistic updates
function createOptimisticMessage(conversationId: string, file: File, caption?: string): OptimisticMessage {
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const localFileUrl = URL.createObjectURL(file);
  
  // Determine message type based on file type
  let messageType = 'file';
  if (file.type.startsWith('image/')) messageType = 'image';
  else if (file.type.startsWith('audio/')) messageType = 'audio_voice';
  else if (file.type.startsWith('video/')) messageType = 'video';
  else if (file.type.includes('pdf') || file.type.includes('document')) messageType = 'document';
  
  return {
    id: tempId,
    conversation_id: conversationId,
    sender_type: 'professional',
    content: caption || '',
    ai_action: 'file_upload',
    timestamp: new Date().toISOString(),
    device_type: 'manual',
    evolution_status: 'pending',
    message_type: messageType,
    isOptimistic: true,
    localFileUrl
  };
}

function createOptimisticAttachment(messageId: string, file: File): OptimisticAttachment {
  const tempId = `temp-att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const localFileUrl = URL.createObjectURL(file);
  
  return {
    id: tempId,
    message_id: messageId,
    clinic_id: 1, // Assumindo clinic_id 1 por ora
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    file_url: localFileUrl,
    isOptimistic: true
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
    onMutate: async ({ conversationId, file, caption }) => {
      console.log('⚡ OPTIMISTIC: Starting optimistic update for upload');
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/conversations-simple', conversationId] });
      
      // Create optimistic message and attachment
      const optimisticMessage = createOptimisticMessage(conversationId, file, caption);
      const optimisticAttachment = createOptimisticAttachment(optimisticMessage.id, file);
      
      console.log('⚡ OPTIMISTIC: Created optimistic message:', optimisticMessage);
      console.log('⚡ OPTIMISTIC: Created optimistic attachment:', optimisticAttachment);
      
      // Get current conversation data
      const previousData = queryClient.getQueryData(['/api/conversations-simple', conversationId]);
      
      // Update the cache with optimistic data
      queryClient.setQueryData(['/api/conversations-simple', conversationId], (old: any) => {
        if (!old) return old;
        
        console.log('⚡ OPTIMISTIC: Updating cache with optimistic data');
        
        return {
          ...old,
          conversation: {
            ...old.conversation,
            ai_active: false // AI becomes inactive immediately
          },
          messages: [
            ...old.messages,
            {
              ...optimisticMessage,
              attachments: [optimisticAttachment]
            }
          ],
          totalMessages: old.totalMessages + 1
        };
      });
      
      // Return context for potential rollback
      return { previousData, optimisticMessage, optimisticAttachment };
    },
    onSuccess: (data, variables, context) => {
      console.log('✅ OPTIMISTIC: Upload completed successfully, replacing optimistic data');
      
      // Clean up the local file URL to prevent memory leaks
      if (context?.optimisticAttachment?.file_url?.startsWith('blob:')) {
        URL.revokeObjectURL(context.optimisticAttachment.file_url);
        console.log('🧹 OPTIMISTIC: Cleaned up local file URL');
      }
      
      // Update cache with real data from server
      queryClient.setQueryData(['/api/conversations-simple', variables.conversationId], (old: any) => {
        if (!old) return old;
        
        console.log('⚡ OPTIMISTIC: Replacing optimistic data with server data');
        
        // Remove the optimistic message and add the real one
        const filteredMessages = old.messages.filter((msg: any) => 
          msg.id !== context?.optimisticMessage?.id
        );
        
        return {
          ...old,
          conversation: {
            ...old.conversation,
            ai_active: data.data.message.ai_active !== undefined ? data.data.message.ai_active : false
          },
          messages: [
            ...filteredMessages,
            {
              ...data.data.message,
              attachments: [data.data.attachment]
            }
          ]
        };
      });
      
      // 🚀 PERFORMANCE FIX: Cache invalidation adicional para sincronização completa
      console.log('🧹 OPTIMISTIC: Iniciando cache invalidation final...');
      
      try {
        // Invalidar cache da lista de conversas para atualizar last message
        queryClient.invalidateQueries({ 
          queryKey: ['/api/conversations-simple'] 
        });
        console.log('✅ OPTIMISTIC: Cache da lista invalidado');
        
        // 📡 WEBSOCKET: Tentar emitir evento WebSocket se disponível
        const webSocketEmit = (window as any).webSocketEmit;
        if (webSocketEmit) {
          webSocketEmit('conversation:updated', {
            conversationId: variables.conversationId,
            type: 'file_upload',
            messageId: data.data.message.id,
            attachmentId: data.data.attachment.id
          });
          console.log('📡 OPTIMISTIC: WebSocket evento emitido');
        }
        
        console.log('⚡ OPTIMISTIC: Cache invalidation completo');
        
      } catch (error) {
        console.log('⚠️ OPTIMISTIC: Cache invalidation falhou:', error);
      }
    },
    onError: (error, variables, context) => {
      console.error('❌ OPTIMISTIC: Upload failed, rolling back optimistic updates');
      
      // Clean up the local file URL
      if (context?.optimisticAttachment?.file_url?.startsWith('blob:')) {
        URL.revokeObjectURL(context.optimisticAttachment.file_url);
        console.log('🧹 OPTIMISTIC: Cleaned up local file URL after error');
      }
      
      // Rollback to previous data
      if (context?.previousData) {
        queryClient.setQueryData(['/api/conversations-simple', variables.conversationId], context.previousData);
        console.log('⚡ OPTIMISTIC: Rolled back to previous data');
      }
      
      console.error('Upload error details:', error);
    },
    onSettled: () => {
      console.log('🎯 OPTIMISTIC: Upload mutation settled, refreshing data');
      
      // Force a final refetch to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations-simple'] 
      });
    }
  });
}