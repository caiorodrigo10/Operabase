import { Bot, Users, BarChart3, BookOpen, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function TrabalhadoresesDigitais() {
  const { toast } = useToast();

  const handleCardClick = (title: string, description: string) => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: `${title} estará disponível em breve`,
      variant: "default",
    });
  };

  const assistants = [
    {
      name: "Lívia",
      role: "Secretária Digital",
      description: "Especialista em atendimento ao paciente, agendamentos e organização da agenda médica",
      icon: Users,
      color: "blue",
      specialties: [
        "Agendamento automático de consultas",
        "Atendimento inicial via WhatsApp",
        "Gerenciamento de horários",
        "Lembretes e confirmações"
      ]
    },
    {
      name: "Iago",
      role: "Gestor de Tráfego",
      description: "Especialista em marketing digital, campanhas automatizadas e aquisição de novos pacientes",
      icon: BarChart3,
      color: "purple",
      specialties: [
        "Campanhas automatizadas no WhatsApp",
        "Segmentação de pacientes",
        "Follow-up pós-consulta",
        "Reativação de pacientes inativos"
      ]
    },
    {
      name: "Mara",
      role: "Assistente Profissional",
      description: "Especialista em suporte médico, protocolos clínicos e otimização de processos internos",
      icon: Bot,
      color: "green",
      specialties: [
        "Protocolos médicos automatizados",
        "Gestão de prontuários",
        "Relatórios e métricas",
        "Compliance e regulamentações"
      ]
    }
  ];

  const knowledgeBase = {
    name: "Base de Conhecimento",
    description: "Central de treinamento, configuração e aprimoramento dos assistentes de IA",
    icon: BookOpen,
    color: "orange",
    features: [
      "Biblioteca de protocolos médicos",
      "Templates de conversa personalizáveis",
      "Configurações de especialidade",
      "Histórico de aprendizado"
    ]
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: "bg-blue-50",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        border: "border-blue-200"
      },
      purple: {
        bg: "bg-purple-50",
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600",
        border: "border-purple-200"
      },
      green: {
        bg: "bg-green-50",
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        border: "border-green-200"
      },
      orange: {
        bg: "bg-orange-50",
        iconBg: "bg-orange-100",
        iconColor: "text-orange-600",
        border: "border-orange-200"
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="p-4 lg:p-6 h-screen overflow-hidden">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Trabalhadores Digitais</h1>
          <p className="text-sm text-gray-600">
            Assistentes de IA especializados para automatizar sua clínica
          </p>
        </div>
      </div>

      {/* Grid Layout - 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-120px)]">
        {/* Assistant Cards */}
        {assistants.map((assistant, index) => {
          const colors = getColorClasses(assistant.color);
          const Icon = assistant.icon;

          return (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col"
              onClick={() => handleCardClick(assistant.name, assistant.description)}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${colors.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${colors.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{assistant.name}</h3>
                  <p className="text-sm text-gray-600">{assistant.role}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {assistant.description}
              </p>

              {/* Specialties */}
              <div className="flex-1 mb-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Especialidades:</h4>
                <ul className="space-y-1">
                  {assistant.specialties.slice(0, 3).map((specialty, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span className="line-clamp-1">{specialty}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer */}
              <Button 
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(assistant.name, assistant.description);
                }}
              >
                Configurar {assistant.name}
              </Button>
            </div>
          );
        })}

        {/* Knowledge Base Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{knowledgeBase.name}</h3>
              <p className="text-sm text-gray-600">Central de Treinamento</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {knowledgeBase.description}
          </p>

          {/* Features */}
          <div className="flex-1 mb-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Recursos:</h4>
            <ul className="space-y-1">
              {knowledgeBase.features.slice(0, 3).map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                  <div className="w-1 h-1 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span className="line-clamp-1">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link href="/base-conhecimento" className="w-full">
            <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700 text-white">
              Acessar Base de Conhecimento
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}