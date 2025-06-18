import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, MessageCircle, Clock, User, Calendar } from 'lucide-react';
import { useMCPChat } from '../hooks/useMCPChat';
import { LogsPanel } from '../components/LogsPanel';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'success' | 'error' | 'info';
}

export default function ChatDeTeste() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Sou seu assistente de agendamento médico. Posso ajudar você a criar, consultar, reagendar ou cancelar consultas. Como posso ajudar?',
      isUser: false,
      timestamp: new Date(),
      type: 'info'
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const { sendMessage, isLoading, error } = useMCPChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      const response = await sendMessage(inputText);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        isUser: false,
        timestamp: new Date(),
        type: response.success ? 'success' : 'error'
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        isUser: false,
        timestamp: new Date(),
        type: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      text: 'Olá! Sou seu assistente de agendamento médico. Posso ajudar você a criar, consultar, reagendar ou cancelar consultas. Como posso ajudar?',
      isUser: false,
      timestamp: new Date(),
      type: 'info'
    }]);
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '';
    }
  };

  const getMessageBgColor = (isUser: boolean, type?: string) => {
    if (isUser) {
      return 'bg-blue-500 text-white';
    }
    
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 border border-green-200';
      case 'error':
        return 'bg-red-50 text-red-800 border border-red-200';
      case 'info':
        return 'bg-blue-50 text-blue-800 border border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                MCP Test Interface
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chat + Real-time Logs
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>cr@caiorodrigo.com.br</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Clínica ID: 1</span>
              </div>
            </div>
            
            <button
              onClick={clearChat}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Limpar Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-lg shadow-sm border flex flex-col h-96">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${getMessageBgColor(message.isUser, message.type)}`}
              >
                <div className="flex items-start space-x-2">
                  {!message.isUser && message.type && (
                    <span className="text-sm">
                      {getMessageIcon(message.type)}
                    </span>
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">
                      {message.text}
                    </p>
                    <p className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Processando sua mensagem...
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {error}
            </div>
          )}
          
          <div className="flex space-x-3">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem sobre agendamentos... (Ex: 'Agendar consulta para João no dia 25/06 às 14h')"
              className="flex-1 resize-none border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={isLoading}
            />
            
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Examples */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Exemplos de comandos:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
          <div>• "Agendar consulta para Maria Silva no dia 26/06 às 10h"</div>
          <div>• "Quais consultas temos para amanhã?"</div>
          <div>• "Reagendar a consulta do João para 15h30"</div>
          <div>• "Cancelar a consulta das 14h"</div>
          <div>• "Verificar disponibilidade para sexta-feira"</div>
          <div>• "Listar todas as consultas de hoje"</div>
        </div>
      </div>
    </div>
  );
}