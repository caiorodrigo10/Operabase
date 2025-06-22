import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Brain, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Professional {
  id: number;
  name: string;
  email: string;
  role: string;
  is_professional: boolean;
}

interface KnowledgeBase {
  id: number;
  name: string;
  description: string;
  documentCount: number;
}

interface MaraConfig {
  professionalId: number;
  knowledgeBaseId?: number;
  knowledgeBaseName?: string;
  isActive: boolean;
  stats?: {
    documentCount: number;
    chunkCount: number;
    lastUpdated: string;
  };
}

export default function MaraAIConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();


  // Mock data for now - will be replaced with real API calls later
  const mockProfessionals: Professional[] = [
    { id: 4, name: "Dr. João Silva", email: "joao@clinica.com", role: "admin", is_professional: true },
    { id: 5, name: "Dra. Maria Santos", email: "maria@clinica.com", role: "usuario", is_professional: true },
    { id: 6, name: "Dr. Pedro Costa", email: "pedro@clinica.com", role: "usuario", is_professional: true },
  ];

  const mockKnowledgeBases: KnowledgeBase[] = [
    { id: 1, name: "Protocolos Cardíacos", description: "Protocolos e diretrizes de cardiologia", documentCount: 156 },
    { id: 2, name: "Base Médica Geral", description: "Conhecimento médico geral", documentCount: 89 },
    { id: 3, name: "Psicologia Clínica", description: "Materiais de psicologia e terapia", documentCount: 45 },
    { id: 4, name: "Dermatologia", description: "Estudos e protocolos dermatológicos", documentCount: 23 },
  ];

  const mockConfigs: Record<number, MaraConfig> = {
    4: { 
      professionalId: 4, 
      knowledgeBaseId: 1, 
      knowledgeBaseName: "Protocolos Cardíacos", 
      isActive: true,
      stats: { documentCount: 156, chunkCount: 2300, lastUpdated: "2025-01-22" }
    },
    6: { 
      professionalId: 6, 
      knowledgeBaseId: 2, 
      knowledgeBaseName: "Base Médica Geral", 
      isActive: true,
      stats: { documentCount: 89, chunkCount: 1200, lastUpdated: "2025-01-20" }
    },
  };

  const handleConnect = (professionalId: number, baseId: number) => {
    const baseName = mockKnowledgeBases.find(b => b.id === baseId)?.name;
    toast({
      title: "Base conectada",
      description: `${baseName} foi conectada ao profissional com sucesso`,
    });
  };

  const handleDisconnect = (professionalId: number) => {
    toast({
      title: "Base desconectada",
      description: "A base de conhecimento foi removida do profissional",
    });
  };

  const getStatusBadge = (config?: MaraConfig) => {
    if (!config || !config.knowledgeBaseId) {
      return <Badge variant="secondary" className="bg-slate-100 text-slate-600">⚪ Genérica</Badge>;
    }
    if (config.isActive) {
      return <Badge variant="default" className="bg-green-100 text-green-700">🟢 Ativa</Badge>;
    }
    return <Badge variant="destructive" className="bg-red-100 text-red-700">🔴 Erro</Badge>;
  };

  const getStatsText = (config?: MaraConfig) => {
    if (!config || !config.stats) return null;
    
    return (
      <div className="text-sm text-slate-500 mt-1">
        {config.stats.documentCount} documentos • {config.stats.chunkCount.toLocaleString()} chunks
      </div>
    );
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/trabalhadores-digitais">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Configuração Mara AI - Profissionais
          </h1>
          <p className="text-slate-600 mt-1">
            Gerencie as bases de conhecimento vinculadas a cada profissional
          </p>
        </div>
      </div>

      {/* Professional Cards */}
      <div className="space-y-6">
        {mockProfessionals.map((professional) => {
          const config = mockConfigs[professional.id];
          
          return (
            <Card key={professional.id} className="border border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Professional Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        {professional.name}
                      </h3>
                      <p className="text-sm text-slate-500 mb-3">
                        {professional.email}
                      </p>
                      
                      {/* Base Connection */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">Base conectada:</span>
                        </div>
                        <Select 
                          value={config?.knowledgeBaseId?.toString() || "none"}
                          onValueChange={(value) => {
                            if (value === "none") {
                              handleDisconnect(professional.id);
                            } else {
                              handleConnect(professional.id, parseInt(value));
                            }
                          }}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Selecionar base..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma (Mara Genérica)</SelectItem>
                            {mockKnowledgeBases.map((base) => (
                              <SelectItem key={base.id} value={base.id.toString()}>
                                📚 {base.name} ({base.documentCount} docs)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status and Stats */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">Status:</span>
                          {getStatusBadge(config)}
                        </div>
                        {getStatsText(config)}
                      </div>
                    </div>
                  </div>


                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="mt-8 border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Como funciona</h4>
              <p className="text-sm text-blue-700">
                Sem base de conhecimento conectada, a Mara AI funciona de forma genérica. 
                Ao conectar uma base específica, ela se torna especializada e pode responder 
                com informações mais precisas baseadas nos documentos da base selecionada.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}