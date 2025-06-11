import { Menu } from "lucide-react";
import { mockClinic } from "@/lib/mock-data";

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
};

export function Header({ currentPage, onMenuClick, isMobile }: HeaderProps) {
  const pageTitle = pageTitles[currentPage as keyof typeof pageTitles] || "Dashboard";

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
              {mockClinic.name} - {mockClinic.responsible}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-800">{mockClinic.responsible}</p>
            <p className="text-xs text-slate-500">Última atividade: agora</p>
          </div>
          <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">MS</span>
          </div>
        </div>
      </div>
    </header>
  );
}
