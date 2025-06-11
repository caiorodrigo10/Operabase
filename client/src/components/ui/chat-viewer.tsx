import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Bot, Clock, Play, Image, Mic, FileText, AlertTriangle, Calendar, CheckCircle } from "lucide-react";
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

function getAIActionComponent(action: string) {
  const actionConfig = {
    agendou_consulta: {
      icon: Calendar,
      color: "green",
      title: "Consulta agendada automaticamente pela Livia IA",
      details: "Dr. Maria Silva - Amanhã às 14:00"
    },
    detectou_urgencia: {
      icon: AlertTriangle,
      color: "red",
      title: "Urgência detectada pela IA",
      details: "Consulta priorizada para hoje"
    },
    analisou_exame: {
      icon: FileText,
      color: "blue",
      title: "Exame analisado pela IA",
      details: "Encaminhado para avaliação médica"
    },
    pos_consulta_followup: {
      icon: CheckCircle,
      color: "purple",
      title: "Follow-up pós-consulta",
      details: "Acompanhamento automático da Livia"
    },
    agendou_retorno: {
      icon: Calendar,
      color: "green",
      title: "Retorno agendado",
      details: "Consulta de acompanhamento em 30 dias"
    },
    primeira_interacao: {
      icon: Bot,
      color: "blue",
      title: "Primeira interação",
      details: "Paciente recebido pela Livia IA"
    }
  };

  const config = actionConfig[action as keyof typeof actionConfig] || {
    icon: Bot,
    color: "blue",
    title: "Ação da IA",
    details: "Processamento automático"
  };

  const Icon = config.icon;
  const colorClasses = {
    green: "bg-green-50 border-green-200 text-green-800",
    red: "bg-red-50 border-red-200 text-red-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800"
  };

  return (
    <div className={`border rounded-lg p-3 max-w-md ${colorClasses[config.color as keyof typeof colorClasses]}`}>
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4" />
        <p className="text-sm font-medium">{config.title}</p>
      </div>
      <p className="text-xs mt-1">{config.details}</p>
    </div>
  );
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
                  {message.content.startsWith("[ÁUDIO]") ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                        <Mic className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-800 font-medium">Mensagem de áudio</p>
                        <p className="text-xs text-slate-500">{message.content.split(" - ")[1]}</p>
                      </div>
                      <button className="w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center hover:bg-slate-400 transition-colors">
                        <Play className="w-3 h-3 text-slate-700" />
                      </button>
                    </div>
                  ) : message.content.startsWith("[IMAGEM]") ? (
                    <div className="space-y-2">
                      <div className="w-full h-32 bg-slate-200 rounded-lg flex items-center justify-center">
                        <Image className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-800">{message.content.split(" - ")[1]}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-800">{message.content}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
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
                {getAIActionComponent(message.ai_action)}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
