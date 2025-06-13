import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableNoteProps {
  content: string;
  maxHeight?: number;
  className?: string;
}

export default function ExpandableNote({ content, maxHeight = 150, className = "" }: ExpandableNoteProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Converter markdown para HTML
  const markdownToHtml = (markdown: string): string => {
    if (!markdown) return "";
    
    return markdown
      // Títulos
      .replace(/^### (.*$)/gm, '<h3 style="font-size: 1.125rem; font-weight: 600; margin: 1rem 0 0.5rem 0; color: #374151;">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 style="font-size: 1.25rem; font-weight: 700; margin: 1.5rem 0 0.75rem 0; color: #1f2937;">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 style="font-size: 1.5rem; font-weight: 800; margin: 1.5rem 0 1rem 0; color: #111827;">$1</h1>')
      
      // Negrito e itálico
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600; color: #111827;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #374151;">$1</em>')
      .replace(/<u>(.*?)<\/u>/g, '<span style="text-decoration: underline;">$1</span>')
      
      // Listas não ordenadas
      .replace(/^- (.*$)/gm, '<li style="margin: 0.25rem 0; padding-left: 0.5rem;">$1</li>')
      
      // Listas ordenadas
      .replace(/^(\d+)\. (.*$)/gm, '<li style="margin: 0.25rem 0; padding-left: 0.5rem;">$2</li>')
      
      // Citações
      .replace(/^> (.*$)/gm, '<blockquote style="border-left: 4px solid #d1d5db; padding-left: 1rem; margin: 1rem 0; color: #6b7280; font-style: italic;">$1</blockquote>')
      
      // Quebras de linha duplas para parágrafos
      .replace(/\n\n/g, '</p><p style="margin: 0.75rem 0; line-height: 1.6;">')
      .replace(/\n/g, '<br>')
      
      // Envolver em parágrafos se não começar com título ou lista
      .replace(/^(.*)$/gm, (match) => {
        if (match.startsWith('<h') || match.startsWith('<li') || match.startsWith('<blockquote') || match.startsWith('</p>') || match.startsWith('<p')) {
          return match;
        }
        return `<p style="margin: 0.75rem 0; line-height: 1.6;">${match}</p>`;
      })
      
      // Processar listas
      .replace(/(<li[^>]*>.*?<\/li>(\s*<br>)*)+/g, (match) => {
        if (match.includes('1.')) {
          return `<ol style="margin: 1rem 0; padding-left: 1.5rem; list-style-type: decimal;">${match.replace(/<br>/g, '')}</ol>`;
        } else {
          return `<ul style="margin: 1rem 0; padding-left: 1.5rem; list-style-type: disc;">${match.replace(/<br>/g, '')}</ul>`;
        }
      })
      
      // Limpar múltiplas quebras
      .replace(/<br><br>/g, '<br>')
      .replace(/\n{3,}/g, '\n\n');
  };

  // Verificar se precisa de expansão após renderização
  useEffect(() => {
    if (contentRef.current) {
      const element = contentRef.current;
      if (element.scrollHeight > maxHeight) {
        setNeedsExpansion(true);
      }
    }
  }, [content, maxHeight]);

  return (
    <div className="space-y-2">
      <div 
        ref={contentRef}
        className="overflow-hidden transition-all duration-300"
        style={{ 
          maxHeight: isExpanded ? 'none' : `${maxHeight}px`,
          position: 'relative'
        }}
      >
        <div 
          className={`${className}`}
          dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
          style={{
            lineHeight: '1.6',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        />
        
        {/* Gradiente de fade quando não expandido */}
        {needsExpansion && !isExpanded && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"
          />
        )}
      </div>
      
      {needsExpansion && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Ver menos
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              Ver mais
            </>
          )}
        </Button>
      )}
    </div>
  );
}