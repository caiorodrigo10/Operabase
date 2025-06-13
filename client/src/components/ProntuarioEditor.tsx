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

interface ProntuarioEditorProps {
  contactId: number;
  contactName: string;
  appointments: any[];
  onClose: () => void;
}

const medicalTemplates = [
  {
    id: "blank",
    name: "Nota em Branco",
    template: ""
  },
  {
    id: "consultation",
    name: "Consulta Médica",
    template: `<h1>Consulta Médica</h1>
<p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>

<h2>Queixa Principal</h2>
<p><br></p>

<h2>História da Doença Atual</h2>
<p><br></p>

<h2>Exame Físico</h2>
<ul>
<li><strong>Geral:</strong> </li>
<li><strong>Sinais Vitais:</strong> PA: ___/___mmHg | FC: ___bpm | T: ___°C | Peso: ___kg</li>
<li><strong>Específico:</strong> </li>
</ul>

<h2>Hipóteses Diagnósticas</h2>
<ol>
<li></li>
<li></li>
</ol>

<h2>Conduta</h2>
<ul>
<li><strong>Medicações:</strong> </li>
<li><strong>Exames:</strong> </li>
<li><strong>Orientações:</strong> </li>
</ul>

<h2>Retorno</h2>
<p><br></p>`
  },
  {
    id: "followup",
    name: "Consulta de Retorno",
    template: `<h1>Consulta de Retorno</h1>
<p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>

<h2>Evolução</h2>
<p><br></p>

<h2>Adesão ao Tratamento</h2>
<p><br></p>

<h2>Exame Atual</h2>
<p><br></p>

<h2>Ajustes na Conduta</h2>
<p><br></p>

<h2>Próximo Retorno</h2>
<p><br></p>`
  },
  {
    id: "pediatric",
    name: "Consulta Pediátrica",
    template: `<h1>Consulta Pediátrica</h1>
<p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
<p><strong>Idade:</strong> </p>

<h2>Queixa dos Responsáveis</h2>
<p><br></p>

<h2>Desenvolvimento</h2>
<ul>
<li><strong>Peso:</strong> ___kg (P___)</li>
<li><strong>Altura:</strong> ___cm (P___)</li>
<li><strong>PC:</strong> ___cm (P___)</li>
<li><strong>Marcos do desenvolvimento:</strong> </li>
</ul>

<h2>Exame Físico</h2>
<p><br></p>

<h2>Vacinas</h2>
<ul>
<li><strong>Em dia:</strong> Sim / Não</li>
<li><strong>Observações:</strong> </li>
</ul>

<h2>Conduta</h2>
<p><br></p>

<h2>Retorno</h2>
<p><br></p>`
  },
  {
    id: "emergency",
    name: "Atendimento de Emergência",
    template: `<h1>Atendimento de Emergência</h1>
<p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>

<h2>Motivo da Consulta</h2>
<p><br></p>

<h2>Estado Geral</h2>
<ul>
<li><strong>Consciente:</strong> Sim / Não</li>
<li><strong>Orientado:</strong> Sim / Não</li>
<li><strong>Sinais Vitais:</strong> PA: ___/___mmHg | FC: ___bpm | T: ___°C | SatO2: ___%</li>
</ul>

<h2>Avaliação Inicial</h2>
<p><br></p>

<h2>Hipótese Diagnóstica</h2>
<p><br></p>

<h2>Conduta Imediata</h2>
<p><br></p>

<h2>Evolução/Desfecho</h2>
<p><br></p>`
  },
  {
    id: "procedure",
    name: "Procedimento",
    template: `<h1>Procedimento</h1>
<p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
<p><strong>Procedimento:</strong> </p>

<h2>Indicação</h2>
<p><br></p>

<h2>Técnica Utilizada</h2>
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

export default function ProntuarioEditor({ contactId, contactName, appointments, onClose }: ProntuarioEditorProps) {
  const [content, setContent] = useState("");
  const [recordType, setRecordType] = useState("consultation");
  const [selectedAppointment, setSelectedAppointment] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [editorKey, setEditorKey] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createRecordMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/contacts/${contactId}/medical-records`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", contactId, "medical-records"] });
      toast({
        title: "Prontuário criado",
        description: "Prontuário médico salvo com sucesso.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar prontuário",
        description: error.message || "Ocorreu um erro ao salvar o prontuário.",
        variant: "destructive",
      });
    }
  });

  const applyTemplate = (templateId: string) => {
    const template = medicalTemplates.find(t => t.id === templateId);
    if (template) {
      setContent(template.template);
      setSelectedTemplate(templateId);
      setRecordType(templateId);
      setEditorKey(prev => prev + 1); // Força recriação do editor
    }
  };

  const handleSave = () => {
    if (!content.trim()) {
      toast({
        title: "Conteúdo obrigatório",
        description: "Digite o conteúdo da nota médica antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    const recordData: any = {
      contact_id: contactId,
      clinic_id: 1, // Assumindo clinic_id fixo
      record_type: recordType,
      content: content.trim()
    };

    if (selectedAppointment) {
      const appointment = appointments.find(apt => apt.id === selectedAppointment);
      if (appointment) {
        recordData.appointment_id = selectedAppointment;
        recordData.clinic_id = appointment.clinic_id;
      }
    }

    createRecordMutation.mutate(recordData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">Novo Prontuário</CardTitle>
                <p className="text-sm text-gray-600">{contactName}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Templates */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Template Médico</Label>
            <Select value={selectedTemplate} onValueChange={applyTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template..." />
              </SelectTrigger>
              <SelectContent>
                {medicalTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Escolha um template para preencher automaticamente a estrutura da nota
            </p>
          </div>

          {/* Vinculação a Consulta */}
          {appointments.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Vincular à Consulta (Opcional)</Label>
              <Select value={selectedAppointment?.toString() || ""} onValueChange={(value) => setSelectedAppointment(value ? parseInt(value) : null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma consulta..." />
                </SelectTrigger>
                <SelectContent>
                  {appointments.map((appointment) => (
                    <SelectItem key={appointment.id} value={appointment.id.toString()}>
                      {new Date(appointment.scheduled_date).toLocaleDateString('pt-BR')} - {appointment.doctor_name} ({appointment.specialty})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Editor Rico */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Conteúdo da Nota</Label>
            <RichTextEditor
              key={editorKey}
              value={content}
              onChange={setContent}
              placeholder="Digite sua nota médica aqui... Use os templates acima para facilitar o preenchimento."
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-2">
              Use os botões de formatação ou digite diretamente. O texto será formatado automaticamente.
            </p>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={createRecordMutation.isPending}
              className="min-w-[120px]"
            >
              {createRecordMutation.isPending ? (
                "Salvando..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Prontuário
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}