import { useState, useEffect } from 'react';

const SIDEBAR_STORAGE_KEY = 'operabase-sidebar-collapsed';

export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed((prev: boolean) => !prev);
  };

  return {
    isCollapsed,
    toggleCollapse,
  };
}