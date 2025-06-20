import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, Database, Calendar, Mail, CheckCircle, AlertCircle, Bot, Plus, Trash2, Settings, Edit, Info, Link, Unlink, X, RefreshCw, Save, Phone, Users, Timer, QrCode } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { getCountries, getCountryCallingCode } from 'react-phone-number-input';
import countries from 'world-countries';
import { UserManagement } from '@/components/UserManagement';
import { WhatsAppManager } from '@/components/WhatsAppManager';

// Country selector component
const CountrySelector = ({ value, onChange, placeholder = "Selecione um país" }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => {
  const sortedCountries = countries
    .map(country => ({
      code: country.cca2,
      name: country.name.common,
      flag: country.flag
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {sortedCountries.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{country.flag}</span>
              <span>{country.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export function Configuracoes() {
  const { toast } = useToast();
  const [phoneValue, setPhoneValue] = useState<string>();
  const [celularValue, setCelularValue] = useState<string>();
  const [hasLunchBreak, setHasLunchBreak] = useState(false);
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [clinicConfig, setClinicConfig] = useState<any>({
    address_country: "BR",
    address_state: "SP",
    work_start: "08:00",
    work_end: "18:00",
    lunch_start: "12:00",
    lunch_end: "13:00",
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    has_lunch_break: false
  });

  const handleWorkingDayChange = (day: string, checked: boolean) => {
    if (checked) {
      setWorkingDays(prev => [...prev, day]);
    } else {
      setWorkingDays(prev => prev.filter(d => d !== day));
    }
  };

  const saveConfigMutation = useMutation({
    mutationFn: async (configData: any) => {
      const response = await apiRequest('/api/clinics/config', 'POST', configData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações da clínica foram atualizadas com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    }
  });

  const handleSaveConfig = () => {
    const configData = {
      ...clinicConfig,
      phone: phoneValue || "",
      celular: celularValue || "",
      working_days: workingDays,
      has_lunch_break: hasLunchBreak
    };
    saveConfigMutation.mutate(configData);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-slate-600">Gerencie as configurações da sua clínica</p>
        </div>
      </div>

      <Tabs defaultValue="clinic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="clinic">Clínica</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="clinic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Clínica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clinic-name">Nome da Clínica</Label>
                  <Input id="clinic-name" placeholder="Nome da sua clínica" />
                </div>
                <div>
                  <Label htmlFor="clinic-responsible">Responsável</Label>
                  <Input id="clinic-responsible" placeholder="Nome do responsável" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Telefone Principal</Label>
                  <PhoneInput
                    international
                    countryCallingCodeEditable={false}
                    defaultCountry="BR"
                    value={phoneValue}
                    onChange={setPhoneValue}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  />
                </div>
                <div>
                  <Label>WhatsApp/Celular</Label>
                  <PhoneInput
                    international
                    countryCallingCodeEditable={false}
                    defaultCountry="BR"
                    value={celularValue}
                    onChange={setCelularValue}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clinic-email">E-mail</Label>
                  <Input id="clinic-email" type="email" placeholder="contato@clinica.com" />
                </div>
                <div>
                  <Label htmlFor="clinic-website">Website</Label>
                  <Input id="clinic-website" placeholder="https://www.clinica.com" />
                </div>
              </div>

              <Button onClick={handleSaveConfig} disabled={saveConfigMutation.isPending}>
                {saveConfigMutation.isPending ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                WhatsApp Business
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WhatsAppManager clinicId={1} userId="user-123" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Google Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Sincronize seus agendamentos com o Google Calendar</p>
              <Button variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Conectar Google Calendar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <UserManagement clinicId={1} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Sistema Operacional</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Online</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Base de Dados</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">Conectado</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}