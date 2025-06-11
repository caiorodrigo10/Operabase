import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChatViewer } from "@/components/ui/chat-viewer";
import { mockContacts, mockMessages } from "@/lib/mock-data";
import { Search, Bot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels = {
  novo: { label: "Novo contato", color: "bg-slate-100 text-slate-800" },
  em_conversa: { label: "Em conversa", color: "bg-blue-100 text-blue-800" },
  agendado: { label: "Agendado", color: "bg-green-100 text-green-800" },
  realizado: { label: "Realizado", color: "bg-purple-100 text-purple-800" },
  pos_atendimento: { label: "Pós-atendimento", color: "bg-emerald-100 text-emerald-800" },
};

export function Conversas() {
  const [selectedContact, setSelectedContact] = useState<number | null>(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const filteredContacts = mockContacts.filter(contact =>
    contact.phone.includes(searchTerm) || 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedContactData = mockContacts.find(c => c.id === selectedContact);
  const selectedContactMessages = mockMessages.filter(m => m.conversation_id === selectedContact);

  const getLastMessagePreview = (contactId: number) => {
    const lastMessage = mockMessages
      .filter(m => m.conversation_id === contactId)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())[0];
    
    if (!lastMessage) return "Sem mensagens";
    
    if (lastMessage.content.startsWith("[ÁUDIO]")) return "🎵 Mensagem de áudio";
    if (lastMessage.content.startsWith("[IMAGEM]")) return "📷 Imagem enviada";
    if (lastMessage.sender_type === "ai" && lastMessage.ai_action) return "🤖 Ação automática da IA";
    
    return lastMessage.content.length > 40 
      ? lastMessage.content.substring(0, 40) + "..."
      : lastMessage.content;
  };

  const getMessageCount = (contactId: number) => {
    return mockMessages.filter(m => m.conversation_id === contactId).length;
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Conversas</h1>
          <p className="text-slate-600">Acompanhe todas as interações da Livia IA em tempo real</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)]">
          <div className="lg:w-1/2 xl:w-2/5">
            <Card className="h-full animate-pulse">
              <CardContent className="p-6">
                <div className="h-full bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:w-1/2 xl:w-3/5">
            <Card className="h-full animate-pulse">
              <CardContent className="p-6">
                <div className="h-full bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Conversas</h1>
        <p className="text-slate-600">Acompanhe todas as interações da Livia IA em tempo real</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)]">
        {/* Conversations List */}
        <div className="lg:w-1/2 xl:w-2/5">
          <Card className="h-full">
            <CardHeader className="border-b border-slate-200">
              <CardTitle>Conversas Recentes</CardTitle>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar por número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {filteredContacts.map((contact) => {
                  const status = statusLabels[contact.status as keyof typeof statusLabels];
                  const isSelected = selectedContact === contact.id;
                  const timeAgo = formatDistanceToNow(contact.last_interaction!, { 
                    addSuffix: false, 
                    locale: ptBR 
                  });

                  const lastMessagePreview = getLastMessagePreview(contact.id);
                  const messageCount = getMessageCount(contact.id);

                  return (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact.id)}
                      className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                        isSelected ? "border-l-4 border-medical-blue bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-medical-blue rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-800">{contact.name}</h4>
                            <p className="text-xs text-slate-500">{contact.phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500">{timeAgo}</span>
                        </div>
                      </div>
                      
                      <div className="ml-13 mb-3">
                        <p className="text-sm text-slate-600 line-clamp-2">{lastMessagePreview}</p>
                      </div>
                      
                      <div className="flex items-center justify-between ml-13">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                        <div className="flex items-center space-x-2">
                          {contact.status === "agendado" && (
                            <Bot className="w-4 h-4 text-medical-blue" />
                          )}
                          {contact.status === "em_conversa" && (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Viewer */}
        <div className="lg:w-1/2 xl:w-3/5">
          <ChatViewer
            contact={selectedContactData ? {
              name: selectedContactData.name,
              phone: selectedContactData.phone,
              initials: selectedContactData.name.split(' ').map(n => n[0]).join('').toUpperCase(),
            } : undefined}
            messages={selectedContactMessages}
          />
        </div>
      </div>
    </div>
  );
}
