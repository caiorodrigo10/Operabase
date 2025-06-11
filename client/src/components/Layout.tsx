import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

export function Layout({ children, currentPage }: LayoutProps) {
  const isMobile = useMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="h-screen flex bg-slate-50">
      <Sidebar 
        currentPage={currentPage}
        isMobile={isMobile}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />
      
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={closeSidebar}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          currentPage={currentPage} 
          onMenuClick={() => setIsSidebarOpen(true)}
          isMobile={isMobile}
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
