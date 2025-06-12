import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Save,
  X,
  FileText,
  Stethoscope,
  Heart,
  Baby,
  AlertTriangle
} from "lucide-react";

interface ProntuarioEditorProps {
  contactId: number;
  contactName: string;
  appointments: any[];
  onClose: () => void;
}

const medicalTemplates = [
  {
    id: "consultation",
    name: "Consulta Médica",
    icon: <Stethoscope className="w-4 h-4" />,
    template: `# 🩺 Consulta Médica

**Data:** ${new Date().toLocaleDateString('pt-BR')}

## 🗣️ Queixa Principal


## 📋 História da Doença Atual


## 🔍 Exame Físico
- **Geral:** 
- **Sinais Vitais:** PA: ___/___mmHg | FC: ___bpm | T: ___°C | Peso: ___kg
- **Específico:** 

## 🎯 Hipóteses Diagnósticas
1. 
2. 

## 💊 Conduta
- **Medicações:** 
- **Exames:** 
- **Orientações:** 

## 📅 Retorno
`
  },
  {
    id: "followup",
    name: "Retorno",
    icon: <Heart className="w-4 h-4" />,
    template: `# 🔄 Consulta de Retorno

**Data:** ${new Date().toLocaleDateString('pt-BR')}

## 📈 Evolução


## 💊 Adesão ao Tratamento


## 🔍 Exame Atual


## 📋 Ajustes na Conduta


## 📅 Próximo Retorno
`
  },
  {
    id: "pediatric",
    name: "Pediatria",
    icon: <Baby className="w-4 h-4" />,
    template: `# 👶 Consulta Pediátrica

**Data:** ${new Date().toLocaleDateString('pt-BR')}
**Idade:** 

## 🗣️ Queixa dos Responsáveis


## 📊 Desenvolvimento
- **Peso:** ___kg (P___)
- **Altura:** ___cm (P___)
- **PC:** ___cm (P___)
- **Marcos do desenvolvimento:** 

## 🔍 Exame Físico


## 💉 Vacinas
- **Em dia:** ☐ Sim ☐ Não
- **Observações:** 

## 🎯 Conduta


## 📅 Retorno
`
  },
  {
    id: "emergency",
    name: "Emergência",
    icon: <AlertTriangle className="w-4 h-4" />,
    template: `# 🚨 Atendimento de Emergência

**Data/Hora:** ${new Date().toLocaleString('pt-BR')}

## ⚡ Motivo da Consulta


## 🚨 Estado Geral
- **Consciente:** ☐ Sim ☐ Não
- **Orientado:** ☐ Sim ☐ Não
- **Sinais Vitais:** PA: ___/___mmHg | FC: ___bpm | T: ___°C | SatO2: ___%

## 🔍 Avaliação Inicial


## 🎯 Hipótese Diagnóstica


## ⚡ Conduta Imediata


## 📋 Evolução/Desfecho
`
  }
];

export default function ProntuarioEditor({ contactId, contactName, appointments, onClose }: ProntuarioEditorProps) {
  const [content, setContent] = useState("");
  const [recordType, setRecordType] = useState("consultation");
  const [selectedAppointment, setSelectedAppointment] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createRecordMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/contacts/${contactId}/medical-records`, {
      method: "POST",
      body: JSON.stringify(data)
    }),
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
    }
  };

  const insertFormatting = (prefix: string, suffix: string = "") => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newText = content.substring(0, start) + 
                   prefix + selectedText + suffix + 
                   content.substring(end);
    
    setContent(newText);
    
    // Restaurar posição do cursor
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + prefix.length + selectedText.length + suffix.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
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

  const formatButtons = [
    { icon: <Bold className="w-4 h-4" />, action: () => insertFormatting("**", "**"), title: "Negrito" },
    { icon: <Italic className="w-4 h-4" />, action: () => insertFormatting("*", "*"), title: "Itálico" },
    { icon: <Underline className="w-4 h-4" />, action: () => insertFormatting("<u>", "</u>"), title: "Sublinhado" },
    { icon: <Heading1 className="w-4 h-4" />, action: () => insertFormatting("# "), title: "Título 1" },
    { icon: <Heading2 className="w-4 h-4" />, action: () => insertFormatting("## "), title: "Título 2" },
    { icon: <Heading3 className="w-4 h-4" />, action: () => insertFormatting("### "), title: "Título 3" },
    { icon: <List className="w-4 h-4" />, action: () => insertFormatting("- "), title: "Lista" },
    { icon: <ListOrdered className="w-4 h-4" />, action: () => insertFormatting("1. "), title: "Lista Numerada" },
    { icon: <Quote className="w-4 h-4" />, action: () => insertFormatting("> "), title: "Citação" },
  ];

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
            <Label className="text-sm font-medium mb-3 block">Templates Médicos</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {medicalTemplates.map((template) => (
                <Button
                  key={template.id}
                  variant={selectedTemplate === template.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyTemplate(template.id)}
                  className="h-auto p-3 flex flex-col items-center gap-2"
                >
                  {template.icon}
                  <span className="text-xs">{template.name}</span>
                </Button>
              ))}
            </div>
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

          {/* Barra de Formatação */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Formatação de Texto</Label>
            <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded-lg border">
              {formatButtons.map((button, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={button.action}
                  title={button.title}
                  className="h-8 w-8 p-0"
                >
                  {button.icon}
                </Button>
              ))}
            </div>
          </div>

          {/* Editor de Texto */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Conteúdo da Nota</Label>
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Digite sua nota médica aqui... Use os templates acima para facilitar o preenchimento."
              rows={25}
              className="font-mono text-sm resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Dica: Use markdown para formatação (**, *, -, etc.) ou os botões de formatação acima
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