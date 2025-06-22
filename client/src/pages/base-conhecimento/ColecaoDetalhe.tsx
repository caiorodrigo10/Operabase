import { useState } from "react";
import { Search, Filter, FileText, ExternalLink, Upload, Plus, Edit, Trash2, ChevronLeft, X } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface RAGDocument {
  id: number;
  title: string;
  content_type: 'text' | 'url' | 'pdf';
  original_content: string;
  created_at: string;
  metadata?: {
    knowledge_base?: string;
    description?: string;
  };
}

interface KnowledgeItem {
  id: number;
  type: string;
  title: string;
  preview: string;
  date: string;
}

export default function ColecaoDetalhe() {
  const { toast } = useToast();
  const [match, params] = useRoute("/base-conhecimento/:id");
  const collectionId = params?.id;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addStep, setAddStep] = useState<"select" | "form">("select");
  const [selectedType, setSelectedType] = useState<"text" | "pdf" | "url" | null>(null);
  const [textContent, setTextContent] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [urlContent, setUrlContent] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const queryClient = useQueryClient();

  // Query para buscar documentos RAG
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['/api/rag/documents'],
    queryFn: async () => {
      const response = await fetch('/api/rag/documents');
      if (!response.ok) {
        throw new Error('Falha ao carregar documentos');
      }
      return response.json() as Promise<RAGDocument[]>;
    }
  });

  // Encontrar a coleção atual baseada no ID
  const knowledgeBaseGroups = documents.reduce((groups: Record<string, RAGDocument[]>, doc: RAGDocument) => {
    const knowledgeBase = doc.metadata?.knowledge_base || doc.title;
    if (!groups[knowledgeBase]) {
      groups[knowledgeBase] = [];
    }
    groups[knowledgeBase].push(doc);
    return groups;
  }, {});

  // Encontrar a coleção pelo ID hasheado
  const targetId = parseInt(collectionId || '0');
  const collection = Object.entries(knowledgeBaseGroups).find(([name]) => {
    const hashedId = Math.abs(name.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0));
    return hashedId === targetId;
  });

  const collectionData = collection ? {
    id: targetId,
    name: collection[0] as string,
    description: (collection[1] as RAGDocument[])[0]?.metadata?.description || `Base de conhecimento ${collection[0]}`,
    documents: collection[1] as RAGDocument[]
  } : null;

  // Converter documentos para o formato esperado pela interface
  const knowledgeItems: KnowledgeItem[] = collectionData?.documents.map((doc: RAGDocument) => ({
    id: doc.id,
    type: doc.content_type,
    title: doc.title,
    preview: doc.original_content?.substring(0, 100) + (doc.original_content?.length > 100 ? '...' : ''),
    date: new Date(doc.created_at).toLocaleDateString('pt-BR')
  })) || [];

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
    setSelectedFiles([]);
  };

  const handleTypeSelection = (type: "text" | "pdf" | "url") => {
    setSelectedType(type);
    setAddStep("form");
  };

  const handleBackToSelection = () => {
    setAddStep("select");
    setSelectedType(null);
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
      setSelectedFiles(pdfFiles);
      console.log('PDFs selecionados:', pdfFiles.map(f => f.name));
    }
  };

  const handleSaveContent = async () => {
    if (!collectionData) return;

    try {
      let payload;
      
      if (selectedType === "text") {
        if (!textContent.trim()) {
          toast({
            title: "Erro",
            description: "Por favor, digite o conteúdo do texto",
            variant: "destructive"
          });
          return;
        }
        
        payload = {
          knowledge_base: collectionData.name,
          title: textTitle || "Documento de Texto",
          content_type: "text",
          original_content: textContent
        };
      } else if (selectedType === "url") {
        if (!urlContent.trim()) {
          toast({
            title: "Erro",
            description: "Por favor, digite a URL",
            variant: "destructive"
          });
          return;
        }
        
        payload = {
          knowledge_base: collectionData.name,
          title: urlTitle || "Link",
          content_type: "url",
          source_url: urlContent
        };
      } else if (selectedType === "pdf") {
        if (selectedFiles.length === 0) {
          toast({
            title: "Erro",
            description: "Por favor, selecione um arquivo PDF",
            variant: "destructive"
          });
          return;
        }

        // Upload do PDF usando FormData
        const formData = new FormData();
        formData.append('knowledge_base', collectionData.name);
        formData.append('file', selectedFiles[0]);

        const response = await fetch('/api/rag/documents/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Falha no upload do PDF');
        }

        // Invalidar cache e fechar modal
        queryClient.invalidateQueries({ queryKey: ['/api/rag/documents'] });
        handleCloseAddModal();
        
        toast({
          title: "Sucesso",  
          description: "PDF enviado com sucesso!"
        });
        return;
      }

      const response = await fetch('/api/rag/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Falha ao adicionar documento');
      }

      // Invalidar cache e fechar modal
      queryClient.invalidateQueries({ queryKey: ['/api/rag/documents'] });
      handleCloseAddModal();
      
      toast({
        title: "Sucesso",
        description: "Documento adicionado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao adicionar documento:', error);
      toast({
        title: "Erro",
        description: "Falha ao adicionar documento",
        variant: "destructive"
      });
    }
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

  const filteredItems = knowledgeItems.filter((item: KnowledgeItem) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.preview.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === "all" || item.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando base de conhecimento...</p>
        </div>
      </div>
    );
  }

  if (!collectionData) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Base de conhecimento não encontrada</p>
        <Link href="/base-conhecimento">
          <Button variant="outline" className="mt-4">
            Voltar às Bases de Conhecimento
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/base-conhecimento" className="hover:text-gray-700 transition-colors">
            Base de Conhecimento
          </Link>
          <span>›</span>
          <span className="text-gray-900">{collectionData.name}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{collectionData.name}</h1>
            <p className="text-gray-600">{collectionData.description}</p>
          </div>
          <Button onClick={handleOpenAddModal}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Conhecimento
          </Button>
        </div>
      </div>

      {/* Content Section */}
      <Card>
        <CardHeader>
          <CardTitle>Itens da Base de Conhecimento</CardTitle>
          <CardDescription>
            Gerencie todo o conteúdo desta base de conhecimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar itens..."
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

          {/* Items List */}
          <div className="space-y-4">
            {filteredItems.map((item: KnowledgeItem) => (
              <div key={item.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{item.preview}</p>
                  <p className="text-xs text-gray-500">Adicionado em {item.date}</p>
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

          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum item encontrado</p>
            </div>
          )}
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
                        placeholder="Ex: Protocolo de Emergência"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900">
                        Conteúdo
                      </label>
                      <Textarea
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="Digite ou cole informações importantes..."
                        className="min-h-[200px]"
                      />
                    </div>
                  </>
                )}

                {selectedType === "pdf" && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        Arraste e solte arquivos PDF aqui ou
                      </p>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileSelection}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id="pdf-upload"
                        />
                        <Button variant="outline" className="pointer-events-none">
                          {selectedFiles.length > 0 ? `${selectedFiles.length} arquivo(s) selecionado(s)` : "Selecionar Arquivos"}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-4">
                        Máximo 10MB por arquivo, apenas PDFs
                      </p>
                    </div>
                    
                    {selectedFiles.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Arquivos selecionados:</h4>
                        <div className="space-y-2">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-red-600" />
                                <div>
                                  <p className="font-medium text-gray-900">{file.name}</p>
                                  <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                        placeholder="Ex: Diretrizes Oficiais"
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
                      (selectedType === "url" && !urlContent.trim()) ||
                      (selectedType === "pdf" && selectedFiles.length === 0)
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