import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (prefix: string, suffix: string = "") => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + 
                   prefix + selectedText + suffix + 
                   value.substring(end);
    
    onChange(newText);
    
    // Restaurar posição do cursor
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + prefix.length + selectedText.length + suffix.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const formatButtons = [
    { icon: <Bold className="w-4 h-4" />, action: () => insertFormatting("**", "**"), title: "Negrito" },
    { icon: <Italic className="w-4 h-4" />, action: () => insertFormatting("*", "*"), title: "Itálico" },
    { icon: <Underline className="w-4 h-4" />, action: () => insertFormatting("<u>", "</u>"), title: "Sublinhado" },
    { icon: <Heading1 className="w-4 h-4" />, action: () => insertFormatting("# "), title: "Título 1" },
    { icon: <Heading2 className="w-4 h-4" />, action: () => insertFormatting("## "), title: "Título 2" },
    { icon: <Heading3 className="w-4 h-4" />, action: () => insertFormatting("### "), title: "Título 3" },
    { icon: <List className="w-4 h-4" />, action: () => insertFormatting("- "), title: "Lista" },
    { icon: <ListOrdered className="w-4 h-4" />, action: () => insertFormatting("1. "), title: "Lista Numerada" },
    { icon: <Quote className="w-4 h-4" />, action: () => insertFormatting("> "), title: "Citação" },
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
      
      {/* Área de Texto */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={25}
        className="border-0 rounded-t-none resize-none focus:ring-0 focus:border-0"
      />
    </div>
  );
}