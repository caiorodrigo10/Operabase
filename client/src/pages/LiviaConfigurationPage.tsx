import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Bot, Clock, Users, BookOpen, Save, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { 
  useLiviaConfiguration, 
  useCreateLiviaConfiguration, 
  useUpdateLiviaConfiguration,
  useWhatsAppNumbers,
  useProfessionals,
  useKnowledgeBases
} from '@/hooks/useLiviaConfig';

interface ConfigFormData {
  general_prompt: string;
  whatsapp_number_id: number | null;
  off_settings: {
    duration: number;
    unit: string;
  };
  professional_ids: number[];
  knowledge_base_ids: number[];
}

export default function LiviaConfigurationPage() {
  const { toast } = useToast();
  
  // Queries for data
  const { data: config, isLoading: configLoading, error: configError } = useLiviaConfiguration();
  const { data: whatsappNumbers, isLoading: whatsappLoading } = useWhatsAppNumbers();
  const { data: professionals, isLoading: professionalsLoading } = useProfessionals();
  const { data: knowledgeBases, isLoading: knowledgeBasesLoading } = useKnowledgeBases();
  
  // Debug logs
  console.log('🔍 Livia Config Debug - Data:', {
    config,
    whatsappNumbers,
    professionals: professionals,
    knowledgeBases: knowledgeBases,
    isLoading: { configLoading, whatsappLoading, professionalsLoading, knowledgeBasesLoading }
  });
  
  // Mutations
  const createConfig = useCreateLiviaConfiguration();
  const updateConfig = useUpdateLiviaConfiguration();
  
  // Form state
  const [formData, setFormData] = useState<ConfigFormData>({
    general_prompt: '',
    whatsapp_number_id: null,
    off_settings: {
      duration: 4,
      unit: 'hours'
    },
    professional_ids: [],
    knowledge_base_ids: []
  });
  
  // Load existing configuration into form
  useEffect(() => {
    if (config) {
      setFormData({
        general_prompt: config.general_prompt || '',
        whatsapp_number_id: config.whatsapp_number_id || null,
        off_settings: config.off_settings || { duration: 4, unit: 'hours' },
        professional_ids: config.professional_ids || [],
        knowledge_base_ids: config.knowledge_base_ids || []
      });
    }
  }, [config]);
  
  const handleSave = async () => {
    try {
      if (config) {
        // Update existing configuration
        await updateConfig.mutateAsync(formData);
        toast({
          title: "Configuração atualizada",
          description: "As configurações da Livia foram atualizadas com sucesso.",
        });
      } else {
        // Create new configuration
        await createConfig.mutateAsync(formData);
        toast({
          title: "Configuração criada",
          description: "As configurações da Livia foram criadas com sucesso.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações da Livia.",
        variant: "destructive",
      });
    }
  };
  
  const toggleProfessional = (professionalId: number) => {
    setFormData(prev => ({
      ...prev,
      professional_ids: prev.professional_ids.includes(professionalId)
        ? prev.professional_ids.filter(id => id !== professionalId)
        : [...prev.professional_ids, professionalId]
    }));
  };
  
  const toggleKnowledgeBase = (kbId: number) => {
    setFormData(prev => ({
      ...prev,
      knowledge_base_ids: prev.knowledge_base_ids.includes(kbId)
        ? prev.knowledge_base_ids.filter(id => id !== kbId)
        : [...prev.knowledge_base_ids, kbId]
    }));
  };
  
  const isLoading = configLoading || whatsappLoading || professionalsLoading || knowledgeBasesLoading;
  const isSaving = createConfig.isPending || updateConfig.isPending;
  
  if (configError && configError.status !== 404) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <AlertCircle className="h-5 w-5" />
          <span>Erro ao carregar configurações da Livia</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuração da Livia</h1>
          <p className="text-gray-600">Configure o assistente de IA para sua clínica</p>
        </div>
      </div>
      
      <div className="grid gap-6">
        {/* Prompt Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Prompt Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label htmlFor="general_prompt">Instrução base para a Livia</Label>
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <Textarea
                  id="general_prompt"
                  placeholder="Você é a Livia, assistente virtual da clínica. Seja sempre prestativa e profissional..."
                  className="min-h-[120px]"
                  value={formData.general_prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, general_prompt: e.target.value }))}
                />
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Configuração WhatsApp */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label htmlFor="whatsapp_number">Número do WhatsApp</Label>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={formData.whatsapp_number_id?.toString() || ''}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    whatsapp_number_id: value ? parseInt(value) : null 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um número do WhatsApp" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(whatsappNumbers) && whatsappNumbers.map((number) => (
                      <SelectItem key={number.id} value={number.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{number.phone}</span>
                          <Badge variant={number.status === 'connected' ? 'default' : 'secondary'}>
                            {number.status === 'connected' ? 'Conectado' : 'Desconectado'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Configurações de Horário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horário de Funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="off_duration">Duração fora do horário</Label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Input
                    id="off_duration"
                    type="number"
                    min="1"
                    value={formData.off_settings.duration}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      off_settings: { 
                        ...prev.off_settings, 
                        duration: parseInt(e.target.value) 
                      }
                    }))}
                  />
                )}
              </div>
              <div>
                <Label htmlFor="off_unit">Unidade</Label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={formData.off_settings.unit}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      off_settings: { ...prev.off_settings, unit: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutos</SelectItem>
                      <SelectItem value="hours">Horas</SelectItem>
                      <SelectItem value="days">Dias</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Profissionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Profissionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                Array.isArray(professionals) && professionals.map((professional) => (
                  <div
                    key={professional.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.professional_ids.includes(professional.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleProfessional(professional.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="font-medium">{professional.name}</p>
                        {professional.specialty && (
                          <p className="text-sm text-gray-600">{professional.specialty}</p>
                        )}
                      </div>
                      {formData.professional_ids.includes(professional.id) && (
                        <Badge>Selecionado</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Bases de Conhecimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Bases de Conhecimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                (knowledgeBases && Array.isArray(knowledgeBases)) ? knowledgeBases.map((kb) => (
                  <div
                    key={kb.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.knowledge_base_ids.includes(kb.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleKnowledgeBase(kb.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="font-medium">{kb.name}</p>
                        {kb.description && (
                          <p className="text-sm text-gray-600">{kb.description}</p>
                        )}
                      </div>
                      {formData.knowledge_base_ids.includes(kb.id) && (
                        <Badge>Selecionado</Badge>
                      )}
                    </div>
                  </div>
                )) : null
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Botão Salvar */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isSaving || isLoading}
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}