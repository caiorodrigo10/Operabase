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
          dangerouslySetInnerHTML={{ __html: content }}
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