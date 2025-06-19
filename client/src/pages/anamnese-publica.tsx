import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

interface AnamnesisQuestion {
  id: string;
  text: string;
  type: string;
  required: boolean;
}

interface AnamnesisData {
  id: number;
  contact_id: number;
  template_name: string;
  template_fields: {
    questions: AnamnesisQuestion[];
  };
  status: string;
  expires_at: string;
}

export default function AnamnesisPublica() {
  const params = useParams();
  const { toast } = useToast();
  const token = params.token;
  
  const [anamnesis, setAnamnesis] = useState<AnamnesisData | null>(null);
  const [contactName, setContactName] = useState('');
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      fetchAnamnesis();
    }
  }, [token]);

  const fetchAnamnesis = async () => {
    try {
      const response = await fetch(`/api/public/anamnesis/${token}`);
      if (!response.ok) {
        throw new Error('Anamnese não encontrada');
      }
      const data = await response.json();
      setAnamnesis(data);
      
      // Fetch contact name
      if (data.contact_id) {
        fetchContactName(data.contact_id);
      }
    } catch (error) {
      console.error('Error fetching anamnesis:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a anamnese.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchContactName = async (contactId: number) => {
    try {
      const response = await fetch(`/api/public/contact/${contactId}/name`);
      if (response.ok) {
        const data = await response.json();
        setContactName(data.name || 'Paciente');
      }
    } catch (error) {
      console.error('Error fetching contact name:', error);
      setContactName('Paciente');
    }
  };

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    if (!anamnesis) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/public/anamnesis/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses,
          patient_name: contactName,
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar anamnese');
      }

      toast({
        title: "Sucesso!",
        description: "Anamnese enviada com sucesso.",
      });

      // Redirect to success page or show success message
      setAnamnesis(null);
    } catch (error) {
      console.error('Error submitting anamnesis:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a anamnese.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: AnamnesisQuestion) => {
    const value = responses[question.id] || '';
    const additionalValue = responses[`${question.id}_additional`] || '';

    switch (question.type) {
      case 'somente_texto':
        return (
          <Input
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Informações adicionais"
            className="w-full"
          />
        );

      case 'sim_nao_nao_sei':
        return (
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
            
            <div>
              <Label className="text-sm text-gray-600 mb-1 block">Informações adicionais</Label>
              <Input
                value={additionalValue}
                onChange={(e) => handleResponseChange(`${question.id}_additional`, e.target.value)}
                placeholder="Digite aqui..."
                className="w-full"
              />
            </div>
          </div>
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Digite sua resposta..."
            className="w-full"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando anamnese...</p>
        </div>
      </div>
    );
  }

  if (!anamnesis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Anamnese não encontrada</h1>
          <p className="text-gray-600">A anamnese pode ter expirado ou o link pode estar incorreto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with patient name */}
      <div className="bg-blue-600 text-white py-4">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-lg font-medium text-center">{contactName}</h1>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Anamnese</h2>
            <p className="text-gray-600">
              Olá, assim que você preencher a anamnese o profissional irá receber os dados.
            </p>
          </div>

          {/* Questions */}
          <div className="space-y-8">
            {anamnesis.template_fields.questions.map((question, index) => (
              <div key={question.id} className="bg-gray-50 rounded-lg p-6">
                <Label className="text-base font-medium text-gray-900 block mb-4">
                  {question.text}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderQuestion(question)}
              </div>
            ))}
          </div>

          {/* Submit button */}
          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 px-8"
            >
              {submitting ? 'Enviando...' : 'Enviar →'}
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-sm text-gray-500">Desenvolvido por</p>
            <p className="text-sm font-medium text-blue-600">Codental</p>
          </div>
        </div>
      </div>
    </div>
  );
}