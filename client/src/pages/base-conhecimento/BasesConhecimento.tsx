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

export default function BasesConhecimento() {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");

  // Mock data for knowledge base collections
  const collections = [
    {
      id: 1,
      name: "Protocolos de Atendimento",
      description: "Protocolos médicos e procedimentos padrão da clínica",
      itemCount: 5,
      lastUpdated: "20/01/2025",
      items: [
        { type: "text", name: "Protocolo de Triagem" },
        { type: "pdf", name: "Manual de Emergências.pdf" },
        { type: "url", name: "Diretrizes CFM" }
      ]
    },
    {
      id: 2,
      name: "Informações da Clínica",
      description: "Dados gerais, políticas e informações sobre a clínica",
      itemCount: 3,
      lastUpdated: "18/01/2025",
      items: [
        { type: "url", name: "Site da Clínica" },
        { type: "text", name: "Políticas de Agendamento" },
        { type: "text", name: "Convênios Aceitos" }
      ]
    },
    {
      id: 3,
      name: "Cardiologia",
      description: "Conhecimentos específicos sobre cardiologia",
      itemCount: 7,
      lastUpdated: "15/01/2025",
      items: [
        { type: "pdf", name: "Diretrizes de Hipertensão.pdf" },
        { type: "pdf", name: "Protocolos de ECG.pdf" },
        { type: "url", name: "Portal da Cardiologia" }
      ]
    }
  ];

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;

    toast({
      title: "Base de conhecimento criada",
      description: `${newCollectionName} foi criada com sucesso.`,
      variant: "default",
    });

    setIsCreateModalOpen(false);
    setNewCollectionName("");
    setNewCollectionDescription("");
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
                      {collection.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                          {getItemIcon(item.type)}
                          <span className="truncate">{item.name}</span>
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