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
    <div className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-slate-700 transition-colors">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-slate-900">Trabalhadores Digitais</span>
          </div>

          {/* Page Title */}
          <div className="flex items-center gap-4 mb-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">
              Trabalhadores Digitais
            </h1>
          </div>
          <p className="text-lg text-slate-600">
            Assistentes de IA especializados para automatizar sua clínica
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Assistants Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Seus Assistentes de IA
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Equipe digital pronta para automatizar processos e otimizar resultados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {assistants.map((assistant, index) => {
              const colors = getColorClasses(assistant.color);
              const Icon = assistant.icon;

              return (
                <div
                  key={index}
                  className={`relative group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                  onClick={() => handleCardClick(assistant.name, assistant.description)}
                >
                  <div className={`bg-white rounded-2xl border ${colors.border} p-8 h-full shadow-sm`}>
                    {/* Header */}
                    <div className="text-center mb-6">
                      <div className={`w-16 h-16 ${colors.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                        <Icon className={`h-8 w-8 ${colors.iconColor}`} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">
                        {assistant.name}
                      </h3>
                      <p className="text-sm font-medium text-slate-600 mb-3">
                        {assistant.role}
                      </p>
                      <div className="w-8 h-1 bg-green-500 rounded-full mx-auto">
                        <div className="w-2 h-1 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-slate-600 text-center mb-6 leading-relaxed">
                      {assistant.description}
                    </p>

                    {/* Specialties */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900 mb-3">
                        Especialidades:
                      </h4>
                      <ul className="space-y-2">
                        {assistant.specialties.slice(0, 3).map((specialty, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span>{specialty}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <Button 
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(assistant.name, assistant.description);
                        }}
                      >
                        Configurar {assistant.name}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Knowledge Base Section */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Base de Conhecimento
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Centro de treinamento e configuração dos assistentes
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div
            className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl"
            onClick={() => handleCardClick(knowledgeBase.name, knowledgeBase.description)}
          >
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 p-8 shadow-sm">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* Icon */}
                <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-10 w-10 text-orange-600" />
                </div>

                {/* Content */}
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    {knowledgeBase.name}
                  </h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    {knowledgeBase.description}
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {knowledgeBase.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0"></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="bg-orange-600 hover:bg-orange-700 text-white px-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(knowledgeBase.name, knowledgeBase.description);
                    }}
                  >
                    Acessar Base de Conhecimento
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}