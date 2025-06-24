import React, { useState, useEffect } from 'react';
import { TitleWidget as TitleWidgetData } from '../stores/editor2Store';
import { TitleWidget } from '../components/editor2/Widgets/TitleWidget/TitleWidget';

interface PreviewPageProps {
  pageId?: string;
}

interface Editor2PageJSON {
  id: string;
  version: string;
  metadata: {
    title: string;
    createdAt: string;
    updatedAt: string;
  };
  layout: {
    type: string;
    columns: number;
    gap: number;
  };
  globalSettings: any;
  blocks: any[];
}

export const PreviewPage: React.FC<PreviewPageProps> = ({ pageId = 'editor2' }) => {
  const [pageData, setPageData] = useState<Editor2PageJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const response = await fetch(`/api/load-page-json/${pageId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          const pageJson: Editor2PageJSON = JSON.parse(result.data);
          setPageData(pageJson);
        } else {
          // Try localStorage fallback
          const savedState = localStorage.getItem('editor2_page_state');
          if (savedState) {
            const pageJson: Editor2PageJSON = JSON.parse(savedState);
            setPageData(pageJson);
          } else {
            setError('Nenhuma página encontrada para preview');
          }
        }
      } catch (err) {
        console.error('Error loading page for preview:', err);
        setError('Erro ao carregar página');
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, [pageId]);

  const renderWidget = (widget: any, blockId: string, columnId: string) => {
    switch (widget.type) {
      case 'title':
        return (
          <TitleWidget
            key={widget.id}
            widget={widget as TitleWidgetData}
            columnId={columnId}
            blockId={blockId}
          />
        );
      default:
        return (
          <div key={widget.id} className="p-4 bg-gray-100 rounded text-center">
            Widget {widget.type} não implementado
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Erro no Preview</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Página Vazia</h1>
          <p className="text-gray-600">Nenhum conteúdo foi criado ainda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                {pageData.metadata.title}
              </h1>
              <p className="text-sm text-gray-500">
                Preview da página criada no Editor
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                ✓ Live Preview
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="max-w-6xl mx-auto py-8">
        <div className="space-y-6">
          {pageData.blocks.map((block) => (
            <div key={block.id} className="block-container">
              <div 
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${block.columns.length}, 1fr)`,
                }}
              >
                {block.columns.map((column: any) => (
                  <div key={column.id} className="column-container bg-white rounded-lg shadow-sm p-6">
                    <div className="space-y-4">
                      {column.widgets.map((widget: any) => 
                        renderWidget(widget, block.id, column.id)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {pageData.blocks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎨</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Página em Branco</h2>
            <p className="text-gray-600">
              Volte ao editor para adicionar conteúdo à sua página
            </p>
          </div>
        )}
      </div>

      {/* Preview Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="text-center text-sm text-gray-500">
            Criado com Editor2 • {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>
    </div>
  );
};