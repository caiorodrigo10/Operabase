import { useState } from "react";
import { useLocation } from "wouter";
import { Search, UserPlus, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ContactAvatar } from "@/components/ContactAvatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PatientForm } from "@/components/PatientForm";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Contact {
  id: number;
  clinic_id: number;
  name: string;
  phone: string;
  email?: string;
  status: string;
  last_interaction?: string;
  created_at: string;
  profile_picture?: string;
}

const statusLabels = {
  novo: "Novo",
  em_conversa: "Em conversa",
  agendado: "Agendado", 
  realizado: "Realizado",
  pos_atendimento: "Pós-atendimento",
  inativo: "Inativo",
  arquivado: "Arquivado",
};

export function Contatos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch contacts
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['/api/contacts', { clinic_id: 1 }],
    queryFn: async () => {
      const response = await fetch('/api/contacts?clinic_id=1');
      if (!response.ok) throw new Error('Erro ao carregar contatos');
      return response.json();
    }
  });

  // Mutation for creating contact
  const createContactMutation = useMutation({
    mutationFn: async (contactData: any) => {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });
      if (!response.ok) throw new Error('Erro ao criar contato');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setIsAddContactOpen(false);
      toast({
        title: "Contato adicionado",
        description: "O novo contato foi criado com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar contato",
        description: "Não foi possível criar o contato. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const filteredContacts = contacts.filter((contact: Contact) => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmitPatient = (data: any) => {
    createContactMutation.mutate(data);
  };

  const handleContactClick = (contact: Contact) => {
    setLocation(`/contato/${contact.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card>
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Contatos
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Gerencie todos os contatos e pacientes da clínica
              </p>
            </div>
            <Button 
              className="bg-medical-blue hover:bg-blue-700 text-white"
              onClick={() => setIsAddContactOpen(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Novo paciente
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="em_conversa">Em conversa</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                  <SelectItem value="pos_atendimento">Pós-atendimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contacts List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Nenhum contato encontrado</p>
              <p className="text-gray-400 mt-2">
                {searchTerm || statusFilter !== "all" 
                  ? "Tente ajustar os filtros de busca" 
                  : "Comece adicionando um novo paciente"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContacts?.map((contact: Contact) => {
                const lastInteraction = contact.last_interaction 
                  ? new Date(contact.last_interaction)
                  : new Date(contact.created_at);

                return (
                  <div
                    key={contact.id}
                    onClick={() => handleContactClick(contact)}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <ContactAvatar 
                        name={contact.name}
                        profilePicture={contact.profile_picture}
                        size="md"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                        <p className="text-sm text-gray-600">{contact.phone}</p>
                        {contact.email && (
                          <p className="text-sm text-gray-500">{contact.email}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          contact.status === 'novo' ? 'bg-blue-100 text-blue-800' :
                          contact.status === 'em_conversa' ? 'bg-yellow-100 text-yellow-800' :
                          contact.status === 'agendado' ? 'bg-purple-100 text-purple-800' :
                          contact.status === 'realizado' ? 'bg-green-100 text-green-800' :
                          contact.status === 'pos_atendimento' ? 'bg-teal-100 text-teal-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {statusLabels[contact.status as keyof typeof statusLabels] || contact.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(lastInteraction, { 
                            addSuffix: true,
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Contact Modal */}
      <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar novo paciente</DialogTitle>
          </DialogHeader>
          
          <PatientForm 
            onSubmit={handleSubmitPatient}
            isSubmitting={createContactMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}