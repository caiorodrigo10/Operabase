import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useAIToggle(conversationId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newAIState: boolean) => {
      console.log('🤖 AI Toggle: Making request to toggle AI state', {
        conversationId,
        newState: newAIState
      });
      
      const response = await apiRequest(
        `/api/conversations-simple/${conversationId}/ai-toggle`, 
        'PATCH', 
        { ai_active: newAIState }
      );
      
      console.log('🤖 AI Toggle: Response received', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('✅ AI Toggle: Success', data);
      
      // Invalidar cache para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['/api/conversations-simple'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations-simple', conversationId.toString()] });
    },
    onError: (error) => {
      console.error('❌ AI Toggle: Error', error);
    }
  });
} 