import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Heading1,
  Heading2,
  Heading3,
  Quote
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Converter markdown para HTML formatado
  const markdownToHtml = (markdown: string): string => {
    if (!markdown) return '<p><br></p>';
    
    let html = markdown
      // Títulos
      .replace(/^### (.*$)/gm, '<h3 style="font-size: 1.125rem; font-weight: 500; margin: 1rem 0 0.5rem 0; color: #374151;">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 style="font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.75rem 0; color: #1f2937;">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 style="font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 1rem 0; color: #111827;">$1</h1>')
      
      // Negrito e itálico
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600; color: #111827;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #374151;">$1</em>')
      .replace(/<u>(.*?)<\/u>/g, '<span style="text-decoration: underline;">$1</span>')
      
      // Listas não ordenadas
      .replace(/^- (.*$)/gm, '<li style="margin: 0.25rem 0; padding-left: 0.5rem;">$1</li>')
      
      // Listas ordenadas
      .replace(/^(\d+)\. (.*$)/gm, '<li style="margin: 0.25rem 0; padding-left: 0.5rem;" data-number="$1">$2</li>')
      
      // Citações
      .replace(/^> (.*$)/gm, '<blockquote style="border-left: 4px solid #d1d5db; padding-left: 1rem; margin: 1rem 0; color: #6b7280; font-style: italic;">$1</blockquote>')
      
      // Quebras de linha
      .replace(/\n\n/g, '</p><p style="margin: 0.5rem 0; line-height: 1.6;">')
      .replace(/\n/g, '<br>');

    // Envolver em parágrafos se não começar com título ou lista
    if (!html.startsWith('<h') && !html.startsWith('<li') && !html.startsWith('<blockquote')) {
      html = `<p style="margin: 0.5rem 0; line-height: 1.6;">${html}</p>`;
    }

    // Processar listas
    html = html.replace(/(<li[^>]*>.*?<\/li>(\s*<br>)*)+/g, (match) => {
      if (match.includes('data-number')) {
        return `<ol style="margin: 0.5rem 0; padding-left: 1.5rem;">${match.replace(/<br>/g, '')}</ol>`;
      } else {
        return `<ul style="margin: 0.5rem 0; padding-left: 1.5rem; list-style-type: disc;">${match.replace(/<br>/g, '')}</ul>`;
      }
    });

    return html;
  };

  // Converter HTML de volta para markdown
  const htmlToMarkdown = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    let markdown = '';
    
    const processNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        const children = Array.from(element.childNodes).map(processNode).join('');
        
        switch (tagName) {
          case 'h1':
            return `# ${children}\n\n`;
          case 'h2':
            return `## ${children}\n\n`;
          case 'h3':
            return `### ${children}\n\n`;
          case 'strong':
            return `**${children}**`;
          case 'em':
            return `*${children}*`;
          case 'span':
            if (element.style.textDecoration === 'underline') {
              return `<u>${children}</u>`;
            }
            return children;
          case 'blockquote':
            return `> ${children}\n\n`;
          case 'ul':
            return children;
          case 'ol':
            return children;
          case 'li':
            const isOrdered = element.parentElement?.tagName === 'OL';
            const prefix = isOrdered ? '1. ' : '- ';
            return `${prefix}${children}\n`;
          case 'p':
            return `${children}\n\n`;
          case 'br':
            return '\n';
          case 'div':
            return `${children}\n`;
          default:
            return children;
        }
      }
      
      return '';
    };
    
    markdown = processNode(tempDiv);
    
    // Limpar múltiplas quebras de linha
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();
    
    return markdown;
  };

  // Atualizar conteúdo quando value muda externamente
  useEffect(() => {
    if (editorRef.current && !isUpdating) {
      const currentHtml = markdownToHtml(value);
      if (editorRef.current.innerHTML !== currentHtml) {
        editorRef.current.innerHTML = currentHtml;
      }
    }
  }, [value, isUpdating]);

  // Lidar com mudanças no editor
  const handleInput = () => {
    if (editorRef.current && !isUpdating) {
      setIsUpdating(true);
      const htmlContent = editorRef.current.innerHTML;
      const markdownContent = htmlToMarkdown(htmlContent);
      onChange(markdownContent);
      setTimeout(() => setIsUpdating(false), 0);
    }
  };

  // Executar comandos de formatação
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
    editorRef.current?.focus();
  };

  // Inserir elementos customizados
  const insertElement = (type: 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'blockquote') => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      let element: HTMLElement;
      switch (type) {
        case 'h1':
          element = document.createElement('h1');
          element.style.cssText = 'font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 1rem 0; color: #111827;';
          break;
        case 'h2':
          element = document.createElement('h2');
          element.style.cssText = 'font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.75rem 0; color: #1f2937;';
          break;
        case 'h3':
          element = document.createElement('h3');
          element.style.cssText = 'font-size: 1.125rem; font-weight: 500; margin: 1rem 0 0.5rem 0; color: #374151;';
          break;
        case 'ul':
          document.execCommand('insertUnorderedList');
          handleInput();
          return;
        case 'ol':
          document.execCommand('insertOrderedList');
          handleInput();
          return;
        case 'blockquote':
          element = document.createElement('blockquote');
          element.style.cssText = 'border-left: 4px solid #d1d5db; padding-left: 1rem; margin: 1rem 0; color: #6b7280; font-style: italic;';
          break;
        default:
          return;
      }
      
      if (type === 'h1' || type === 'h2' || type === 'h3' || type === 'blockquote') {
        element.textContent = selection.toString() || 'Texto aqui';
        range.deleteContents();
        range.insertNode(element);
        
        // Posicionar cursor no final do elemento
        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      handleInput();
    }
    
    editorRef.current.focus();
  };

  const formatButtons = [
    { icon: <Bold className="w-4 h-4" />, action: () => execCommand('bold'), title: "Negrito (Ctrl+B)" },
    { icon: <Italic className="w-4 h-4" />, action: () => execCommand('italic'), title: "Itálico (Ctrl+I)" },
    { icon: <Underline className="w-4 h-4" />, action: () => execCommand('underline'), title: "Sublinhado (Ctrl+U)" },
    { icon: <Heading1 className="w-4 h-4" />, action: () => insertElement('h1'), title: "Título 1" },
    { icon: <Heading2 className="w-4 h-4" />, action: () => insertElement('h2'), title: "Título 2" },
    { icon: <Heading3 className="w-4 h-4" />, action: () => insertElement('h3'), title: "Título 3" },
    { icon: <List className="w-4 h-4" />, action: () => insertElement('ul'), title: "Lista com marcadores" },
    { icon: <ListOrdered className="w-4 h-4" />, action: () => insertElement('ol'), title: "Lista numerada" },
    { icon: <Quote className="w-4 h-4" />, action: () => insertElement('blockquote'), title: "Citação" },
  ];

  return (
    <div className={`border rounded-lg ${className}`}>
      {/* Barra de Formatação */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b">
        {formatButtons.map((button, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={button.action}
            title={button.title}
            className="h-8 w-8 p-0 hover:bg-gray-200"
            type="button"
          >
            {button.icon}
          </Button>
        ))}
      </div>
      
      {/* Editor Rico */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[400px] p-4 focus:outline-none"
        style={{ 
          lineHeight: '1.6',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
        onInput={handleInput}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
      
      {/* Placeholder personalizado */}
      <style>{`
        [contenteditable]:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}