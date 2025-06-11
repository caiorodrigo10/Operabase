import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockContacts } from "@/lib/mock-data";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels = {
  novo: { label: "Novo", color: "bg-slate-100 text-slate-800" },
  em_conversa: { label: "Em conversa", color: "bg-blue-100 text-blue-800" },
  agendado: { label: "Agendado", color: "bg-green-100 text-green-800" },
  realizado: { label: "Realizado", color: "bg-purple-100 text-purple-800" },
  pos_atendimento: { label: "Pós-atendimento", color: "bg-emerald-100 text-emerald-800" },
};

export function Contatos() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const filteredContacts = mockContacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-96 bg-slate-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <Card>
        <CardHeader className="border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Contatos</h2>
              <p className="text-slate-600">Gerencie todos os contatos da clínica</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="agendado">Agendou</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="pos_atendimento">Pós-atendimento</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Buscar contato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Primeiro Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status Atual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredContacts.map((contact) => {
                  const status = statusLabels[contact.status as keyof typeof statusLabels];
                  const initials = contact.name.split(' ').map(n => n[0]).join('').toUpperCase();
                  const timeAgo = formatDistanceToNow(contact.first_contact!, { 
                    addSuffix: true, 
                    locale: ptBR 
                  });

                  return (
                    <tr key={contact.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">{initials}</span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-slate-900">{contact.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {contact.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {timeAgo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button variant="link" className="text-medical-blue hover:text-blue-700 p-0">
                          Ver conversa
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Mostrando 1-{filteredContacts.length} de {mockContacts.length} contatos
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
                <Button size="sm">
                  1
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Próximo
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
