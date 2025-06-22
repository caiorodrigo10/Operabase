import React, { useState, useRef, useEffect } from 'react';
import { Send, Code, Sparkles, User, Bot, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditor } from '@craftjs/core';
import { aiDevService, builderTransformer, type BuilderAction, type CraftJSON } from '@/lib/ai-dev';

interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'assistant' | 'system';
  timestamp: Date;
  action?: BuilderAction;
  success?: boolean;
  error?: string;
}

export const AICodeChat = () => {
  const { query, actions } = useEditor();
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Hi! I can help you modify your landing page with natural language commands. Try saying:\n\n• "Change the title to blue"\n• "Add a green button"\n• "Remove the video"\n• "Make the text larger"',
      type: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check API key status on mount
  useEffect(() => {
    setApiKeyConfigured(aiDevService.isConfigured());
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response (replace with actual API call later)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'I understand you want to modify the code. Here\'s what I can help you with:\n\n```jsx\n// Example component\nconst CustomButton = ({ text, onClick }) => {\n  return (\n    <button \n      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"\n      onClick={onClick}\n    >\n      {text}\n    </button>\n  );\n};\n```\n\nWould you like me to create a specific component or modify the existing layout?',
        type: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-blue-500" />
          <Sparkles className="w-4 h-4 text-purple-500" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900">AI Code Assistant</h3>
          <p className="text-xs text-gray-500">Generate and modify components</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                message.type === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {message.type === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {message.content.includes('```') ? (
                    <div>
                      {message.content.split('```').map((part, index) => {
                        if (index % 2 === 1) {
                          // Code block
                          const lines = part.split('\n');
                          const language = lines[0];
                          const code = lines.slice(1).join('\n');
                          return (
                            <div key={index} className="my-2">
                              <div className="bg-gray-900 text-gray-100 rounded-t px-3 py-1 text-xs font-mono">
                                {language || 'code'}
                              </div>
                              <pre className="bg-gray-800 text-gray-100 rounded-b px-3 py-2 text-xs font-mono overflow-x-auto">
                                <code>{code}</code>
                              </pre>
                            </div>
                          );
                        }
                        return <span key={index}>{part}</span>;
                      })}
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-2 justify-start">
            <div className="flex gap-2 max-w-[85%]">
              <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-gray-200 text-gray-600">
                <Bot size={14} />
              </div>
              <div className="bg-white text-gray-800 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 pb-6 bg-white border-t border-gray-200 flex-shrink-0">
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder="Describe what you want to create or modify..."
              className="w-full resize-none border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              style={{ minHeight: '80px', maxHeight: '160px' }}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            size="sm"
            className="h-[40px] w-[40px] p-0 flex-shrink-0 mt-1"
          >
            <Send size={16} />
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};