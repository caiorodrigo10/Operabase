import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "@/components/AuthProvider";
import { useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/LoginForm";
import { Layout } from "./components/Layout";
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
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  const { user, loading } = useAuth();
  
  const getCurrentPage = () => {
    if (location === "/") return "dashboard";
    return location.substring(1);
  };

  if (loading) {
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
    return <LoginForm />;
  }

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
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
