import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Conversation, ConversationFilter } from "@/types/conversations";
import { cn } from "@/lib/utils";
import { Search, Bot, Calendar } from "lucide-react";

interface ConversationsSidebarProps {
  conversations: Conversation[];
  selectedConversationId?: number;
  onConversationSelect: (conversationId: number) => void;
  filters: ConversationFilter[];
}

export function ConversationsSidebar({
  conversations,
  selectedConversationId,
  onConversationSelect,
  filters
}: ConversationsSidebarProps) {
  const [activeFilter, setActiveFilter] = useState<ConversationFilter['type']>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conversation => {
    // Apply filter
    if (activeFilter === 'unread' && conversation.unread_count === 0) return false;
    if (activeFilter === 'ai_active' && !conversation.ai_active) return false;
    if (activeFilter === 'manual' && conversation.ai_active) return false;

    // Apply search
    if (searchQuery && !conversation.patient_name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Conversas</h2>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar paciente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.type}
              onClick={() => setActiveFilter(filter.type)}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                activeFilter === filter.type
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>Nenhuma conversa encontrada</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={selectedConversationId === conversation.id}
              onClick={() => onConversationSelect(conversation.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50",
        isActive && "bg-blue-50 border-l-4 border-l-blue-500"
      )}
    >
      <div className="flex items-start space-x-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={conversation.patient_avatar} />
          <AvatarFallback className="text-sm">
            {conversation.patient_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={cn(
              "font-medium text-gray-900 truncate",
              conversation.unread_count > 0 && "font-semibold"
            )}>
              {conversation.patient_name}
            </h3>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {conversation.timestamp}
            </span>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {conversation.last_message}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {conversation.ai_active && (
                <Bot className="w-4 h-4 text-blue-500" />
              )}
              {conversation.has_pending_appointment && (
                <Calendar className="w-4 h-4 text-green-500" />
              )}
            </div>

            {conversation.unread_count > 0 && (
              <Badge variant="destructive" className="text-xs">
                {conversation.unread_count}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}