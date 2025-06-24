import { useWebSocket } from '@/hooks/useWebSocket';
import { Wifi, WifiOff, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WebSocketStatus() {
  const webSocket = useWebSocket();

  if (!webSocket.connected && !webSocket.reconnecting && !webSocket.error) {
    return null; // Don't show anything while initially connecting
  }

  return (
    <div className={cn(
      "flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium",
      webSocket.connected 
        ? "bg-green-100 text-green-800" 
        : webSocket.reconnecting 
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800"
    )}>
      {webSocket.connected ? (
        <>
          <Wifi className="w-3 h-3" />
          <span>Tempo real ativo</span>
        </>
      ) : webSocket.reconnecting ? (
        <>
          <RotateCcw className="w-3 h-3 animate-spin" />
          <span>Reconectando...</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          <span>Sem conexão</span>
        </>
      )}
    </div>
  );
}