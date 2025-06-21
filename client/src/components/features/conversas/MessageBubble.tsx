import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message } from "@/types/conversations";
import { Bot, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
}

function getMessageTypeIcon(type: Message['type']) {
  switch (type) {
    case 'sent_ai':
      return <Bot className="w-3 h-3 text-blue-600" />;
    case 'sent_system':
      return <Settings className="w-3 h-3 text-gray-600" />;
    default:
      return null;
  }
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isReceived = message.type === 'received';
  const isSent = !isReceived;
  
  return (
    <div className={cn("flex mb-3", isReceived ? "justify-start" : "justify-end")}>
      {/* Avatar for received messages (left side) */}
      {isReceived && (
        <Avatar className="w-6 h-6 mr-2 mt-1 flex-shrink-0">
          <AvatarImage src={message.sender_avatar} />
          <AvatarFallback className="text-xs bg-gray-200 text-gray-600">
            {message.sender_name?.charAt(0)?.toUpperCase() || 'P'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className="flex flex-col max-w-xs lg:max-w-md">
        <div
          className={cn(
            "px-4 py-3 rounded-2xl",
            isReceived 
              ? "bg-gray-100 text-gray-900 rounded-tl-md" 
              : "bg-emerald-500 text-white rounded-tr-md"
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
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
      
      {/* Avatar/Icon for sent messages (right side) */}
      {isSent && (
        <div className="ml-2 mt-1 flex-shrink-0">
          {message.type === 'sent_ai' || message.type === 'sent_system' ? (
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center border border-gray-200">
              {getMessageTypeIcon(message.type)}
            </div>
          ) : (
            <Avatar className="w-6 h-6">
              <AvatarImage src={message.sender_avatar} />
              <AvatarFallback className="text-xs bg-blue-500 text-white">
                {message.sender_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}
    </div>
  );
}