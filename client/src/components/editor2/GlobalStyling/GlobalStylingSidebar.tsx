import React, { useEffect, useRef } from 'react';
import { X, Play, Type, FileText, Palette, Layout, Square } from 'lucide-react';

interface GlobalStylingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SidebarHeader: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="border-b border-gray-200 pb-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-gray-900">Global Styling</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Changing the global settings will affect the styling on all pages.
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Need help?</span>
        <button className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 transition-colors">
          <span>Play Video</span>
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <Play className="w-3 h-3 text-white fill-white" />
          </div>
        </button>
      </div>
    </div>
  );
};

const MenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 hover:shadow-sm rounded-lg transition-all group border-l-2 border-transparent hover:border-blue-500"
    >
      <div className="text-gray-600 group-hover:text-blue-600 transition-colors">
        {icon}
      </div>
      <span className="text-base font-medium text-gray-700 group-hover:text-gray-900">
        {label}
      </span>
    </button>
  );
};

const SidebarContent: React.FC = () => {
  const menuItems = [
    {
      id: 'text-styling',
      icon: <Type className="w-5 h-5" />,
      label: 'Text Styling'
    },
    {
      id: 'add-fonts',
      icon: <FileText className="w-5 h-5" />,
      label: 'Add Fonts'
    },
    {
      id: 'color-palette',
      icon: <div className="flex gap-1">
        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
      </div>,
      label: 'Color Palette'
    },
    {
      id: 'website-layout',
      icon: <Layout className="w-5 h-5" />,
      label: 'Website Layout'
    },
    {
      id: 'page-styling',
      icon: <Square className="w-5 h-5" />,
      label: 'Page Styling'
    }
  ];

  const handleMenuItemClick = (itemId: string) => {
    console.log(`Navigate to ${itemId} submenu`);
    // TODO: Implement submenu navigation
  };

  return (
    <div className="flex-1 space-y-2">
      {menuItems.map((item) => (
        <MenuItem
          key={item.id}
          icon={item.icon}
          label={item.label}
          onClick={() => handleMenuItemClick(item.id)}
        />
      ))}
    </div>
  );
};

const SidebarFooter: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="border-t border-gray-200 pt-4 mt-6">
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
          Confirm
        </button>
      </div>
    </div>
  );
};

export const GlobalStylingSidebar: React.FC<GlobalStylingSidebarProps> = ({
  isOpen,
  onClose
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Focus trap
      sidebarRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300" />
      
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="relative bg-white w-80 md:w-80 sm:w-80 xs:w-full h-full shadow-xl transform transition-transform duration-300 ease-out flex flex-col"
        style={{
          animation: isOpen ? 'slideInFromLeft 300ms ease-out' : 'slideOutToLeft 250ms ease-in'
        }}
        tabIndex={-1}
      >
        <div className="p-6 flex flex-col h-full">
          <SidebarHeader onClose={onClose} />
          <SidebarContent />
          <SidebarFooter onClose={onClose} />
        </div>
      </div>
      
      {/* Spacer to push content */}
      <div className="flex-1" onClick={handleBackdropClick} />
    </div>
  );
};