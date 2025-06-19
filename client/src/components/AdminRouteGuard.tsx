import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/contexts/AdminContext';

interface AdminRouteGuardProps {
  children: ReactNode;
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { user } = useAuth();
  const { setAdminView } = useAdmin();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user has admin privileges
    const hasAdminAccess = user?.role === 'super_admin' || user?.role === 'admin';
    
    if (!hasAdminAccess) {
      // Redirect to dashboard if no admin access
      setLocation('/');
      setAdminView(false);
      return;
    }

    // Ensure admin view is enabled for admin routes
    setAdminView(true);
  }, [user, setLocation, setAdminView]);

  // Don't render children if user doesn't have admin access
  const hasAdminAccess = user?.role === 'super_admin' || user?.role === 'admin';
  
  if (!hasAdminAccess) {
    return null;
  }

  return <>{children}</>;
}