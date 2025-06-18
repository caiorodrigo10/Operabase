import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { insertContactSchema } from "../../../server/domains/contacts/contacts.schema";
import { UserPlus } from "lucide-react";

interface PatientFormProps {
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
  defaultValues?: any;
}

export function PatientForm({ 
  onSubmit, 
  isSubmitting = false, 
  submitButtonText = "Cadastrar paciente",
  defaultValues = {}
}: PatientFormProps) {
  const [activeTab, setActiveTab] = useState("basic");

  const form = useForm({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      clinic_id: 1,
      name: "",
      phone: "",
      email: "",
      profession: "",
      status: "novo",
      gender: "",
      age: undefined,
      address: "",
      emergency_contact: "",
      medical_history: "",
      current_medications: [],
      allergies: [],
      notes: "",
      priority: "normal",
      source: "whatsapp",
      profile_picture: "",
      ...defaultValues
    }
  });

  const handleSubmit = (data: any) => {
    onSubmit(data);
    if (!defaultValues.id) {
      // Reset form only for new patients
      form.reset();
      setActiveTab("basic");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Informações básicas</TabsTrigger>
            <TabsTrigger value="additional">Informações complementares</TabsTrigger>
            <TabsTrigger value="medical">Informações médicas</TabsTrigger>
          </TabsList>

          {/* Tab 1: Basic Information */}
          <TabsContent value="basic" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>* Nome completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gênero</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                        <SelectItem value="nao_informado">Não informado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>* Celular</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idade</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Idade" 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="profession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profissão</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite a profissão" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Como conheceu a clínica</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "whatsapp"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="site">Site</SelectItem>
                        <SelectItem value="indicacao">Indicação</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adicionar observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Adicione observações sobre o paciente"
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Contato de emergência</h4>
              <FormField
                control={form.control}
                name="emergency_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome e telefone de emergência</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nome: (11) 99999-9999" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Tab 2: Additional Information */}
          <TabsContent value="additional" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="email@exemplo.com" 
                        type="email" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço completo</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Rua, número, bairro, cidade" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "normal"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status inicial</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "novo"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="novo">Novo</SelectItem>
                        <SelectItem value="em_conversa">Em conversa</SelectItem>
                        <SelectItem value="agendado">Agendado</SelectItem>
                        <SelectItem value="realizado">Realizado</SelectItem>
                        <SelectItem value="pos_atendimento">Pós-atendimento</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="medical_history"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Histórico médico</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Histórico médico do paciente"
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Tab 3: Medical Information */}
          <TabsContent value="medical" className="space-y-4 mt-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Medicamentos atuais</h4>
              <FormField
                control={form.control}
                name="current_medications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lista de medicamentos</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Liste os medicamentos separados por vírgula"
                        className="resize-none"
                        rows={3}
                        {...field}
                        value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                        onChange={(e) => {
                          const medications = e.target.value.split(",").map(med => med.trim()).filter(Boolean);
                          field.onChange(medications);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Alergias</h4>
              <FormField
                control={form.control}
                name="allergies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lista de alergias</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Liste as alergias separadas por vírgula"
                        className="resize-none"
                        rows={3}
                        {...field}
                        value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                        onChange={(e) => {
                          const allergies = e.target.value.split(",").map(allergy => allergy.trim()).filter(Boolean);
                          field.onChange(allergies);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Cadastrando...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                {submitButtonText}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}