import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import RichTextEditor from "./RichTextEditor";
import { 
  Save,
  X,
  FileText
} from "lucide-react";

interface EvolucaoEditorProps {
  contactId: string;
  contactName: string;
  appointments?: any[];
  onClose?: () => void;
}

// Templates médicos para evoluções
const templates = [
  {
    id: "soap",
    name: "SOAP - Subjetivo, Objetivo, Avaliação, Plano",
    template: `<h1>Evolução Médica - SOAP</h1>
<p><strong>Paciente:</strong> ${""}</p>
<p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>

<h2>Subjetivo (S)</h2>
<p><strong>Queixa Principal:</strong></p>
<p><br></p>

<p><strong>História da Doença Atual:</strong></p>
<p><br></p>

<p><strong>Revisão de Sistemas:</strong></p>
<p><br></p>

<h2>Objetivo (O)</h2>
<p><strong>Sinais Vitais:</strong></p>
<ul>
<li>PA: _____ mmHg</li>
<li>FC: _____ bpm</li>
<li>FR: _____ irpm</li>
<li>T: _____ °C</li>
<li>Peso: _____ kg</li>
</ul>

<p><strong>Exame Físico:</strong></p>
<p><br></p>

<h2>Avaliação (A)</h2>
<p><strong>Diagnóstico Principal:</strong></p>
<p><br></p>

<p><strong>Diagnósticos Secundários:</strong></p>
<p><br></p>

<h2>Plano (P)</h2>
<p><strong>Tratamento:</strong></p>
<p><br></p>

<p><strong>Exames Solicitados:</strong></p>
<p><br></p>

<p><strong>Orientações:</strong></p>
<p><br></p>

<p><strong>Retorno:</strong></p>
<p><br></p>`
  },
  {
    id: "pediatrics",
    name: "Evolução Pediátrica",
    template: `<h1>Evolução Pediátrica</h1>
<p><strong>Paciente:</strong> ${""}</p>
<p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
<p><strong>Idade:</strong> _____ anos/meses</p>

<h2>Queixa dos Responsáveis</h2>
<p><br></p>

<h2>Dados Antropométricos</h2>
<ul>
<li>Peso: _____ kg (Percentil: _____)</li>
<li>Altura: _____ cm (Percentil: _____)</li>
<li>PC: _____ cm (se aplicável)</li>
</ul>

<h2>Desenvolvimento</h2>
<p><strong>Motor:</strong></p>
<p><br></p>

<p><strong>Neuropsicomotor:</strong></p>
<p><br></p>

<h2>Exame Físico</h2>
<p><br></p>

<h2>Avaliação e Conduta</h2>
<p><br></p>

<h2>Orientações aos Responsáveis</h2>
<p><br></p>

<h2>Próxima Consulta</h2>
<p><br></p>`
  },
  {
    id: "prenatal",
    name: "Evolução Pré-Natal",
    template: `<h1>Evolução Pré-Natal</h1>
<p><strong>Gestante:</strong> ${""}</p>
<p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
<p><strong>IG:</strong> _____ semanas + _____ dias</p>

<h2>Queixas</h2>
<p><br></p>

<h2>Dados Vitais</h2>
<ul>
<li>Peso atual: _____ kg (Ganho total: _____ kg)</li>
<li>PA: _____ x _____ mmHg</li>
<li>Altura uterina: _____ cm</li>
<li>BCF: _____ bpm</li>
</ul>

<h2>Exame Físico</h2>
<p><strong>Abdome obstétrico:</strong></p>
<p><br></p>

<p><strong>Outros sistemas:</strong></p>
<p><br></p>

<h2>Exames Complementares</h2>
<p><br></p>

<h2>Avaliação</h2>
<p><br></p>

<h2>Conduta</h2>
<p><br></p>

<h2>Orientações</h2>
<p><br></p>

<h2>Retorno</h2>
<p><br></p>`
  },
  {
    id: "psychology",
    name: "Evolução Psicológica",
    template: `<h1>Evolução Psicológica</h1>
<p><strong>Paciente:</strong> ${""}</p>
<p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
<p><strong>Sessão nº:</strong> _____</p>

<h2>Observações Comportamentais</h2>
<p><br></p>

<h2>Conteúdo da Sessão</h2>
<p><br></p>

<h2>Técnicas Utilizadas</h2>
<p><br></p>

<h2>Progresso Observado</h2>
<p><br></p>

<h2>Dificuldades Identificadas</h2>
<p><br></p>

<h2>Plano para Próxima Sessão</h2>
<p><br></p>

<h2>Observações</h2>
<p><br></p>`
  },
  {
    id: "consultation",
    name: "Evolução de Consulta",
    template: `<h1>Evolução de Consulta</h1>
<p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>

<h2>Motivo da Consulta</h2>
<p><br></p>

<h2>Anamnese</h2>
<p><br></p>

<h2>Exame Físico</h2>
<p><br></p>

<h2>Hipótese Diagnóstica</h2>
<p><br></p>

<h2>Conduta</h2>
<p><br></p>

<h2>Orientações</h2>
<p><br></p>`
  },
  {
    id: "surgery",
    name: "Evolução Cirúrgica",
    template: `<h1>Evolução Cirúrgica</h1>
<p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>

<h2>Procedimento Realizado</h2>
<p><br></p>

<h2>Descrição do Procedimento</h2>
<p><br></p>

<h2>Intercorrências</h2>
<p><br></p>

<h2>Orientações Pós-procedimento</h2>
<p><br></p>

<h2>Retorno</h2>
<p><br></p>`
  },
  {
    id: "exam",
    name: "Solicitação de Exames",
    template: `<h1>Solicitação de Exames</h1>
<p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>

<h2>Indicação Clínica</h2>
<p><br></p>

<h2>Exames Solicitados</h2>
<ul>
<li></li>
<li></li>
<li></li>
</ul>

<h2>Orientações ao Paciente</h2>
<p><br></p>

<h2>Retorno para Resultado</h2>
<p><br></p>`
  }
];

