import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  sessionId?: string;
}

interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const useMCPChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const queryClient = useQueryClient();

  // Gerar ID único para mensagens
  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  // Gerar sessionId se não existir
  const ensureSessionId = useCallback(() => {
    if (!sessionId) {
      const newSessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      setSessionId(newSessionId);
      return newSessionId;
    }
    return sessionId;
  }, [sessionId]);

  // Mutation para enviar mensagem ao MCP
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, currentSessionId }: { message: string; currentSessionId: string }) => {
      const response = await fetch('/api/mcp/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId: currentSessionId
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      return response.json() as Promise<MCPResponse>;
    },
    onSuccess: (data) => {
      setIsTyping(false);
      
      if (data.success && data.data) {
        // Adicionar resposta da MARA
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: data.data.action === 'chat_response' 
            ? data.data.message 
            : `✅ Ação executada: ${data.data.action}`,
          timestamp: new Date(),
          sessionId: data.data.sessionId
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Atualizar sessionId se retornou um novo
        if (data.data.sessionId && data.data.sessionId !== sessionId) {
          setSessionId(data.data.sessionId);
        }

        // Invalidar queries relacionadas se necessário
        if (data.data.action === 'create' || data.data.action === 'list' || data.data.action === 'reschedule' || data.data.action === 'cancel') {
          queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
        }
      } else {
        // Adicionar mensagem de erro
        const errorMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: `❌ Erro: ${data.error || 'Algo deu errado'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    },
    onError: (error) => {
      setIsTyping(false);
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `❌ Erro de conexão: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  // Função para enviar mensagem
  const sendMessage = useCallback((message: string) => {
    if (!message.trim()) return;

    const currentSessionId = ensureSessionId();

    // Adicionar mensagem do usuário
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      sessionId: currentSessionId
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Enviar para o MCP
    sendMessageMutation.mutate({ message, currentSessionId });
  }, [sendMessageMutation, ensureSessionId]);

  // Função para limpar conversa
  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setIsTyping(false);
  }, []);

  // Função para inicializar conversa
  const initializeChat = useCallback(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '👋 Olá! Sou a MARA, sua assistente de agendamento médico. Como posso ajudar você hoje?\n\nPosso:\n• Agendar consultas\n• Verificar disponibilidade\n• Listar agenda\n• Reagendar ou cancelar consultas',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);

  return {
    messages,
    sendMessage,
    clearChat,
    initializeChat,
    isTyping,
    isLoading: sendMessageMutation.isPending,
    sessionId
  };
};