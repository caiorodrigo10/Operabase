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

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
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
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
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

                  return (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact.id)}
                      className={`p-4 hover:bg-slate-50 cursor-pointer ${
                        isSelected ? "border-l-4 border-medical-blue bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-800">{contact.name}</h4>
                        <span className="text-xs text-slate-500">{timeAgo}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{contact.phone}</p>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                        {contact.status === "agendado" && (
                          <Bot className="w-4 h-4 text-medical-blue" title="Ação da IA" />
                        )}
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