export default function EvolucaoEditor({ contactId, contactName, appointments, onClose }: EvolucaoEditorProps) {
  const [content, setContent] = useState("");
  const [recordType, setRecordType] = useState("consultation");
  const [selectedAppointment, setSelectedAppointment] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [editorKey, setEditorKey] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation para salvar prontuário
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/medical-records', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Evolução salva com sucesso!",
        description: "O registro médico foi salvo no prontuário do paciente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/medical-records'] });
      if (onClose) onClose();
    },
    onError: (error) => {
      console.error('Erro ao salvar prontuário:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a evolução. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!content.trim()) {
      toast({
        title: "Conteúdo vazio",
        description: "Por favor, escreva o conteúdo da evolução antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      contactId: parseInt(contactId),
      content,
      recordType,
      appointmentId: selectedAppointment,
      clinicId: 1, // TODO: Get from context
    };

    saveMutation.mutate(data);
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const templateContent = template.template.replace('${""}', contactName || '');
      setContent(templateContent);
      setEditorKey(prev => prev + 1); // Force re-render
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <CardTitle>Nova Evolução - {contactName}</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Configurações */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="recordType">Tipo de Registro</Label>
            <Select value={recordType} onValueChange={setRecordType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultation">Consulta</SelectItem>
                <SelectItem value="evolution">Evolução</SelectItem>
                <SelectItem value="procedure">Procedimento</SelectItem>
                <SelectItem value="exam">Exame</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {appointments && appointments.length > 0 && (
            <div>
              <Label htmlFor="appointment">Vincular à Consulta</Label>
              <Select value={selectedAppointment?.toString() || ""} onValueChange={(value) => setSelectedAppointment(value ? parseInt(value) : null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar consulta" />
                </SelectTrigger>
                <SelectContent>
                  {appointments.map((appointment) => (
                    <SelectItem key={appointment.id} value={appointment.id.toString()}>
                      {new Date(appointment.scheduled_date).toLocaleDateString('pt-BR')} - {appointment.doctor_name || 'Consulta'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="template">Template</Label>
            <Select value={selectedTemplate} onValueChange={(value) => {
              setSelectedTemplate(value);
              if (value) applyTemplate(value);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Editor */}
        <div>
          <Label htmlFor="content">Conteúdo da Evolução</Label>
          <RichTextEditor
            key={editorKey}
            value={content}
            onChange={setContent}
            placeholder="Escreva aqui o conteúdo da evolução médica..."
            className="mt-2"
          />
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-3">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            disabled={saveMutation.isPending || !content.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Salvando..." : "Salvar Evolução"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}