import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, Edit } from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { ConfiguracoesLayout } from './index';

interface AnamnesisTemplate {
  id: number;
  name: string;
  description: string;
  question_count: number;
  created_at: string;
  updated_at: string;
}

export default function ConfiguracoesAnamnesisPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    copyFromId: '',
    createFromScratch: true
  });

  // Buscar modelos de anamnese
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/anamneses'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/anamneses', {
        headers,
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    }
  });

  // Criar novo modelo
  const createMutation = useMutation({
    mutationFn: async (templateData: any) => {
      return apiRequest('/api/anamneses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/anamneses'] });
      setIsCreateDialogOpen(false);
      setCreateForm({ name: '', copyFromId: '', createFromScratch: true });
    }
  });

  const handleCreateTemplate = () => {
    const templateData = {
      name: createForm.name,
      copyFromId: createForm.createFromScratch ? null : createForm.copyFromId,
      description: `Modelo de anamnese: ${createForm.name}`
    };
    createMutation.mutate(templateData);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <ConfiguracoesLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Modelos de Anamnese</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie os modelos de anamnese da sua clínica.
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Modelo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Modelo de Anamnese</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Modelo</Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Digite o nome do modelo"
                  />
                </div>
                
                <div>
                  <Label>Tipo de Criação</Label>
                  <RadioGroup
                    value={createForm.createFromScratch ? 'scratch' : 'copy'}
                    onValueChange={(value) => 
                      setCreateForm({ ...createForm, createFromScratch: value === 'scratch' })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="scratch" id="scratch" />
                      <Label htmlFor="scratch">Criar do zero</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="copy" id="copy" />
                      <Label htmlFor="copy">Copiar de modelo existente</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {!createForm.createFromScratch && (
                  <div>
                    <Label htmlFor="copyFrom">Copiar de</Label>
                    <Select
                      value={createForm.copyFromId}
                      onValueChange={(value) => setCreateForm({ ...createForm, copyFromId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template: AnamnesisTemplate) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateTemplate}
                    disabled={!createForm.name || createMutation.isPending}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {createMutation.isPending ? 'Criando...' : 'Criar Modelo'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template: AnamnesisTemplate) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-teal-600" />
                    {template.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {template.question_count} perguntas
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.description || 'Sem descrição'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Criado em {formatDate(template.created_at)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/configuracoes/anamneses/${template.id}/editar`)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && templates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum modelo encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              Comece criando seu primeiro modelo de anamnese.
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Modelo
            </Button>
          </div>
        )}
      </div>
    </ConfiguracoesLayout>
  );
}