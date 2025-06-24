import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Conversation, Message, InsertConversation, InsertMessage } from '../../../shared/schema';

// Types para as respostas da API
interface ConversationsResponse {
  conversations: (Conversation & {
    contact_name: string;
    contact_phone: string;
    contact_email?: string;
    contact_status: string;
  })[];
  total: number;
  hasMore: boolean;
}

interface ConversationDetailResponse {
  conversation: Conversation;
  messages: (Message & {
    attachments: any[];
  })[];
  actions: {
    id: number;
    action_type: string;
    title: string;
    description: string;
    metadata: any;
    created_at: string;
  }[];
}

export function useConversations(status: string = 'active', limit: number = 50) {
  return useQuery({
    queryKey: ['/api/conversations-simple', status, limit],
    queryFn: async () => {
      const response = await fetch(`/api/conversations-simple?status=${status}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar conversas');
      }
      return response.json() as Promise<ConversationsResponse>;
    },
    staleTime: 5000, // Reduzido para 5 segundos para updates mais rápidos
  });
}

export function useConversationDetail(conversationId: number | string | null) {
  return useQuery({
    queryKey: ['/api/conversations-simple', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const response = await fetch(`/api/conversations-simple/${conversationId}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar conversa');
      }
      return response.json() as Promise<ConversationDetailResponse>;
    },
    enabled: !!conversationId,
    staleTime: 3000, // Reduzido para 3 segundos para updates imediatos para reduzir requests
    gcTime: 5 * 60 * 1000, // 5 minutos de cache em garbage collection
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertConversation) => {
      return apiRequest('/api/conversations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      // Invalidar lista de conversas
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, message }: { 
      conversationId: number | string; 
      message: { content: string } 
    }) => {
      const response = await fetch(`/api/conversations-simple/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: message.content }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao enviar mensagem');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      console.log('✅ Message sent successfully:', data);
      
      // Invalidação imediata para atualizações em tempo real
      queryClient.invalidateQueries({ queryKey: ['/api/conversations-simple'] });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations-simple', variables.conversationId] 
      });
      
      // Refetch imediato da conversa para mostrar nova mensagem instantaneamente
      queryClient.refetchQueries({
        queryKey: ['/api/conversations-simple', variables.conversationId]
      });
    },
    onError: (error) => {
      console.error('❌ Error sending message:', error);
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: number) => {
      return apiRequest(`/api/conversations/${conversationId}/mark-read`, {
        method: 'PUT',
      });
    },
    onSuccess: (_, conversationId) => {
      // Invalidar conversa específica
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations', conversationId] 
      });
      // Invalidar lista para atualizar contadores
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });
}

export function useArchiveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, archive }: { 
      conversationId: number; 
      archive: boolean 
    }) => {
      return apiRequest(`/api/conversations/${conversationId}/archive`, {
        method: 'PUT',
        body: JSON.stringify({ archive }),
      });
    },
    onSuccess: () => {
      // Invalidar todas as listas de conversas
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });
}