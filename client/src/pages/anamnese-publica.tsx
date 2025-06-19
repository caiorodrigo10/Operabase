import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnamnesisForm {
  id: number;
  template_name: string;
  template_fields: {
    questions: Array<{
      id: string;
      text: string;
      type: 'text' | 'radio' | 'checkbox' | 'textarea';
      options?: string[];
      required: boolean;
      additionalInfo: boolean;
    }>;
  };
  status: string;
  patient_name?: string;
  expires_at?: string;
}

export function AnamnesisPublica() {
  const { token } = useParams();
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  // Fetch anamnesis form by token
  const { data: anamnesis, isLoading, error } = useQuery({
    queryKey: ['/api/public/anamnesis', token],
    queryFn: async () => {
      const response = await fetch(`/api/public/anamnesis/${token}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch anamnesis');
      }
      return response.json();
    },
    enabled: !!token
  });

  // Submit anamnesis mutation
  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/public/anamnesis/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit anamnesis');
      }
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Anamnese enviada com sucesso!",
        description: "Suas respostas foram registradas.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar anamnese",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (anamnesis?.patient_name) {
      setPatientInfo(prev => ({
        ...prev,
        name: anamnesis.patient_name
      }));
    }
  }, [anamnesis]);

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleAdditionalInfoChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [`${questionId}_additional`]: value
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    const requiredQuestions = anamnesis?.template_fields?.questions?.filter((q: any) => q.required) || [];
    const missingResponses = requiredQuestions.filter((q: any) => !responses[q.id]);
    
    if (missingResponses.length > 0) {
      toast({
        title: "Campos obrigatórios não preenchidos",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!patientInfo.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe seu nome.",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate({
      responses,
      patient_name: patientInfo.name,
      patient_email: patientInfo.email,
      patient_phone: patientInfo.phone
    });
  };

  const renderQuestion = (question: any) => {
    return (
      <Card key={question.id} className="border border-slate-200">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="font-medium text-slate-900">
              {question.text}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            
            {question.type === 'radio' && question.options && (
              <RadioGroup
                value={responses[question.id] || ''}
                onValueChange={(value) => handleResponseChange(question.id, value)}
              >
                <div className="space-y-3">
                  {question.options.map((option: string) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                      <Label htmlFor={`${question.id}-${option}`} className="text-base">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {question.type === 'textarea' && (
              <Textarea
                placeholder="Digite sua resposta aqui..."
                value={responses[question.id] || ''}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                className="min-h-[120px]"
                required={question.required}
              />
            )}

            {question.additionalInfo && (
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <Label className="text-sm font-medium text-slate-700">
                  Informações adicionais
                </Label>
                <Textarea
                  placeholder="Digite aqui..."
                  value={responses[`${question.id}_additional`] || ''}
                  onChange={(e) => handleAdditionalInfoChange(question.id, e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando anamnese...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Anamnese não encontrada
            </h2>
            <p className="text-slate-600">
              {(error as any)?.message || 'Este link pode ter expirado ou não existe.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Anamnese enviada com sucesso!
            </h2>
            <p className="text-slate-600">
              Suas respostas foram registradas e enviadas para o profissional.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {anamnesis?.template_name}
          </h1>
          <p className="text-slate-600">
            Por favor, preencha todos os campos com suas informações.
          </p>
        </div>

        <div className="space-y-6">
          {/* Patient Information */}
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Suas informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="patient-name" className="text-sm font-medium text-slate-700">
                  Nome completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="patient-name"
                  value={patientInfo.name}
                  onChange={(e) => setPatientInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite seu nome completo"
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="patient-email" className="text-sm font-medium text-slate-700">
                  Email (opcional)
                </Label>
                <Input
                  id="patient-email"
                  type="email"
                  value={patientInfo.email}
                  onChange={(e) => setPatientInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Digite seu email"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="patient-phone" className="text-sm font-medium text-slate-700">
                  Telefone (opcional)
                </Label>
                <Input
                  id="patient-phone"
                  value={patientInfo.phone}
                  onChange={(e) => setPatientInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Digite seu telefone"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <div className="space-y-6">
            {anamnesis?.template_fields?.questions?.map(renderQuestion)}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
            >
              {submitMutation.isPending ? 'Enviando...' : 'Enviar anamnese'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}