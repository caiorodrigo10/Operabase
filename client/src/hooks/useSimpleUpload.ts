import { useMutation } from '@tanstack/react-query';

interface UploadParams {
  conversationId: string;
  file: File;
  caption?: string;
  sendToWhatsApp?: boolean;
}

interface UploadResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * NOVA ABORDAGEM: Upload simples SEM preview otimista
 * Arquivo só aparece após modal fechar - elimina flicker completamente
 */
export function useSimpleUpload() {
  console.log('🎯 NOVA ABORDAGEM: Hook de upload simples inicializado - zero flicker');
  
  return useMutation({
    mutationFn: async ({ conversationId, file, caption, sendToWhatsApp = true }: UploadParams): Promise<UploadResult> => {
      console.log('📤 NOVA ABORDAGEM: Iniciando upload silencioso:', {
        conversationId,
        fileName: file.name,
        fileSize: file.size,
        sendToWhatsApp
      });
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sendToWhatsApp', sendToWhatsApp.toString());
        
        if (caption?.trim()) {
          formData.append('caption', caption.trim());
        }

        const response = await fetch(`/api/conversations/${conversationId}/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        console.log('✅ NOVA ABORDAGEM: Upload concluído silenciosamente - pronto para mostrar após modal fechar');
        
        return {
          success: true,
          data: result
        };
        
      } catch (error) {
        console.error('❌ NOVA ABORDAGEM: Erro detalhado no upload:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          type: typeof error,
          conversationId: variables.conversationId
        });
        
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido no upload'
        };
      }
    },
    
    // NOVA ABORDAGEM: Sem cache mutations - tudo acontece no modal ao fechar
    onMutate: async (variables) => {
      console.log('🎯 NOVA ABORDAGEM: Upload iniciado - SEM preview otimista');
      return null; // Sem contexto otimista
    },
    
    onSuccess: (result, variables) => {
      console.log('✅ NOVA ABORDAGEM: Upload bem-sucedido - invalidando cache para aparecer imediatamente');
      
      // CORREÇÃO: Invalidar cache imediatamente após upload com chaves corretas
      // Usando mesmo padrão de chaves do sistema principal
      queryClient.invalidateQueries({
        queryKey: ['/api/conversations-simple', variables.conversationId]
      });
      
      queryClient.invalidateQueries({
        queryKey: ['/api/conversations-simple']
      });
      
      console.log('🧹 Cache invalidado - arquivo aparecerá instantaneamente');
    },
    
    onError: (error, variables) => {
      console.error('❌ NOVA ABORDAGEM: Erro no upload:', error);
      // Tratamento de erro sem manipulação de cache
    }
  });
}