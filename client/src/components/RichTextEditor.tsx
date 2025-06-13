import { useState, useRef, useEffect } from "react";
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
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== markdownToHtml(value)) {
      editorRef.current.innerHTML = markdownToHtml(value);
    }
  }, [value]);

  const markdownToHtml = (markdown: string): string => {
    if (!markdown) return "";
    
    let html = markdown
      // Títulos
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2 text-gray-700 mt-4">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3 text-gray-800 mt-6">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 text-gray-900">$1</h1>')
      
      // Negrito e itálico
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>')
      
      // Listas não ordenadas
      .replace(/^- (.*$)/gm, '<li class="flex items-start mb-1"><span class="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span><span class="text-gray-700">$1</span></li>')
      
      // Listas ordenadas
      .replace(/^(\d+)\. (.*$)/gm, '<li class="flex items-start mb-1"><span class="text-gray-500 mr-3 font-medium min-w-[20px]">$1.</span><span class="text-gray-700">$2</span></li>')
      
      // Quebras de linha
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');

    // Envolver listas em containers
    html = html.replace(/(<li class="flex items-start mb-1"><span class="w-2 h-2[^>]*>.*?<\/span><\/li>(\s*<br>)*)+/g, (match) => {
      return `<ul class="list-none pl-0 my-2">${match.replace(/<br>/g, '')}</ul>`;
    });

    html = html.replace(/(<li class="flex items-start mb-1"><span class="text-gray-500[^>]*>.*?<\/span><\/li>(\s*<br>)*)+/g, (match) => {
      return `<ol class="list-none pl-0 my-2">${match.replace(/<br>/g, '')}</ol>`;
    });

    return html;
  };

  const htmlToMarkdown = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    let markdown = tempDiv.innerText || tempDiv.textContent || '';
    
    // Converter de volta para markdown baseado no conteúdo
    const htmlContent = tempDiv.innerHTML;
    
    // Títulos
    markdown = htmlContent
      .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n\n')
      
      // Negrito e itálico
      .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
      
      // Quebras
      .replace(/<br><br>/g, '\n\n')
      .replace(/<br>/g, '\n')
      
      // Remover tags restantes
      .replace(/<[^>]+>/g, '');

    return markdown;
  };

  const handleInput = () => {
    if (editorRef.current) {
      const markdownContent = htmlToMarkdown(editorRef.current.innerHTML);
      onChange(markdownContent);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
    editorRef.current?.focus();
  };

  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      const markdownText = prefix + selectedText + suffix;
      
      if (document.execCommand) {
        document.execCommand('insertText', false, markdownText);
      } else {
        range.deleteContents();
        range.insertNode(document.createTextNode(markdownText));
      }
      
      handleInput();
    }
  };

  const formatButtons = [
    { 
      icon: <Bold className="w-4 h-4" />, 
      action: () => execCommand('bold'), 
      title: "Negrito (Ctrl+B)" 
    },
    { 
      icon: <Italic className="w-4 h-4" />, 
      action: () => execCommand('italic'), 
      title: "Itálico (Ctrl+I)" 
    },
    { 
      icon: <Underline className="w-4 h-4" />, 
      action: () => execCommand('underline'), 
      title: "Sublinhado" 
    },
    { 
      icon: <Heading1 className="w-4 h-4" />, 
      action: () => insertMarkdown('# '), 
      title: "Título 1" 
    },
    { 
      icon: <Heading2 className="w-4 h-4" />, 
      action: () => insertMarkdown('## '), 
      title: "Título 2" 
    },
    { 
      icon: <Heading3 className="w-4 h-4" />, 
      action: () => insertMarkdown('### '), 
      title: "Título 3" 
    },
    { 
      icon: <List className="w-4 h-4" />, 
      action: () => insertMarkdown('- '), 
      title: "Lista" 
    },
    { 
      icon: <ListOrdered className="w-4 h-4" />, 
      action: () => insertMarkdown('1. '), 
      title: "Lista Numerada" 
    },
    { 
      icon: <Quote className="w-4 h-4" />, 
      action: () => insertMarkdown('> '), 
      title: "Citação" 
    },
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
            className="h-8 w-8 p-0"
            type="button"
          >
            {button.icon}
          </Button>
        ))}
      </div>
      
      {/* Área de Edição Rica */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[400px] p-4 focus:outline-none prose prose-sm max-w-none"
        style={{ 
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}
        onInput={handleInput}
        onFocus={() => setIsEditorFocused(true)}
        onBlur={() => setIsEditorFocused(false)}
        dangerouslySetInnerHTML={{ __html: markdownToHtml(value) }}
        data-placeholder={placeholder}
      />
      
      {/* Placeholder quando vazio */}
      {!value && !isEditorFocused && (
        <div 
          className="absolute top-[60px] left-4 text-gray-400 pointer-events-none text-sm"
          style={{ marginTop: '16px' }}
        >
          {placeholder}
        </div>
      )}
    </div>
  );
}