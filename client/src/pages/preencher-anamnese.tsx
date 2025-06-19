import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { ArrowLeft, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface AnamnesisTemplate {
  id: number;
  name: string;
  description: string;
  fields: {
    questions: Array<{
      id: string;
      text: string;
      type: 'text' | 'textarea' | 'select' | 'radio' | 'date' | 'email' | 'phone';
      options?: string[];
      required: boolean;
    }>;
  };
}

interface Contact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

export default function PreencherAnamnese() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const contactId = parseInt(params.contactId || '0');
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Get contact info
  const { data: contact } = useQuery<Contact>({
    queryKey: ['/api/contacts', contactId],
    enabled: !!contactId
  });

  // Get available templates
  const { data: templates = [] } = useQuery<AnamnesisTemplate[]>({
    queryKey: ['/api/anamnesis/templates'],
    queryFn: async () => {
      const response = await fetch('/api/anamnesis/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    }
  });

  // Get selected template details
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Initialize patient info from contact
  useEffect(() => {
    if (contact) {
      setPatientInfo({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || ''
      });
    }
  }, [contact]);

  // Auto-select default template (Anamnese Geral)
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      const defaultTemplate = templates.find(t => t.name === 'Anamnese Geral') || templates[0];
      setSelectedTemplateId(defaultTemplate.id);
    }
  }, [templates, selectedTemplateId]);

  // Create anamnesis mutation
  const createAnamnesisMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/contacts/${contactId}/anamnesis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar anamnese');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Anamnese criada com sucesso",
        description: "O link foi gerado e está pronto para ser enviado ao paciente."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts', contactId, 'anamnesis'] });
      setLocation(`/contatos/${contactId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar anamnese",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    }
  });

  const handleBack = () => {
    setLocation(`/contatos/${contactId}`);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(parseInt(templateId));
    setResponses({});
  };

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handlePatientInfoChange = (field: string, value: string) => {
    setPatientInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (!selectedTemplateId) {
      toast({
        title: "Selecione um modelo",
        description: "Escolha um modelo de anamnese para continuar",
        variant: "destructive"
      });
      return;
    }

    if (!selectedTemplate) return;

    // Validate required fields
    const requiredQuestions = selectedTemplate.fields.questions.filter(q => q.required);
    const missingResponses = requiredQuestions.filter(q => !responses[q.id] || responses[q.id].trim() === '');
    
    if (missingResponses.length > 0) {
      toast({
        title: "Campos obrigatórios não preenchidos",
        description: `Complete os campos: ${missingResponses.map(q => q.text).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    createAnamnesisMutation.mutate({
      template_id: selectedTemplateId,
      patient_name: patientInfo.name,
      patient_email: patientInfo.email,
      patient_phone: patientInfo.phone,
      responses: responses
    });
  };

  const renderQuestion = (question: any) => {
    const value = responses[question.id] || '';
    const additionalValue = responses[`${question.id}_additional`] || '';

    switch (question.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            type={question.type}
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Digite sua resposta..."
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Informações adicionais"
            rows={3}
            className="w-full"
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleResponseChange(question.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <div className="space-y-3">
            <RadioGroup value={value} onValueChange={(val) => handleResponseChange(question.id, val)} className="flex space-x-6">
              {question.options?.map((option: string) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                  <Label htmlFor={`${question.id}-${option}`} className="text-sm font-normal">{option}</Label>
                </div>
              ))}
            </RadioGroup>
            
            {question.hasAdditional && (
              <div className="mt-3">
                <Label className="text-sm text-gray-600 mb-2 block">Informações adicionais</Label>
                <Textarea
                  value={additionalValue}
                  onChange={(e) => handleResponseChange(`${question.id}_additional`, e.target.value)}
                  placeholder="Digite aqui..."
                  rows={2}
                  className="w-full"
                />
              </div>
            )}
          </div>
        );

      case 'sim_nao_nao_sei':
        return (
          <div className="space-y-3">
            <RadioGroup value={value} onValueChange={(val) => handleResponseChange(question.id, val)} className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Sim" id={`${question.id}-sim`} />
                <Label htmlFor={`${question.id}-sim`} className="text-sm font-normal">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Não" id={`${question.id}-nao`} />
                <Label htmlFor={`${question.id}-nao`} className="text-sm font-normal">Não</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Não sei" id={`${question.id}-nao-sei`} />
                <Label htmlFor={`${question.id}-nao-sei`} className="text-sm font-normal">Não sei</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 'sim_nao_nao_sei_texto':
        return (
          <div className="space-y-3">
            <RadioGroup value={value} onValueChange={(val) => handleResponseChange(question.id, val)} className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Sim" id={`${question.id}-sim`} />
                <Label htmlFor={`${question.id}-sim`} className="text-sm font-normal">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Não" id={`${question.id}-nao`} />
                <Label htmlFor={`${question.id}-nao`} className="text-sm font-normal">Não</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Não sei" id={`${question.id}-nao-sei`} />
                <Label htmlFor={`${question.id}-nao-sei`} className="text-sm font-normal">Não sei</Label>
              </div>
            </RadioGroup>
            
            <div className="mt-3">
              <Label className="text-sm text-gray-600 mb-2 block">Informações adicionais</Label>
              <Textarea
                value={additionalValue}
                onChange={(e) => handleResponseChange(`${question.id}_additional`, e.target.value)}
                placeholder="Digite aqui..."
                rows={2}
                className="w-full"
              />
            </div>
          </div>
        );

      case 'somente_texto':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Digite sua resposta..."
            rows={3}
            className="w-full"
          />
        );

      default:
        return null;
    }
  };

  if (!contact) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-semibold text-slate-900">Preencher anamnese</h1>
      </div>

      {/* Template Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Selecionar Modelo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-select">Modelo de Anamnese</Label>
              <Select value={selectedTemplateId?.toString() || ''} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um modelo de anamnese" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedTemplate && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">{selectedTemplate.description}</p>
              </div>
            )}

            {selectedTemplateId && (
              <Button 
                onClick={() => setLocation(`/anamnese-publica/preview/${contactId}/${selectedTemplateId}`)}
                variant="outline"
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar para paciente responder
              </Button>
            )}
          </div>
        </CardContent>
      </Card>



      {/* Questions Form */}
      {selectedTemplate && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-8">
              {selectedTemplate.fields.questions.map((question, index) => (
                <div key={question.id} className="space-y-3">
                  <Label className="text-base font-medium text-gray-900 block">
                    {question.text}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {renderQuestion(question)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {selectedTemplate && (
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={handleBack}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createAnamnesisMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createAnamnesisMutation.isPending ? (
              <>Criando...</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Criar e compartilhar
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}