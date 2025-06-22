import { useState } from "react";
import { Plus, BookOpen, ExternalLink, FileText, Calendar, Edit, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface RAGDocument {
  id: number;
  title: string;
  content_type: 'text' | 'url' | 'pdf';
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

interface Collection {
  id: number;
  name: string;
  description: string;
  itemCount: number;
  lastUpdated: string;
  documents: RAGDocument[];
}

export default function BasesConhecimento() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");

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

  // Mutation para criar nova base de conhecimento
  const createKnowledgeBaseMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const response = await fetch('/api/rag/knowledge-bases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao criar base de conhecimento');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rag/documents'] });
      setIsCreateModalOpen(false);
      setNewCollectionName("");
      setNewCollectionDescription("");
      toast({
        title: "Sucesso",
        description: "Base de conhecimento criada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao criar base de conhecimento",
        variant: "destructive"
      });
    }
  });

  // Agrupar documentos reais por knowledge_base metadata
  const knowledgeBaseGroups = documents.reduce((groups: any, doc) => {
    const knowledgeBase = doc.metadata?.knowledge_base || doc.title;
    if (!groups[knowledgeBase]) {
      groups[knowledgeBase] = [];
    }
    groups[knowledgeBase].push(doc);
    return groups;
  }, {});

  const collections: Collection[] = Object.entries(knowledgeBaseGroups).map(([name, docs]: [string, any]) => ({
    id: Math.abs(name.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)),
    name,
    description: docs[0]?.metadata?.description || `Base de conhecimento ${name}`,
    itemCount: docs.length,
    lastUpdated: docs.length > 0 ? new Date(Math.max(...docs.map((d: any) => new Date(d.updated_at).getTime()))).toLocaleDateString('pt-BR') : "Sem dados",
    documents: docs
  }));

  // Mutation para criar nova coleção (simulado por enquanto)
  const createCollectionMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      // Por enquanto, só mostrar toast
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Base de conhecimento criada",
        description: `${data.name} foi criada com sucesso.`,
      });
      setIsCreateModalOpen(false);
      setNewCollectionName("");
      setNewCollectionDescription("");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando bases de conhecimento...</p>
        </div>
      </div>
    );
  }

  // Remover coleções vazias
  const visibleCollections = collections.filter(collection => collection.itemCount > 0 || collection.id <= 3);

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;
    
    createKnowledgeBaseMutation.mutate({
      name: newCollectionName,
      description: newCollectionDescription
    });
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-3 w-3 text-red-600" />;
      case "url":
        return <ExternalLink className="h-3 w-3 text-blue-600" />;
      default:
        return <FileText className="h-3 w-3 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bases de Conhecimento</h1>
          <p className="text-gray-600">
            Organize informações em bases de conhecimento temáticas
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Base de Conhecimento
        </Button>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <Link key={collection.id} href={`/base-conhecimento/${collection.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg group-hover:text-blue-700 transition-colors">
                      {collection.name}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {collection.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="text-xs">
                        {collection.itemCount} itens
                      </Badge>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {collection.lastUpdated}
                      </span>
                    </div>
                  </div>

                  {/* Preview Items */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700">Conteúdo:</p>
                    <div className="space-y-1">
                      {collection.documents.slice(0, 3).map((doc, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                          {getItemIcon(doc.content_type)}
                          <span className="truncate">{doc.title}</span>
                          <Badge 
                            variant={doc.processing_status === 'completed' ? 'default' : 'secondary'}
                            className="text-xs px-1 py-0"
                          >
                            {doc.processing_status}
                          </Badge>
                        </div>
                      ))}
                      {collection.itemCount > 3 && (
                        <div className="text-xs text-gray-500">
                          +{collection.itemCount - 3} mais itens
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {collections.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma base de conhecimento
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Comece criando sua primeira base de conhecimento para organizar informações por tema ou especialidade.
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeira Base
          </Button>
        </div>
      )}

      {/* Create Collection Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Base de Conhecimento</DialogTitle>
            <DialogDescription>
              Organize informações relacionadas em uma base temática
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Nome da base *
              </label>
              <Input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Ex: Protocolos de Atendimento"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Descrição (opcional)
              </label>
              <Textarea
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder="Descreva o tipo de informação que será armazenada..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim()}
            >
              Criar Base
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}