import { useState } from 'react';
import { useConversations, useConversationDetail, useSendMessage, useMarkAsRead } from '@/hooks/useConversations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Phone, Mail, Clock, Send, Archive, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function ConversasPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const { toast } = useToast();

  // Hooks para dados
  const { data: conversationsData, isLoading: loadingConversations } = useConversations(statusFilter);
  const { data: conversationDetail, isLoading: loadingDetail } = useConversationDetail(selectedConversationId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();

  // Função para enviar mensagem
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversationId) return;

    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId,
        message: {
          content: messageText,
          sender_type: 'professional',
          message_type: 'text',
          direction: 'outbound'
        }
      });
      
      setMessageText('');
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para marcar como lida
  const handleMarkAsRead = async (conversationId: number) => {
    try {
      await markAsRead.mutateAsync(conversationId);
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  // Função para selecionar conversa
  const handleSelectConversation = (conversationId: number) => {
    setSelectedConversationId(conversationId);
    // Marcar como lida automaticamente
    const conversation = conversationsData?.conversations.find(c => c.id === conversationId);
    if (conversation && conversation.unread_count > 0) {
      handleMarkAsRead(conversationId);
    }
  };

  return (
    <div className="h-full flex">
      {/* Lista de Conversas */}
      <div className="w-1/3 border-r bg-background">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Conversas</h2>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Ativas
              </Button>
              <Button
                variant={statusFilter === 'archived' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('archived')}
              >
                Arquivadas
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-140px)]">
          {loadingConversations ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2">
              {conversationsData?.conversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className={`mb-2 cursor-pointer transition-colors hover:bg-accent ${
                    selectedConversationId === conversation.id ? 'bg-accent border-primary' : ''
                  }`}
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {conversation.contact_name?.substring(0, 2)?.toUpperCase() || 'UN'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate">
                            {conversation.contact_name || 'Contato sem nome'}
                          </h3>
                          {conversation.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {conversation.contact_phone}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {conversation.last_activity_at && 
                              formatDistanceToNow(new Date(conversation.last_activity_at), {
                                addSuffix: true,
                                locale: ptBR
                              })
                            }
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Badge variant={conversation.priority === 'high' ? 'destructive' : 'secondary'}>
                              {conversation.priority}
                            </Badge>
                            {conversation.total_messages > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {conversation.total_messages} msgs
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {conversationsData?.conversations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma conversa encontrada</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            {/* Header da Conversa */}
            {conversationDetail && (
              <div className="p-4 border-b bg-background">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        {conversationsData?.conversations
                          .find(c => c.id === selectedConversationId)
                          ?.contact_name?.substring(0, 2)?.toUpperCase() || 'UN'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">
                        {conversationsData?.conversations
                          .find(c => c.id === selectedConversationId)
                          ?.contact_name || 'Contato sem nome'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {conversationsData?.conversations
                          .find(c => c.id === selectedConversationId)
                          ?.contact_phone}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4">
              {loadingDetail ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {conversationDetail?.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.direction === 'outbound'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-70">
                            {message.sender_name || 'Sistema'}
                          </span>
                          <span className="text-xs opacity-70">
                            {message.created_at && 
                              formatDistanceToNow(new Date(message.created_at), {
                                addSuffix: true,
                                locale: ptBR
                              })
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input de Mensagem */}
            <div className="p-4 border-t bg-background">
              <div className="flex space-x-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sendMessage.isPending}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessage.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
              <p>Escolha uma conversa da lista para começar a visualizar as mensagens</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}