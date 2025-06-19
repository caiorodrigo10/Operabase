import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "@/components/AuthProvider";
import { AdminProvider, useAdmin } from "@/contexts/AdminContext";
import { useAuth } from "@/hooks/useAuth";
import { useGleap } from "@/hooks/useGleap";
import { LoginForm } from "@/components/LoginForm";
import { Layout } from "./components/Layout";
import { AdminLayout } from "./components/AdminLayout";
import { AdminRouteGuard } from "./components/AdminRouteGuard";
import { Dashboard } from "./pages/dashboard";
import { Conversas } from "./pages/conversas";
import { Pipeline } from "./pages/pipeline";
import { Consultas } from "./pages/consultas";
import { Contatos } from "./pages/contatos";
import { Configuracoes } from "./pages/configuracoes";
import { LiviaConfig } from "./pages/livia-config";
import { ContatoDetalhes } from "./pages/contato-detalhes";
// import { Prontuario } from "./pages/prontuario";
import { Perfil } from "./pages/perfil";
import { RecuperarSenha } from "./pages/recuperar-senha";
import { ResetPassword } from "./pages/reset-password";
import ChatDeTeste from "./pages/chat-de-teste";
import MCPTestPage from "./pages/mcp-test";
import ApiKeysPage from "./pages/api-keys";
import { AdminDashboard } from "./pages/admin/dashboard";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  const { user, loading } = useAuth();
  const { isAdminView } = useAdmin();
  
  console.log('🔍 Router state:', { user: !!user, loading, location });
  
  const getCurrentPage = () => {
    if (location === "/") return "dashboard";
    return location.substring(1);
  };

  if (loading) {
    console.log('⏳ Loading state - showing skeleton');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🔑 No user - showing login form');
    
    // Check if this is a password reset page
    if (location === '/reset-password') {
      return <ResetPassword />;
    }
    
    return <LoginForm />;
  }

  console.log('✅ User authenticated - showing main app');



  // Default user layout with admin route protection
  return (
    <Layout currentPage={getCurrentPage()}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/conversas" component={Conversas} />
        <Route path="/pipeline" component={Pipeline} />
        <Route path="/consultas" component={Consultas} />
        <Route path="/contatos" component={Contatos} />
        <Route path="/contatos/:id" component={ContatoDetalhes} />
        {/* <Route path="/prontuario/:id?" component={Prontuario} /> */}
        <Route path="/configuracoes" component={Configuracoes} />
        <Route path="/livia-config" component={LiviaConfig} />
        <Route path="/perfil" component={Perfil} />
        <Route path="/chatdeteste" component={ChatDeTeste} />
        <Route path="/mcptest" component={MCPTestPage} />
        <Route path="/api-keys" component={ApiKeysPage} />
        {/* Protected Admin Routes */}
        <Route path="/admin" component={() => (
          <AdminRouteGuard>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </AdminRouteGuard>
        )} />
        <Route path="/admin/clinics" component={() => (
          <AdminRouteGuard>
            <AdminLayout>
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Gestão de Clínicas</h1>
                <p className="text-gray-600">Página em desenvolvimento...</p>
              </div>
            </AdminLayout>
          </AdminRouteGuard>
        )} />
        <Route path="/admin/users" component={() => (
          <AdminRouteGuard>
            <AdminLayout>
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Gestão de Usuários</h1>
                <p className="text-gray-600">Página em desenvolvimento...</p>
              </div>
            </AdminLayout>
          </AdminRouteGuard>
        )} />
        <Route path="/admin/settings" component={() => (
          <AdminRouteGuard>
            <AdminLayout>
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Configurações do Sistema</h1>
                <p className="text-gray-600">Página em desenvolvimento...</p>
              </div>
            </AdminLayout>
          </AdminRouteGuard>
        )} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function GleapWrapper() {
  useGleap(); // Initialize Gleap with user data
  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminProvider>
          <TooltipProvider>
            <Toaster />
            <GleapWrapper />
          </TooltipProvider>
        </AdminProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
