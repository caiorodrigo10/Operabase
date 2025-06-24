import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketMessage {
  conversation_id: number;
  message: {
    id: number;
    content: string;
    sender_type: string;
    sender_name: string;
    created_at: string;
    attachments?: any[];
  };
  timestamp: string;
}

interface ConversationUpdate {
  conversation_id: number;
  last_message?: string;
  updated_at?: string;
  unread_count?: number;
}

interface UserTyping {
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: string;
}

interface WebSocketState {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
}

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    reconnecting: false,
    error: null
  });

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    // Simular token de autenticação - em produção usar token JWT real
    const mockToken = btoa(JSON.stringify({
      userId: '3cd96e6d-81f2-4c8a-a54d-3abac77b37a4',
      email: 'cr@caiorodrigo.com.br',
      name: 'Caio Rodrigo',
      clinicId: 1
    }));

    const socket = io(window.location.origin, {
      auth: {
        token: mockToken
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('🔗 WebSocket connected');
      setState(prev => ({ ...prev, connected: true, reconnecting: false, error: null }));
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setState(prev => ({ ...prev, connected: false, error: `Disconnected: ${reason}` }));
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setState(prev => ({ ...prev, connected: false, error: error.message }));
    });

    socket.on('reconnect', () => {
      console.log('🔄 WebSocket reconnected');
      setState(prev => ({ ...prev, connected: true, reconnecting: false, error: null }));
    });

    socket.on('reconnect_attempt', () => {
      console.log('🔄 WebSocket reconnecting...');
      setState(prev => ({ ...prev, reconnecting: true }));
    });

    // Message events
    socket.on('message:new', (data: WebSocketMessage) => {
      console.log('📨 New message received:', data);
      
      // Invalidate conversation detail to fetch new message
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations-simple', data.conversation_id] 
      });
      
      // Invalidate conversations list to update last message
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations-simple'] 
      });
    });

    // Conversation events
    socket.on('conversation:updated', (data: ConversationUpdate) => {
      console.log('🔄 Conversation updated:', data);
      
      // Invalidate specific conversation and list
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations-simple', data.conversation_id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations-simple'] 
      });
    });

    socket.on('conversation:list_updated', (data: ConversationUpdate) => {
      console.log('📋 Conversation list updated:', data);
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations-simple'] 
      });
    });

    // User activity events
    socket.on('user:typing', (data: UserTyping) => {
      console.log('⌨️ User typing:', data);
      // Implementar indicador visual de digitação
    });

    socket.on('user:joined', (data: any) => {
      console.log('👋 User joined conversation:', data);
    });

    socket.on('user:status', (data: any) => {
      console.log('🟢 User status changed:', data);
    });

  }, [queryClient]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setState({ connected: false, reconnecting: false, error: null });
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // WebSocket methods
  const joinConversation = useCallback((conversationId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('conversation:join', conversationId);
      console.log(`💬 Joined conversation: ${conversationId}`);
    }
  }, []);

  const leaveConversation = useCallback((conversationId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('conversation:leave', conversationId);
      console.log(`👋 Left conversation: ${conversationId}`);
    }
  }, []);

  const sendTyping = useCallback((conversationId: number, isTyping: boolean) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('conversation:typing', { conversationId, isTyping });
    }
  }, []);

  const markMessageRead = useCallback((conversationId: number, messageId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message:read', { conversationId, messageId });
    }
  }, []);

  const setUserStatus = useCallback((status: 'online' | 'away' | 'offline') => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('user:status', status);
    }
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    joinConversation,
    leaveConversation,
    sendTyping,
    markMessageRead,
    setUserStatus
  };
}