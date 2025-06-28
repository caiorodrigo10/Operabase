import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Search, 
  Calendar, 
  Users, 
  MessageCircle, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SearchModal } from "./SearchModal";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navigationItems = [
  { 
    name: "Pesquisar", 
    href: "/contatos", 
    icon: Search, 
    key: "search",
    isSearch: true
  },
  { 
    name: "Agenda", 
    href: "/", 
    icon: Calendar, 
    key: "agenda" 
  },
  { 
    name: "Pacientes", 
    href: "/contatos", 
    icon: Users, 
    key: "pacientes" 
  },
  { 
    name: "Conversas", 
    href: "/conversas", 
    icon: MessageCircle, 
    key: "conversas" 
  },
];

const bottomItems = [
  { 
    name: "Configurações", 
    href: "/configuracoes", 
    icon: Settings, 
    key: "configuracoes" 
  },
];

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
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

  const isActive = (itemKey: string, href: string) => {
    if (itemKey === "agenda") {
      return location === "/" || location.startsWith("/consultas");
    }
    if (itemKey === "pacientes" || itemKey === "search") {
      return location.startsWith("/contatos");
    }
    if (itemKey === "conversas") {
      return location.startsWith("/conversas");
    }
    if (itemKey === "configuracoes") {
      return location.startsWith("/configuracoes");
    }
    return location === href;
  };

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSearchModalOpen(true);
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-slate-200 z-40 transition-all duration-300 ease-in-out flex flex-col",
        isCollapsed ? "w-16" : "w-60"
      )}>
        {/* Logo Section */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 h-16">
          {!isCollapsed && (
            <Link href="/" className="flex items-center">
              <img 
                src="https://lkwrevhxugaxfpwiktdy.supabase.co/storage/v1/object/sign/docsgerais/operabaselogo.svg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82ZGMzM2E3My1kMjMyLTQwNTgtOWZkYi02ODBjZmZkMWY2MmEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkb2NzZ2VyYWlzL29wZXJhYmFzZWxvZ28uc3ZnIiwiaWF0IjoxNzUwOTkxMzg4LCJleHAiOjE3ODI1MjczODh9.idPoup3H2OxyHM6fY6Vxbt5iMAMdHY7nNiu8rpGfTPk" 
                alt="Operabase" 
                className="h-8 w-auto object-contain"
              />
            </Link>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.key, item.href);
            
            if (item.isSearch) {
              const content = (
                <button
                  onClick={handleSearchClick}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                    active
                      ? "bg-teal-50 text-teal-700 border border-teal-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </button>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.key}>
                    <TooltipTrigger asChild>
                      {content}
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.name}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.key}>{content}</div>;
            }
            
            const content = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  active
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.key}>
                  <TooltipTrigger asChild>
                    {content}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.key}>{content}</div>;
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-slate-200 space-y-1">
          {/* Settings */}
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.key, item.href);
            
            const content = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  active
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.key}>
                  <TooltipTrigger asChild>
                    {content}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.key}>{content}</div>;
          })}

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                isCollapsed && "justify-center"
              )}>
                <div className="h-8 w-8 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-medium">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </span>
                </div>
                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium truncate">{user?.name || 'Usuário'}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align={isCollapsed ? "start" : "end"} side={isCollapsed ? "right" : "top"}>
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
              <DropdownMenuItem onClick={handleLogout} className="flex items-center w-full text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search Modal */}
        <SearchModal 
          isOpen={isSearchModalOpen} 
          onClose={() => setIsSearchModalOpen(false)} 
        />
      </div>
    </TooltipProvider>
  );
}