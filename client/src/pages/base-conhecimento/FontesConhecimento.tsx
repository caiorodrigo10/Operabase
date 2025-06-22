import { useState } from "react";
import { Search, Filter, FileText, ExternalLink, Upload, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function FontesConhecimento() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addStep, setAddStep] = useState<"select" | "form">("select");
  const [selectedType, setSelectedType] = useState<"text" | "pdf" | "url" | null>(null);
  const [textContent, setTextContent] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [urlContent, setUrlContent] = useState("");
  const [urlTitle, setUrlTitle] = useState("");

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
    switch (selectedType) {
      case "text":
        title = textTitle || "Texto sem título";
        break;
      case "url":
        title = urlTitle || "Link sem título";
        break;
      case "pdf":
        title = "Documento PDF";
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fontes de Conhecimento</h1>
          <p className="text-gray-600">
            Adicione informações através de diferentes formatos
          </p>
        </div>
        <Button onClick={handleOpenAddModal}>
          <Plus className="h-4 w-4 mr-2" />
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
              <div key={source.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  {getTypeIcon(source.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1">{source.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{source.preview}</p>
                  <p className="text-xs text-gray-500">Adicionado em {source.date}</p>
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
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all group"
                  onClick={() => handleTypeSelection("text")}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Texto Livre</h3>
                    <p className="text-sm text-gray-600">
                      Digite ou cole informações diretamente
                    </p>
                  </div>
                </div>

                {/* PDF Option */}
                <div 
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 cursor-pointer transition-all group"
                  onClick={() => handleTypeSelection("pdf")}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200 transition-colors">
                      <Upload className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Upload PDF</h3>
                    <p className="text-sm text-gray-600">
                      Importe documentos em formato PDF
                    </p>
                  </div>
                </div>

                {/* URL Option */}
                <div 
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 cursor-pointer transition-all group"
                  onClick={() => handleTypeSelection("url")}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                      <ExternalLink className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Link/URL</h3>
                    <p className="text-sm text-gray-600">
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
                      <label className="text-sm font-medium text-gray-900">
                        Título (opcional)
                      </label>
                      <Input
                        value={textTitle}
                        onChange={(e) => setTextTitle(e.target.value)}
                        placeholder="Ex: Protocolos de Atendimento"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900">
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
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        Arraste e solte arquivos PDF aqui ou
                      </p>
                      <Button variant="outline">
                        Selecionar Arquivos
                      </Button>
                      <p className="text-sm text-gray-500 mt-4">
                        Máximo 10MB por arquivo, apenas PDFs
                      </p>
                    </div>
                  </div>
                )}

                {selectedType === "url" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900">
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
                      <label className="text-sm font-medium text-gray-900">
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
  );
}