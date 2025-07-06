import React from 'react';
import { DebugPanel } from '@/components/DebugPanel';

export default function DebugPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔍 Debug - Análise de Conectividade</h1>
        <p className="text-gray-600">
          Ferramenta para diagnosticar problemas de comunicação entre frontend e backend
        </p>
      </div>
      
      <DebugPanel />
    </div>
  );
} 