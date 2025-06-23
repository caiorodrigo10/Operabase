import React, { useState, useRef, useEffect } from 'react';
import { Send, Code, Sparkles, User, Bot, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditor } from '@craftjs/core';
import { aiDevService, builderTransformer, type BuilderAction, type CraftJSON } from '@/lib/ai-dev';
import { supabase } from '@/lib/supabase';

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

  // Fetch and configure API key on mount
  useEffect(() => {
    const configureApiKey = async () => {
      try {
        // Get Supabase session for authentication
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          console.log('No authentication session found');
          setApiKeyConfigured(false);
          return;
        }

        const response = await fetch('/api/ai-dev/config', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const config = await response.json();
          if (config.configured && config.apiKey) {
            aiDevService.setApiKey(config.apiKey);
            setApiKeyConfigured(true);
          } else {
            setApiKeyConfigured(false);
          }
        } else {
          setApiKeyConfigured(false);
        }
      } catch (error) {
        console.error('Error fetching AI Dev config:', error);
        setApiKeyConfigured(false);
      }
    };

    configureApiKey();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Check if API key is configured
    if (!apiKeyConfigured) {
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        content: 'OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your environment or contact your administrator.',
        type: 'system',
        timestamp: new Date(),
        error: 'API key not configured'
      };
      setMessages(prev => [...prev, systemMessage]);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userCommand = inputValue;
    setInputValue('');
    setIsProcessing(true);

    try {
      // Get current page state from Craft.js
      const serializedData = query.serialize();
      const currentJSON = (typeof serializedData === 'string' ? JSON.parse(serializedData) : serializedData) as CraftJSON;
      
      // Process command with AI
      const result = await aiDevService.processPrompt(userCommand, currentJSON);
      
      if (!result.success) {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: `Sorry, I couldn't process your request: ${result.error}`,
          type: 'assistant',
          timestamp: new Date(),
          error: result.error
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsProcessing(false);
        return;
      }

      if (!result.action) {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: 'I understood your request but couldn\'t generate a valid action. Please try rephrasing your command.',
          type: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsProcessing(false);
        return;
      }

      // Apply transformation to get new JSON
      console.log('🔧 Original JSON:', currentJSON);
      console.log('🎯 Action to apply:', result.action);
      
      const newJSON = builderTransformer.applyAction(currentJSON, result.action, userCommand);
      console.log('✨ Transformed JSON:', newJSON);
      
      // Validate the transformation
      const validation = builderTransformer.validateJSON(newJSON);
      if (!validation.valid) {
        console.error('❌ Validation failed:', validation.errors);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: `I tried to apply your changes but encountered issues: ${validation.errors.join(', ')}`,
          type: 'assistant',
          timestamp: new Date(),
          error: validation.errors.join(', ')
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsProcessing(false);
        return;
      }

      // Apply changes to Craft.js editor
      console.log('🔄 Applying changes to Craft.js...');
      const newJSONString = JSON.stringify(newJSON);
      console.log('📄 JSON string to deserialize:', newJSONString);
      
      try {
        actions.deserialize(newJSONString);
        console.log('✅ Changes applied to editor');
        
        // Save and reload page to ensure visual update
        setTimeout(() => {
          console.log('💾 Saving editor state...');
          const finalState = query.serialize();
          localStorage.setItem('craft_editor_state', finalState);
          console.log('🔄 Reloading page to show changes...');
          window.location.reload();
        }, 500);
        
      } catch (deserializeError) {
        console.error('❌ Failed to deserialize:', deserializeError);
        throw new Error(`Failed to apply changes: ${deserializeError instanceof Error ? deserializeError.message : 'Unknown error'}`);
      }

      // Success message
      const successMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `✅ Done! ${result.action.reasoning}\n\nAction: ${result.action.action} → ${result.action.target}`,
        type: 'assistant',
        timestamp: new Date(),
        action: result.action,
        success: true
      };
      setMessages(prev => [...prev, successMessage]);

    } catch (error) {
      console.error('Error processing AI command:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('User command:', userCommand);
      console.error('API key configured:', apiKeyConfigured);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `Something went wrong while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'assistant',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
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
        
        {isProcessing && (
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
            disabled={!inputValue.trim() || isProcessing}
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