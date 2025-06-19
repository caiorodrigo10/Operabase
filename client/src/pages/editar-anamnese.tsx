import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Edit, Trash2, GripVertical, Search } from 'lucide-react';
import { useLocation, useRoute } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

interface Question {
  id: string;
  text: string;
  type: 'sim_nao_nao_sei' | 'sim_nao_nao_sei_texto' | 'somente_texto';
  required: boolean;
  showAlert?: boolean;
  alertText?: string;
  hasAdditional?: boolean;
  active?: boolean;
}

interface Template {
  id: number;
  name: string;
  description: string;
  fields: {
    questions: Question[];
  };
}

export default function EditarAnamnesePage() {
  const [, params] = useRoute('/anamneses/:id/editar');
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const templateId = params?.id;
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState<{
    pergunta: string;
    tipo: 'sim_nao_nao_sei' | 'sim_nao_nao_sei_texto' | 'somente_texto';
    showAlert: boolean;
    alertText: string;
    addToAllTemplates: boolean;
  }>({
    pergunta: '',
    tipo: 'somente_texto',
    showAlert: false,
    alertText: '',
    addToAllTemplates: false
  });

  // Buscar template
  const { data: template, isLoading } = useQuery({
    queryKey: ['/api/anamneses', templateId, 'editar'],
    queryFn: async () => {
      const response = await fetch(`/api/anamneses/${templateId}/editar`);
      if (!response.ok) throw new Error('Failed to fetch template');
      return response.json();
    },
    enabled: !!templateId
  });

  // Mutation para adicionar pergunta
  const addQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/anamneses/${templateId}/perguntas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to add question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/anamneses', templateId, 'editar'] });
      setIsAddQuestionOpen(false);
      resetQuestionForm();
    }
  });

  // Mutation para editar pergunta
  const editQuestionMutation = useMutation({
    mutationFn: async ({ questionId, data }: { questionId: string; data: any }) => {
      const response = await fetch(`/api/anamneses/${templateId}/perguntas/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to edit question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/anamneses', templateId, 'editar'] });
      setEditingQuestion(null);
      resetQuestionForm();
    }
  });

  // Mutation para remover pergunta
  const removeQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const response = await fetch(`/api/anamneses/${templateId}/perguntas/${questionId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to remove question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/anamneses', templateId, 'editar'] });
    }
  });

  const resetQuestionForm = () => {
    setQuestionForm({
      pergunta: '',
      tipo: 'somente_texto',
      showAlert: false,
      alertText: '',
      addToAllTemplates: false
    });
  };

  const handleAddQuestion = () => {
    if (!questionForm.pergunta.trim()) return;

    addQuestionMutation.mutate({
      pergunta: questionForm.pergunta.trim(),
      tipo: questionForm.tipo,
      showAlert: questionForm.showAlert,
      alertText: questionForm.alertText,
      addToAllTemplates: questionForm.addToAllTemplates
    });
  };

  const handleEditQuestion = () => {
    if (!editingQuestion || !questionForm.pergunta.trim()) return;

    editQuestionMutation.mutate({
      questionId: editingQuestion.id,
      data: {
        pergunta: questionForm.pergunta.trim(),
        tipo: questionForm.tipo,
        showAlert: questionForm.showAlert,
        alertText: questionForm.alertText
      }
    });
  };

  const handleRemoveQuestion = (questionId: string) => {
    if (confirm('Tem certeza que deseja remover esta pergunta?')) {
      removeQuestionMutation.mutate(questionId);
    }
  };

  const openEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      pergunta: question.text,
      tipo: question.type,
      showAlert: question.showAlert || false,
      alertText: question.alertText || '',
      addToAllTemplates: false
    });
    setIsAddQuestionOpen(true);
  };

  const openAddQuestion = () => {
    setEditingQuestion(null);
    resetQuestionForm();
    setIsAddQuestionOpen(true);
  };

  const questions = template?.fields?.questions || [];
  const filteredQuestions = questions.filter((q: Question) =>
    q.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando modelo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-600">Modelo não encontrado</p>
          <Button onClick={() => setLocation('/anamneses')} className="mt-4">
            Voltar aos modelos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/anamneses')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">{template.name}</h1>
          <Edit className="w-5 h-5 text-gray-400" />
        </div>
        
        <Dialog open={isAddQuestionOpen} onOpenChange={setIsAddQuestionOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddQuestion} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar pergunta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? 'Editar pergunta de anamnese' : 'Nova pergunta de anamnese'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="question-text">* Pergunta</Label>
                <Input
                  id="question-text"
                  value={questionForm.pergunta}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, pergunta: e.target.value }))}
                  placeholder="Ex: Usa alguma medicação controlada?"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Tipo de resposta</Label>
                <Select 
                  value={questionForm.tipo} 
                  onValueChange={(value: any) => setQuestionForm(prev => ({ ...prev, tipo: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="somente_texto">Somente texto</SelectItem>
                    <SelectItem value="sim_nao_nao_sei">Sim / Não / Não sei</SelectItem>
                    <SelectItem value="sim_nao_nao_sei_texto">Sim / Não / Não sei e Texto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-alert"
                  checked={questionForm.showAlert}
                  onCheckedChange={(checked) => setQuestionForm(prev => ({ ...prev, showAlert: !!checked }))}
                />
                <Label htmlFor="show-alert">Exibir alerta no prontuário do paciente</Label>
              </div>

              {questionForm.showAlert && (
                <div>
                  <Label htmlFor="alert-text">Texto exibido no alerta</Label>
                  <Textarea
                    id="alert-text"
                    value={questionForm.alertText}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, alertText: e.target.value }))}
                    placeholder="Texto que aparecerá no alerta..."
                    className="mt-1"
                  />
                </div>
              )}

              {!editingQuestion && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="add-to-all"
                    checked={questionForm.addToAllTemplates}
                    onCheckedChange={(checked) => setQuestionForm(prev => ({ ...prev, addToAllTemplates: !!checked }))}
                  />
                  <Label htmlFor="add-to-all">Adicionar esta pergunta em todos os modelos de anamnese</Label>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddQuestionOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={editingQuestion ? handleEditQuestion : handleAddQuestion}
                  disabled={!questionForm.pergunta.trim() || addQuestionMutation.isPending || editQuestionMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editingQuestion ? 'Salvar alterações' : 'Salvar pergunta'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar"
            className="pl-10"
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm ? 'Nenhuma pergunta encontrada' : 'Nenhuma pergunta adicionada ainda'}
            </p>
            {!searchTerm && (
              <Button onClick={openAddQuestion} className="mt-4">
                Adicionar primeira pergunta
              </Button>
            )}
          </div>
        ) : (
          filteredQuestions.map((question: Question) => (
            <Card key={question.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                  
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{question.text}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Tipo: {
                        question.type === 'somente_texto' ? 'Somente texto' :
                        question.type === 'sim_nao_nao_sei' ? 'Sim / Não / Não sei' :
                        'Sim / Não / Não sei e Texto'
                      }
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={question.active !== false}
                        onCheckedChange={() => {}}
                      />
                      <span className="text-sm text-gray-600">Ativo</span>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditQuestion(question)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRemoveQuestion(question.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}