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
    <div className="p-4 lg:p-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trabalhadores Digitais</h1>
          <p className="text-gray-600">
            Assistentes de IA especializados para automatizar sua clínica
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Assistants Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Seus Assistentes de IA
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assistants.map((assistant, index) => {
              const colors = getColorClasses(assistant.color);
              const Icon = assistant.icon;

              return (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleCardClick(assistant.name, assistant.description)}
                >
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 ${colors.iconBg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${colors.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{assistant.name}</h3>
                      <p className="text-sm text-gray-600">{assistant.role}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {assistant.description}
                  </p>

                  {/* Specialties */}
                  <div className="space-y-2 mb-6">
                    <h4 className="text-sm font-medium text-gray-900">Especialidades:</h4>
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
          </div>
        </div>

        {/* Knowledge Base Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Base de Conhecimento
          </h2>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-6">
              {/* Icon */}
              <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-8 w-8 text-orange-600" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {knowledgeBase.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {knowledgeBase.description}
                </p>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
                  {knowledgeBase.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1 h-1 bg-orange-500 rounded-full flex-shrink-0"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Link href="/base-conhecimento">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    Acessar Base de Conhecimento
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}