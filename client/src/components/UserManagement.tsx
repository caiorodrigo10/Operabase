import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Shield, ShieldCheck, History, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'usuario';
  is_professional: boolean;
  is_active: boolean;
  joined_at: string;
  last_login?: string;
}

interface AuditLog {
  id: number;
  target_user_name: string;
  changed_by_user_name: string;
  action: 'activated' | 'deactivated';
  previous_status: boolean;
  new_status: boolean;
  notes?: string;
  ip_address?: string;
  created_at: string;
}

interface UserManagementProps {
  clinicId: number;
}

export function UserManagement({ clinicId }: UserManagementProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notes, setNotes] = useState('');
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch users for management
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: [`/api/clinic/${clinicId}/users/management`],
    enabled: !!clinicId
  });

  // Fetch audit log
  const { data: auditLog = [], isLoading: auditLoading } = useQuery({
    queryKey: [`/api/clinic/${clinicId}/audit/professional-status`],
    enabled: showAuditDialog && !!clinicId
  });

  // Update professional status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, isProfessional, notes }: { userId: number; isProfessional: boolean; notes?: string }) => {
      const response = await fetch(`/api/clinic/${clinicId}/users/${userId}/professional-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sb-lkwrevhxugaxfpwiktdy-auth-token') ? JSON.parse(localStorage.getItem('sb-lkwrevhxugaxfpwiktdy-auth-token') || '{}').access_token : ''}`
        },
        body: JSON.stringify({
          user_id: userId,
          is_professional: isProfessional,
          notes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update professional status');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clinic/${clinicId}/users/management`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clinic/${clinicId}/audit/professional-status`] });
      toast({
        title: "Status atualizado",
        description: data.message,
      });
      setNotes('');
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleStatusChange = (user: User, isProfessional: boolean) => {
    if (user.role === 'admin' && !isProfessional) {
      toast({
        title: "Ação não permitida",
        description: "Administradores não podem ter o status profissional removido",
        variant: "destructive",
      });
      return;
    }

    setSelectedUser(user);
    updateStatusMutation.mutate({
      userId: user.id,
      isProfessional,
      notes: notes.trim() || undefined
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (usersLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2">Carregando usuários...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gerenciamento de Usuários
          </h2>
          <p className="text-gray-600 mt-1">
            Controle o acesso a recursos avançados da clínica
          </p>
        </div>
        
        <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Ver Auditoria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log de Auditoria - Status Profissional</DialogTitle>
              <DialogDescription>
                Histórico de alterações no status profissional dos usuários
              </DialogDescription>
            </DialogHeader>
            
            {auditLoading ? (
              <div className="flex items-center justify-center p-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2">Carregando auditoria...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {auditLog.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    Nenhuma alteração registrada ainda
                  </p>
                ) : (
                  auditLog.map((log: AuditLog) => (
                    <Card key={log.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {log.target_user_name} - Status {log.action === 'activated' ? 'Ativado' : 'Desativado'}
                          </div>
                          <div className="text-sm text-gray-600">
                            Por: {log.changed_by_user_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(log.created_at)}
                          </div>
                          {log.notes && (
                            <div className="text-sm bg-gray-50 p-2 rounded mt-2">
                              <strong>Observações:</strong> {log.notes}
                            </div>
                          )}
                        </div>
                        <Badge variant={log.action === 'activated' ? 'default' : 'secondary'}>
                          {log.previous_status ? 'Profissional' : 'Usuário'} → {log.new_status ? 'Profissional' : 'Usuário'}
                        </Badge>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Apenas usuários com status "Profissional" podem acessar recursos como integração com Google Calendar. 
          Administradores sempre têm acesso a todos os recursos.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {users.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Nenhum usuário encontrado na clínica</p>
            </CardContent>
          </Card>
        ) : (
          users.map((user: User) => (
            <Card key={user.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {user.role === 'admin' ? (
                      <ShieldCheck className="h-8 w-8 text-blue-600" />
                    ) : user.is_professional ? (
                      <Shield className="h-8 w-8 text-green-600" />
                    ) : (
                      <Users className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </Badge>
                      {user.is_professional && (
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          Profissional
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600">{user.email}</p>
                    <div className="text-sm text-gray-500 mt-1">
                      Entrou em: {formatDate(user.joined_at)}
                      {user.last_login && (
                        <span className="ml-4">
                          Último acesso: {formatDate(user.last_login)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-700">
                      Status Profissional
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-600">
                        {user.is_professional ? 'Ativo' : 'Inativo'}
                      </span>
                      <Switch
                        checked={user.is_professional}
                        onCheckedChange={(checked) => handleStatusChange(user, checked)}
                        disabled={updateStatusMutation.isPending || user.role === 'admin'}
                      />
                    </div>
                    {user.role === 'admin' && (
                      <div className="text-xs text-blue-600 mt-1">
                        Admins sempre têm acesso
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedUser?.id === user.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações sobre a alteração (opcional):
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Motivo da alteração do status profissional..."
                    className="w-full"
                    rows={3}
                  />
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}