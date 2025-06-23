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
    staleTime: 30000, // 30 segundos
  });
}

export function useConversationDetail(conversationId: number | null) {
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
    staleTime: 10000, // 10 segundos
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
      conversationId: number; 
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
        throw new Error('Erro ao enviar mensagem');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidar mensagens da conversa específica
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations-simple', variables.conversationId] 
      });
      // Invalidar lista de conversas para atualizar contadores
      queryClient.invalidateQueries({ queryKey: ['/api/conversations-simple'] });
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