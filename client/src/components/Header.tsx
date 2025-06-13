import { Menu, LogOut, User } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "wouter";

interface HeaderProps {
  currentPage: string;
  onMenuClick: () => void;
  isMobile: boolean;
}

const pageTitles = {
  dashboard: "Dashboard",
  conversas: "Conversas",
  pipeline: "Pipeline",
  consultas: "Consultas",
  contatos: "Contatos",
  relatorios: "Relatórios",
  configuracoes: "Configurações",
  "livia-config": "Configurações da Livia IA",
};

export function Header({ currentPage, onMenuClick, isMobile }: HeaderProps) {
  const pageTitle = pageTitles[currentPage as keyof typeof pageTitles] || "Dashboard";
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
    },
    onSuccess: () => {
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado do sistema",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no logout",
        description: error.message || "Erro ao fazer logout",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {isMobile && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-md text-slate-400 hover:text-slate-600"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-semibold text-slate-800">{pageTitle}</h1>
            <p className="text-sm text-slate-500">
              Taskmed - Sistema de Gestão de Clínicas
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-800">{user?.name || 'Usuário'}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700">
                <span className="text-white text-sm font-medium">
                  {user?.name ? getInitials(user.name) : 'U'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user?.name}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/perfil" className="flex items-center w-full">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{logoutMutation.isPending ? "Saindo..." : "Sair"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
