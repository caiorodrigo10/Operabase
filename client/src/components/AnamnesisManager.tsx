import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Share, Printer, Trash2, MoreVertical, FileText, Clock, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AnamnesisViewer } from './AnamnesisViewer';
import { AnamnesisShareDialog } from './AnamnesisShareDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnamnesisResponse {
  id: number;
  template_id: number;
  template_name: string;
  status: 'pending' | 'completed';
  share_token: string;
  patient_name?: string;
  completed_at?: string;
  created_at: string;
  expires_at?: string;
}

interface AnamnesisManagerProps {
  contactId: number;
}

export function AnamnesisManager({ contactId }: AnamnesisManagerProps) {
  const [, setLocation] = useLocation();
  const [showViewer, setShowViewer] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedAnamnesis, setSelectedAnamnesis] = useState<AnamnesisResponse | null>(null);
  const queryClient = useQueryClient();

  // Fetch anamneses for the contact
  const { data: anamneses = [], isLoading } = useQuery({
    queryKey: ['/api/contacts', contactId, 'anamnesis'],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${contactId}/anamnesis`);
      if (!response.ok) throw new Error('Failed to fetch anamneses');
      return response.json();
    }
  });

  // Initialize default templates mutation
  const initTemplatesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/anamnesis/templates/init', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to initialize templates');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/anamnesis/templates'] });
    }
  });

  // Delete anamnesis mutation
  const deleteMutation = useMutation({
    mutationFn: async (anamnesisId: number) => {
      const response = await fetch(`/api/anamnesis/${anamnesisId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete anamnesis');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts', contactId, 'anamnesis'] });
    }
  });

  // Initialize templates on first load
  useEffect(() => {
    initTemplatesMutation.mutate();
  }, []);

  const handleCreateAnamnesis = () => {
    setLocation(`/contatos/${contactId}/preencher-anamnese`);
  };

  const handleViewAnamnesis = (anamnesis: AnamnesisResponse) => {
    setSelectedAnamnesis(anamnesis);
    setShowViewer(true);
  };

  const handleShareAnamnesis = (anamnesis: AnamnesisResponse) => {
    setSelectedAnamnesis(anamnesis);
    setShowShareDialog(true);
  };

  const handleDeleteAnamnesis = (anamnesis: AnamnesisResponse) => {
    if (window.confirm('Tem certeza que deseja excluir esta anamnese?')) {
      deleteMutation.mutate(anamnesis.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Preenchida
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Preenchimento solicitado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Anamneses</h2>
        <Button 
          onClick={handleCreateAnamnesis}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Preencher anamnese
        </Button>
      </div>

      {anamneses.length === 0 ? (
        <Card className="border border-slate-200">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                O paciente não tem anamneses preenchidas.
              </h3>
              <p className="text-slate-500 mb-4">
                Vamos criar a primeira?
              </p>
              <Button 
                onClick={handleCreateAnamnesis}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Preencher anamnese
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {anamneses.map((anamnesis: AnamnesisResponse) => (
            <Card key={anamnesis.id} className="border border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 
                        className="font-medium text-slate-900 hover:text-blue-600 cursor-pointer transition-colors"
                        onClick={() => setLocation(`/contatos/${contactId}/anamnese/${anamnesis.id}/editar`)}
                      >
                        {anamnesis.template_name}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-slate-500">
                          Criado hoje às {format(new Date(anamnesis.created_at), 'HH:mm', { locale: ptBR })}
                        </span>
                        {getStatusBadge(anamnesis.status)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {anamnesis.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleShareAnamnesis(anamnesis)}
                      >
                        Solicitar assinatura
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {anamnesis.status === 'completed' && (
                          <DropdownMenuItem onClick={() => handleViewAnamnesis(anamnesis)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Visualizar respostas
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleShareAnamnesis(anamnesis)}>
                          <Share className="w-4 h-4 mr-2" />
                          Compartilhar link
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Printer className="w-4 h-4 mr-2" />
                          Imprimir
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteAnamnesis(anamnesis)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}



      {/* Anamnesis Viewer Dialog */}
      <Dialog open={showViewer} onOpenChange={setShowViewer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Respostas da Anamnese</DialogTitle>
          </DialogHeader>
          {selectedAnamnesis && (
            <AnamnesisViewer 
              anamnesisId={selectedAnamnesis.id}
              onClose={() => setShowViewer(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Compartilhar link para preenchimento</DialogTitle>
          </DialogHeader>
          {selectedAnamnesis && (
            <AnamnesisShareDialog 
              anamnesis={selectedAnamnesis}
              onClose={() => setShowShareDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}