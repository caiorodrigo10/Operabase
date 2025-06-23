import { useState, useEffect } from "react";
import { ConversationsSidebar } from "@/components/features/conversas/ConversationsSidebar";
import { MainConversationArea } from "@/components/features/conversas/MainConversationArea";
import { PatientInfoPanel } from "@/components/features/conversas/PatientInfoPanel";
import { useConversations, useConversationDetail, useSendMessage, useMarkAsRead } from '@/hooks/useConversations';
import { Conversation, TimelineItem, PatientInfo } from "@/types/conversations";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';

export default function ConversasPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | undefined>();
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [currentPatientInfo, setCurrentPatientInfo] = useState<PatientInfo | undefined>();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showPatientInfo, setShowPatientInfo] = useState(false);
  const { toast } = useToast();

  // Backend hooks
  const { data: conversationsData, isLoading: loadingConversations } = useConversations('active');
  const { data: conversationDetail, isLoading: loadingDetail } = useConversationDetail(selectedConversationId || null);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();

  // Handle responsive layout
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1200);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Auto-select first conversation on load
  useEffect(() => {
    if (conversationsData?.conversations.length > 0 && !selectedConversationId) {
      handleConversationSelect(conversationsData.conversations[0].id);
    }
  }, [conversationsData, selectedConversationId]);

  // Convert backend data to frontend format
  const convertToFrontendConversations = (): Conversation[] => {
    if (!conversationsData?.conversations) return [];
    
    return conversationsData.conversations.map(conv => ({
      id: conv.id,
      patient_name: conv.contact_name || 'Contato sem nome',
      patient_avatar: undefined,
      last_message: conversationDetail?.messages[conversationDetail.messages.length - 1]?.content || 'Sem mensagens',
      timestamp: new Date(conv.last_activity_at || conv.created_at).toISOString(),
      unread_count: conv.unread_count,
      status: conv.status === 'active' ? 'active' : 'inactive',
      ai_active: false,
      has_pending_appointment: false
    }));
  };

  // Convert backend messages to timeline format
  useEffect(() => {
    if (conversationDetail?.messages) {
      const timeline: TimelineItem[] = conversationDetail.messages.map(msg => ({
        id: msg.id,
        type: 'message',
        timestamp: msg.created_at,
        data: {
          id: msg.id,
          conversation_id: msg.conversation_id,
          type: msg.direction === 'outbound' ? 'sent_user' : 'received',
          content: msg.content || '',
          timestamp: msg.created_at,
          sender_name: msg.sender_name,
          sender_avatar: undefined,
          media_type: msg.message_type !== 'text' ? msg.message_type as any : undefined,
          media_url: undefined,
          media_filename: undefined,
          media_size: undefined,
          media_duration: undefined,
          media_thumbnail: undefined
        }
      }));
      
      setTimelineItems(timeline);
    }
  }, [conversationDetail]);

  const handleConversationSelect = async (conversationId: number) => {
    setSelectedConversationId(conversationId);
    
    // Create patient info from conversation data
    const conversation = conversationsData?.conversations.find(c => c.id === conversationId);
    if (conversation) {
      setCurrentPatientInfo({
        id: conversation.contact_id,
        name: conversation.contact_name || 'Contato sem nome',
        phone: conversation.contact_phone || '',
        email: conversation.contact_email || '',
        avatar: undefined,
        last_appointment: undefined,
        recent_appointments: []
      });

      // Mark as read if has unread messages
      if (conversation.unread_count > 0) {
        try {
          await markAsRead.mutateAsync(conversationId);
        } catch (error) {
          console.error('Erro ao marcar como lida:', error);
        }
      }
    }
    
    // Close patient info panel on mobile when selecting conversation
    if (isMobile) {
      setShowPatientInfo(false);
    }
  };

  const handleSendMessage = async (message: string, isNote?: boolean) => {
    if (!selectedConversationId) return;

    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId,
        message: {
          content: message,
          sender_type: isNote ? 'system' : 'professional',
          message_type: 'text',
          direction: 'outbound'
        }
      });
      
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

  const conversations = convertToFrontendConversations();

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {!selectedConversationId ? (
          <ConversationsSidebar
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onConversationSelect={handleConversationSelect}
          />
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Mobile Header with Back Button */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedConversationId(undefined)}
                className="text-blue-600"
              >
                ← Voltar
              </Button>
              
              {currentPatientInfo && (
                <h1 className="font-semibold text-gray-900 truncate">
                  {currentPatientInfo.name}
                </h1>
              )}
              
              <Sheet open={showPatientInfo} onOpenChange={setShowPatientInfo}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Info className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-96">
                  <PatientInfoPanel patientInfo={currentPatientInfo} />
                </SheetContent>
              </Sheet>
            </div>

            <MainConversationArea
              timelineItems={timelineItems}
              patientInfo={currentPatientInfo}
              onSendMessage={handleSendMessage}
            />
          </div>
        )}
      </div>
    );
  }

  // Tablet Layout
  if (isTablet) {
    return (
      <div className="h-full flex bg-gray-50">
        <div className="w-80 flex-shrink-0">
          <ConversationsSidebar
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onConversationSelect={handleConversationSelect}
          />
        </div>
        
        <div className="flex-1 flex">
          <MainConversationArea
            timelineItems={timelineItems}
            patientInfo={currentPatientInfo}
            onSendMessage={handleSendMessage}
            showInfoButton={true}
            onInfoClick={() => setShowPatientInfo(true)}
          />
          
          <Dialog open={showPatientInfo} onOpenChange={setShowPatientInfo}>
            <DialogContent className="max-w-md">
              <PatientInfoPanel patientInfo={currentPatientInfo} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // Desktop Layout (3-column)
  return (
    <div className="h-full flex bg-gray-50">
      <div className="w-80 flex-shrink-0">
        <ConversationsSidebar
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onConversationSelect={handleConversationSelect}
        />
      </div>
      
      <div className="flex-1">
        <MainConversationArea
          timelineItems={timelineItems}
          patientInfo={currentPatientInfo}
          onSendMessage={handleSendMessage}
        />
      </div>
      
      <div className="w-80 flex-shrink-0 border-l border-gray-200">
        <PatientInfoPanel patientInfo={currentPatientInfo} />
      </div>
    </div>
  );
}