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
        </div>
      </div>

      {/* User List */}
      <div className="grid gap-4">
        {users.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Nenhum usuário encontrado na clínica</p>
            </CardContent>
          </Card>
        ) : (
          users.map((user: User) => (
            <Card key={user.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url} alt={user.name} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* User Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{user.name}</h3>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                </div>

                {/* Edit Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditUser(user)}
                  className="flex items-center gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere o role e status profissional do usuário.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 font-medium text-lg">
                    {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Função</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value: 'admin' | 'usuario') => 
                    setSelectedUser(prev => prev ? { ...prev, role: value } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usuario">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-professional"
                  checked={selectedUser.is_professional}
                  onCheckedChange={(checked) => 
                    setSelectedUser(prev => prev ? { ...prev, is_professional: checked } : null)
                  }
                />
                <Label htmlFor="edit-professional">Status Profissional</Label>
              </div>
              <p className="text-sm text-gray-600">
                Usuários com status profissional têm acesso a recursos avançados como integração de calendário.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={updateUserMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateUserMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}