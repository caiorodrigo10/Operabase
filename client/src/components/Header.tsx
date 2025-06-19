import React from "react";
import { 
  Menu, 
  LogOut, 
  User, 
  Search, 
  Bell, 
  MessageCircle, 
  RotateCcw, 
  Settings,
  Stethoscope
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { SearchModal } from "./SearchModal";
import { useState } from "react";

interface HeaderProps {
  currentPage: string;
  onMenuClick: () => void;
  isMobile: boolean;
}

// Navigation items for the new horizontal menu
const navigationItems = [
  { name: "Painel", href: "/", key: "dashboard" },
  { name: "Agenda", href: "/consultas", key: "consultas" },
  { name: "Pacientes", href: "/contatos", key: "contatos" },
];

// Right side icon buttons
const iconButtons = [
  { 
    icon: Search, 
    tooltip: "Procurar Pacientes", 
    href: "/contatos",
    active: true,
    isSearch: true
  },
  { 
    icon: Bell, 
    tooltip: "Notificações", 
    href: "#",
    active: false 
  },
  { 
    icon: MessageCircle, 
    tooltip: "Conversas", 
    href: "/conversas",
    active: true 
  },
  { 
    icon: RotateCcw, 
    tooltip: "Central de Retornos", 
    href: "#",
    active: false 
  },
  { 
    icon: Settings, 
    tooltip: "Configurações Gerais", 
    href: "/configuracoes",
    active: true 
  },
];

export function Header({ currentPage, onMenuClick, isMobile }: HeaderProps) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

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

  const handleInactiveClick = (tooltip: string) => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: `${tooltip} estará disponível em breve`,
      variant: "default",
    });
  };

  return (
    <TooltipProvider>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Left Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-slate-800 hidden sm:block">
                Taskmed
              </span>
            </Link>

            {/* Main Navigation - Hidden on mobile */}
            <nav className="hidden md:flex items-center space-x-6">
              {navigationItems.map((item) => {
                const isActive = location === item.href || 
                  (item.key === "dashboard" && location === "/") ||
                  (item.key === "contatos" && location.startsWith("/contatos")) ||
                  (item.key === "consultas" && location.startsWith("/consultas"));
                
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Menu Button */}
            {isMobile && (
              <button
                onClick={onMenuClick}
                className="p-2 rounded-md text-slate-400 hover:text-slate-600 md:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Right Side Icons and User Menu */}
          <div className="flex items-center space-x-3">
            {/* Icon Buttons */}
            <div className="hidden sm:flex items-center space-x-2">
              {iconButtons.map((button, index) => {
                const Icon = button.icon;
                
                if (!button.active) {
                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          onClick={() => handleInactiveClick(button.tooltip)}
                        >
                          <Icon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{button.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                // Special handling for search button
                if (button.isSearch) {
                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          onClick={() => setIsSearchModalOpen(true)}
                        >
                          <Icon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{button.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        asChild
                      >
                        <Link href={button.href}>
                          <Icon className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{button.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-800">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700">
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
        </div>

        {/* Mobile Navigation Menu */}
        {isMobile && (
          <nav className="mt-3 pt-3 border-t border-slate-200 flex space-x-4 md:hidden">
            {navigationItems.map((item) => {
              const isActive = location === item.href || 
                (item.key === "dashboard" && location === "/") ||
                (item.key === "contatos" && location.startsWith("/contatos")) ||
                (item.key === "consultas" && location.startsWith("/consultas"));
              
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Search Modal */}
        <SearchModal 
          isOpen={isSearchModalOpen} 
          onClose={() => setIsSearchModalOpen(false)} 
        />
      </header>
    </TooltipProvider>
  );
}
