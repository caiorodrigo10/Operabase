import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminContextType {
  isAdminView: boolean;
  toggleAdminView: () => void;
  setAdminView: (value: boolean) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [isAdminView, setIsAdminView] = useState<boolean>(false); // Always start with user view

  // Persiste o estado no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('taskmed-admin-view', JSON.stringify(isAdminView));
  }, [isAdminView]);

  const toggleAdminView = () => {
    setIsAdminView(prev => !prev);
  };

  const setAdminView = (value: boolean) => {
    setIsAdminView(value);
  };

  return (
    <AdminContext.Provider value={{ isAdminView, toggleAdminView, setAdminView }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}