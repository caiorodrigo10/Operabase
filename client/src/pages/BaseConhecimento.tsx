import { ChevronLeft, BookOpen, Users, Building } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import FontesConhecimento from "./base-conhecimento/FontesConhecimento";
import Profissionais from "./base-conhecimento/Profissionais";
import Empresa from "./base-conhecimento/Empresa";

export default function BaseConhecimento() {
  const [location] = useLocation();

  // Determine active section from URL or default to fontes
  const currentSection = location.includes("/base-conhecimento/") 
    ? location.split("/base-conhecimento/")[1] || "fontes"
    : "fontes";

  const navigationItems = [
    {
      key: "fontes",
      name: "Fontes de Conhecimento",
      icon: BookOpen,
      href: "/base-conhecimento/fontes"
    },
    {
      key: "profissionais",
      name: "Profissionais", 
      icon: Users,
      href: "/base-conhecimento/profissionais"
    },
    {
      key: "empresa",
      name: "Empresa",
      icon: Building,
      href: "/base-conhecimento/empresa"
    }
  ];

  const renderContent = () => {
    switch (currentSection) {
      case "profissionais":
        return <Profissionais />;
      case "empresa":
        return <Empresa />;
      default:
        return <FontesConhecimento />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-gray-700 transition-colors">
              Dashboard
            </Link>
            <span>›</span>
            <Link href="/trabalhadores-digitais" className="hover:text-gray-700 transition-colors">
              Trabalhadores Digitais
            </Link>
            <span>›</span>
            <span className="text-gray-900">Base de Conhecimento</span>
          </div>

          {/* Page Title */}
          <div className="flex items-center gap-4 mb-2">
            <Link href="/trabalhadores-digitais">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Base de Conhecimento
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Central de treinamento e informações para seus assistentes de IA
          </p>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.key === currentSection;
                  
                  return (
                    <Link key={item.key} href={item.href}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                          isActive
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.name}
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}