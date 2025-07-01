/**
 * Button - Componente base para botões
 * Renderiza botão com suporte a estilos e variantes
 */

import React from 'react';

interface ButtonProps {
  text?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  text = 'Botão',
  children,
  style,
  className = '',
  variant = 'primary',
  size = 'md',
  onClick
}) => {
  // Classes base para variantes
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border-2 border-blue-600 text-blue-600 bg-transparent hover:bg-blue-600 hover:text-white'
  };

  // Classes base para tamanhos
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const combinedClassName = [
    'font-semibold rounded-lg transition-colors duration-200 cursor-pointer inline-block',
    variantClasses[variant],
    sizeClasses[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={combinedClassName}
      style={style}
      onClick={onClick}
    >
      {children || text}
    </button>
  );
};