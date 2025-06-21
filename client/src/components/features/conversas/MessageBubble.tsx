import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Message } from "@/types/conversations";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
}

const messageStyles = {
  received: {
    position: "justify-start",
    background: "bg-gray-50",
    border: "border-gray-300",
    badge: null
  },
  sent_system: {
    position: "justify-end",
    background: "bg-green-50",
    border: "border-green-500",
    badge: "Sistema"
  },
  sent_ai: {
    position: "justify-end",
    background: "bg-blue-50",
    border: "border-blue-500",
    badge: "IA"
  },
  sent_whatsapp: {
    position: "justify-end",
    background: "bg-green-100",
    border: "border-green-600",
    badge: "WhatsApp"
  }
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const style = messageStyles[message.type];
  const isReceived = message.type === 'received';
  
  return (
    <div className={cn("flex", style.position, "mb-3")}>
      {isReceived && (
        <Avatar className="w-8 h-8 mr-3 mt-1">
          <AvatarImage src={message.sender_avatar} />
          <AvatarFallback className="text-xs">
            {message.sender_name?.charAt(0)?.toUpperCase() || 'P'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className="flex flex-col max-w-xs lg:max-w-md">
        <div
          className={cn(
            "px-4 py-2 rounded-lg border",
            style.background,
            style.border,
            isReceived ? "rounded-tl-sm" : "rounded-tr-sm"
          )}
        >
          <div className="flex items-center justify-between mb-1">
            {style.badge && (
              <Badge variant="outline" className="text-xs mb-1">
                {style.badge}
              </Badge>
            )}
          </div>
          
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        
        <span className={cn(
          "text-xs text-gray-500 mt-1",
          isReceived ? "text-left" : "text-right"
        )}>
          {message.timestamp}
        </span>
      </div>
      
      {!isReceived && (
        <Avatar className="w-8 h-8 ml-3 mt-1">
          <AvatarImage src={message.sender_avatar} />
          <AvatarFallback className="text-xs">
            {message.sender_name?.charAt(0)?.toUpperCase() || 'S'}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}