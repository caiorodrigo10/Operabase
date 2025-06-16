import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pencil, Plus, User, Users, UserPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'usuario';
  is_professional: boolean;
  is_active: boolean;
  joined_at: string;
  last_login?: string;
  avatar_url?: string;
}

interface UserManagementProps {
  clinicId: number;
}

export function UserManagement({ clinicId }: UserManagementProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    role: 'usuario' as 'admin' | 'usuario',
    is_professional: false
  });
  const queryClient = useQueryClient();

  // Fetch users for management
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: [`/api/clinic/${clinicId}/users/management`],
    enabled: !!clinicId
  });

  // Update user mutation (role and professional status)
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, role, isProfessional }: { userId: number; role: string; isProfessional: boolean }) => {
      const response = await fetch(`/api/clinic/${clinicId}/users/${userId}/professional-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sb-lkwrevhxugaxfpwiktdy-auth-token') ? JSON.parse(localStorage.getItem('sb-lkwrevhxugaxfpwiktdy-auth-token') || '{}').access_token : ''}`
        },
        body: JSON.stringify({
          user_id: userId,
          is_professional: isProfessional,
          role: role,
          notes: `Role atualizado para ${role}, Status profissional: ${isProfessional ? 'Ativo' : 'Inativo'}`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clinic/${clinicId}/users/management`] });
      toast({
        title: "Usuário atualizado",
        description: data.message,
      });
      setEditDialogOpen(false);
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

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUserData) => {
      return await apiRequest(`/api/clinic/${clinicId}/users`, {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clinic/${clinicId}/users/management`] });
      toast({
        title: "Usuário criado",
        description: data.message,
      });
      setCreateDialogOpen(false);
      setNewUserData({
        name: '',
        email: '',
        role: 'usuario',
        is_professional: false
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || 'Erro interno do servidor',
        variant: "destructive",
      });
    }
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;
    
    updateUserMutation.mutate({
      userId: selectedUser.id,
      role: selectedUser.role,
      isProfessional: selectedUser.is_professional
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
        
        <div className="flex gap-2">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <UserPlus className="h-4 w-4" />
                Criar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Adicione um novo usuário à clínica. O usuário será automaticamente vinculado a esta clínica.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome completo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Digite o email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Select
                    value={newUserData.role}
                    onValueChange={(value: 'admin' | 'usuario') => 
                      setNewUserData(prev => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usuario">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="professional"
                    checked={newUserData.is_professional}
                    onCheckedChange={(checked) => 
                      setNewUserData(prev => ({ ...prev, is_professional: checked }))
                    }
                  />
                  <Label htmlFor="professional">Status Profissional</Label>
                </div>
                <p className="text-sm text-gray-600">
                  Usuários com status profissional têm acesso a recursos avançados como integração de calendário.
                </p>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => createUserMutation.mutate(newUserData)}
                  disabled={createUserMutation.isPending || !newUserData.name || !newUserData.email}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
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