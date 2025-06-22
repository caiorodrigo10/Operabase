import { useState } from "react";
import { ChevronLeft, Search, Filter, FileText, ExternalLink, Upload, Plus, Edit, Trash2, Save, X, User } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function BaseConhecimento() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("knowledge-sources");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [editingProfessional, setEditingProfessional] = useState<number | null>(null);
  const [professionalInfo, setProfessionalInfo] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addStep, setAddStep] = useState<"select" | "form">("select");
  const [selectedType, setSelectedType] = useState<"text" | "pdf" | "url" | null>(null);
  const [textContent, setTextContent] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [urlContent, setUrlContent] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [companyInfo, setCompanyInfo] = useState(`Clínica Médica Exemplo

📍 Endereço: Rua das Flores, 123 - Centro - São Paulo/SP
📞 Telefone: (11) 3333-4444
📱 WhatsApp: (11) 99999-8888

🕒 Horários de Funcionamento:
Segunda a Sexta: 07h às 19h
Sábado: 08h às 16h
Domingo: Emergências apenas

🏥 Especialidades:
• Cardiologia
• Clínico Geral  
• Pediatria
• Ginecologia

💳 Convênios Aceitos:
• Unimed
• Bradesco Saúde
• SulAmérica
• Particular

🚗 Estacionamento gratuito disponível
🌟 Atendimento humanizado há mais de 20 anos`);

  // Mock data for knowledge sources
  const knowledgeSources = [
    {
      id: 1,
      type: "text",
      title: "Protocolos de Atendimento",
      preview: "Nossa clínica segue protocolos rigorosos de atendimento...",
      date: "15/01/2025"
    },
    {
      id: 2,
      type: "pdf",
      title: "Manual de Procedimentos.pdf",
      preview: "Documento com 15 páginas",
      date: "12/01/2025"
    },
    {
      id: 3,
      type: "url",
      title: "Site da Clínica",
      preview: "https://clinicaexemplo.com.br",
      date: "10/01/2025"
    }
  ];

  // Mock data for professionals
  const professionals = [
    {
      id: 1,
      name: "Dr. João Silva",
      specialty: "Cardiologista",
      avatar: "JS",
      hasInfo: true,
      infoPreview: "Especialista em arritmias cardíacas com mais de 15 anos de experiência...",
      lastUpdated: "20/01/2025"
    },
    {
      id: 2,
      name: "Dra. Maria Santos",
      specialty: "Clínico Geral",
      avatar: "MS",
      hasInfo: false,
      infoPreview: null,
      lastUpdated: null
    },
    {
      id: 3,
      name: "Dr. Carlos Lima",
      specialty: "Pediatria",
      avatar: "CL",
      hasInfo: true,
      infoPreview: "Atendimento especializado em pediatria, com foco em desenvolvimento infantil...",
      lastUpdated: "18/01/2025"
    },
    {
      id: 4,
      name: "Dra. Ana Costa",
      specialty: "Ginecologia",
      avatar: "AC",
      hasInfo: false,
      infoPreview: null,
      lastUpdated: null
    }
  ];

  const handleSaveProfessionalInfo = (professionalId: number) => {
    toast({
      title: "Informações salvas",
      description: "As informações do profissional foram atualizadas com sucesso.",
      variant: "default",
    });
    setEditingProfessional(null);
    setProfessionalInfo("");
  };

  const handleSaveCompanyInfo = () => {
    toast({
      title: "Informações da empresa salvas",
      description: "As informações da empresa foram atualizadas automaticamente.",
      variant: "default",
    });
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
    setAddStep("select");
    setSelectedType(null);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAddStep("select");
    setSelectedType(null);
    setTextContent("");
    setTextTitle("");
    setUrlContent("");
    setUrlTitle("");
  };

  const handleTypeSelection = (type: "text" | "pdf" | "url") => {
    setSelectedType(type);
    setAddStep("form");
  };

  const handleBackToSelection = () => {
    setAddStep("select");
    setSelectedType(null);
  };

  const handleSaveContent = () => {
    let title = "";
    let preview = "";

    switch (selectedType) {
      case "text":
        title = textTitle || "Texto sem título";
        preview = textContent.slice(0, 100) + "...";
        break;
      case "url":
        title = urlTitle || "Link sem título";
        preview = urlContent;
        break;
      case "pdf":
        title = "Documento PDF";
        preview = "Arquivo PDF carregado";
        break;
    }

    toast({
      title: "Conteúdo adicionado",
      description: `${title} foi adicionado à biblioteca de conhecimento.`,
      variant: "default",
    });

    handleCloseAddModal();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "text":
        return <FileText className="h-4 w-4" />;
      case "pdf":
        return <FileText className="h-4 w-4 text-red-600" />;
      case "url":
        return <ExternalLink className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const filteredSources = knowledgeSources.filter(source => {
    const matchesSearch = source.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         source.preview.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === "all" || source.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

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
            <Link href="/trabalhadores-digitais" className="hover:text-slate-700 transition-colors">
              Trabalhadores Digitais
            </Link>
            <span>›</span>
            <span className="text-slate-900">Base de Conhecimento</span>
          </div>

          {/* Page Title */}
          <div className="flex items-center gap-4 mb-2">
            <Link href="/trabalhadores-digitais">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">
              Base de Conhecimento
            </h1>
          </div>
          <p className="text-lg text-slate-600">
            Central de treinamento e informações para seus assistentes de IA
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="knowledge-sources">Fontes de Conhecimento</TabsTrigger>
            <TabsTrigger value="professionals">Profissionais</TabsTrigger>
            <TabsTrigger value="company">Empresa</TabsTrigger>
          </TabsList>

          {/* Tab 1: Knowledge Sources */}
          <TabsContent value="knowledge-sources" className="space-y-8">
            {/* Clean Header with Add Button */}
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Fontes de Conhecimento</h2>
                <p className="text-slate-600 mb-6">
                  Adicione informações através de diferentes formatos
                </p>
              </div>
              
              <Button 
                onClick={handleOpenAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg h-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                Adicionar Conhecimento
              </Button>
            </div>

            {/* Library Section */}
            <Card>
              <CardHeader>
                <CardTitle>Biblioteca de Conhecimento</CardTitle>
                <CardDescription>
                  Visualize e gerencie todo o conteúdo adicionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar na biblioteca..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="text">Textos</SelectItem>
                      <SelectItem value="pdf">PDFs</SelectItem>
                      <SelectItem value="url">URLs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Content List */}
                <div className="space-y-4">
                  {filteredSources.map((source) => (
                    <div key={source.id} className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        {getTypeIcon(source.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 mb-1">{source.title}</h4>
                        <p className="text-sm text-slate-600 mb-2">{source.preview}</p>
                        <p className="text-xs text-slate-500">Adicionado em {source.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Professionals */}
          <TabsContent value="professionals" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Informações dos Profissionais</CardTitle>
                <CardDescription>
                  Adicione informações específicas sobre cada profissional para personalizar o atendimento da IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Buscar profissional..." className="pl-9" />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Especialidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as especialidades</SelectItem>
                      <SelectItem value="cardiologia">Cardiologia</SelectItem>
                      <SelectItem value="clinico-geral">Clínico Geral</SelectItem>
                      <SelectItem value="pediatria">Pediatria</SelectItem>
                      <SelectItem value="ginecologia">Ginecologia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Professionals List */}
                <div className="space-y-4">
                  {professionals.map((professional) => (
                    <Card key={professional.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold">
                            {professional.avatar}
                          </div>

                          {/* Professional Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-900">{professional.name}</h4>
                              <Badge variant={professional.hasInfo ? "default" : "secondary"}>
                                {professional.hasInfo ? "Com informações" : "Precisa de informações"}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-3">{professional.specialty}</p>

                            {/* Information Preview */}
                            {professional.hasInfo && professional.infoPreview ? (
                              <div className="mb-3">
                                <p className="text-sm text-slate-700 line-clamp-2">{professional.infoPreview}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                  Última atualização: {professional.lastUpdated}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 mb-3">
                                Nenhuma informação adicionada ainda.
                              </p>
                            )}

                            {/* Edit Form */}
                            {editingProfessional === professional.id ? (
                              <div className="space-y-3">
                                <Textarea
                                  value={professionalInfo}
                                  onChange={(e) => setProfessionalInfo(e.target.value)}
                                  placeholder={`Inclua informações sobre ${professional.name} como: especialidades detalhadas, abordagem de atendimento, protocolos específicos, horários preferenciais, ou qualquer informação relevante para personalizar o atendimento da IA.`}
                                  className="min-h-[120px]"
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleSaveProfessionalInfo(professional.id)}
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    Salvar Informações
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => {
                                      setEditingProfessional(null);
                                      setProfessionalInfo("");
                                    }}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setEditingProfessional(professional.id);
                                  setProfessionalInfo(professional.infoPreview || "");
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                {professional.hasInfo ? "Editar Informações" : "Adicionar Informações"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Company */}
          <TabsContent value="company" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>
                  Adicione todas as informações relevantes sobre sua clínica para que a IA 
                  possa fornecer respostas precisas e personalizadas aos pacientes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Editor */}
                  <div className="lg:col-span-2 space-y-4">
                    <Textarea
                      value={companyInfo}
                      onChange={(e) => setCompanyInfo(e.target.value)}
                      placeholder="Digite ou cole as informações da sua clínica aqui..."
                      className="min-h-[400px] resize-none"
                    />
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500">
                        {companyInfo.length} caracteres
                      </p>
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-green-600">
                          Salvo automaticamente
                        </p>
                        <Button size="sm" onClick={handleSaveCompanyInfo}>
                          Salvar Agora
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">Sugestões do que incluir:</h4>
                    <div className="space-y-3">
                      {[
                        { icon: "📍", text: "Endereço completo e como chegar" },
                        { icon: "📞", text: "Telefones de contato e WhatsApp" },
                        { icon: "🕒", text: "Horários de funcionamento" },
                        { icon: "💳", text: "Convênios e formas de pagamento aceitas" },
                        { icon: "📋", text: "Especialidades e serviços oferecidos" },
                        { icon: "🚗", text: "Informações sobre estacionamento" },
                        { icon: "📱", text: "Redes sociais e site" },
                        { icon: "⭐", text: "Diferenciais e valores da clínica" }
                      ].map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                          <span className="text-lg">{suggestion.icon}</span>
                          <span className="text-sm text-slate-700">{suggestion.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Knowledge Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-2xl">
            {addStep === "select" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Escolha o tipo de conhecimento</DialogTitle>
                  <DialogDescription>
                    Selecione como você gostaria de adicionar informações
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                  {/* Text Option */}
                  <div 
                    className="p-6 border-2 border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all group"
                    onClick={() => handleTypeSelection("text")}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                        <FileText className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">Texto Livre</h3>
                      <p className="text-sm text-slate-600">
                        Digite ou cole informações diretamente
                      </p>
                    </div>
                  </div>

                  {/* PDF Option */}
                  <div 
                    className="p-6 border-2 border-slate-200 rounded-lg hover:border-red-300 hover:bg-red-50 cursor-pointer transition-all group"
                    onClick={() => handleTypeSelection("pdf")}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200 transition-colors">
                        <Upload className="h-8 w-8 text-red-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">Upload PDF</h3>
                      <p className="text-sm text-slate-600">
                        Importe documentos em formato PDF
                      </p>
                    </div>
                  </div>

                  {/* URL Option */}
                  <div 
                    className="p-6 border-2 border-slate-200 rounded-lg hover:border-green-300 hover:bg-green-50 cursor-pointer transition-all group"
                    onClick={() => handleTypeSelection("url")}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                        <ExternalLink className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">Link/URL</h3>
                      <p className="text-sm text-slate-600">
                        Adicione links de páginas web
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button variant="outline" onClick={handleCloseAddModal}>
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {selectedType === "text" && "Adicionar Texto"}
                    {selectedType === "pdf" && "Upload PDF"}
                    {selectedType === "url" && "Adicionar Link"}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-6">
                  {selectedType === "text" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-900">
                          Título (opcional)
                        </label>
                        <Input
                          value={textTitle}
                          onChange={(e) => setTextTitle(e.target.value)}
                          placeholder="Ex: Protocolos de Atendimento"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-900">
                          Conteúdo
                        </label>
                        <Textarea
                          value={textContent}
                          onChange={(e) => setTextContent(e.target.value)}
                          placeholder="Digite ou cole informações importantes sobre sua clínica..."
                          className="min-h-[200px]"
                        />
                      </div>
                    </>
                  )}

                  {selectedType === "pdf" && (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-slate-400 transition-colors">
                        <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600 mb-4">
                          Arraste e solte arquivos PDF aqui ou
                        </p>
                        <Button variant="outline">
                          Selecionar Arquivos
                        </Button>
                        <p className="text-sm text-slate-500 mt-4">
                          Máximo 10MB por arquivo, apenas PDFs
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedType === "url" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-900">
                          URL da página
                        </label>
                        <Input
                          value={urlContent}
                          onChange={(e) => setUrlContent(e.target.value)}
                          placeholder="https://exemplo.com/pagina-importante"
                          type="url"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-900">
                          Título (opcional)
                        </label>
                        <Input
                          value={urlTitle}
                          onChange={(e) => setUrlTitle(e.target.value)}
                          placeholder="Ex: Site da Clínica"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={handleBackToSelection}>
                    Voltar
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCloseAddModal}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSaveContent}
                      disabled={
                        (selectedType === "text" && !textContent.trim()) ||
                        (selectedType === "url" && !urlContent.trim())
                      }
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}