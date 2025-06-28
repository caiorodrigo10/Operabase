import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/hooks/useSidebar";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

export function Layout({ children, currentPage }: LayoutProps) {
  const isMobile = useMobile();
  const { isCollapsed, toggleCollapse } = useSidebar();

  // On mobile, don't show sidebar
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-slate-50">
        <Header 
          currentPage={currentPage} 
          onMenuClick={() => {}}
          isMobile={isMobile}
        />
        <main className="flex-1 overflow-auto pt-20">
          {children}
        </main>
      </div>
    );
  }

  // Desktop layout with sidebar
  return (
    <div className="h-screen flex bg-slate-50">
      <Sidebar 
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />
      <div className="flex-1 flex flex-col" style={{ marginLeft: isCollapsed ? '64px' : '240px' }}>
        <Header 
          currentPage={currentPage} 
          onMenuClick={() => {}}
          isMobile={false}
          showNavigation={false} // Hide navigation in header when sidebar is present
        />
        <main className="flex-1 overflow-auto pt-20">
          {children}
        </main>
      </div>
    </div>
  );
}
