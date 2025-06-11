import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Bot, Clock } from "lucide-react";
import { Message } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChatViewerProps {
  contact?: {
    name: string;
    phone: string;
    initials: string;
  };
  messages: Message[];
}

export function ChatViewer({ contact, messages }: ChatViewerProps) {
  if (!contact) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-slate-500">
            <p>Selecione uma conversa para visualizar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-medical-blue rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">{contact.initials}</span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{contact.name}</h3>
            <p className="text-sm text-slate-500">{contact.phone}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className="space-y-4">
            {message.sender_type === "patient" ? (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-lg rounded-tl-none p-3 max-w-xs">
                  <p className="text-sm text-slate-800">{message.content}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {format(message.timestamp!, "HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <div className="bg-medical-blue rounded-lg rounded-tr-none p-3 max-w-xs">
                  <p className="text-sm text-white">{message.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-blue-100">
                      {format(message.timestamp!, "HH:mm", { locale: ptBR })}
                    </p>
                    <Bot className="w-3 h-3 text-blue-100" />
                  </div>
                </div>
              </div>
            )}

            {message.ai_action && (
              <div className="flex justify-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-w-md">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-medical-green" />
                    <p className="text-sm font-medium text-green-800">
                      {message.ai_action === "agendou_consulta" && "Consulta agendada automaticamente pela Livia IA"}
                    </p>
                  </div>
                  <p className="text-xs text-green-600 mt-1">Dr. Maria Silva - Amanhã às 14:00</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
