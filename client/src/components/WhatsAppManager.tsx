import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Plus, QrCode, Trash2, RefreshCw, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';

interface WhatsAppNumber {
  id: number;
  phone_number: string;
  instance_name: string;
  status: 'connecting' | 'connected' | 'disconnected';
}

interface WhatsAppManagerProps {
  clinicId: number;
  userId: string;
}

export function WhatsAppManager({ clinicId, userId }: WhatsAppManagerProps) {
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [currentQRCode, setCurrentQRCode] = useState<string>('');
  const [currentInstanceName, setCurrentInstanceName] = useState<string>('');
  const { toast } = useToast();

  // Fetch connected WhatsApp numbers
  const { data: whatsappNumbers = [], refetch } = useQuery({
    queryKey: [`/api/whatsapp/numbers/${clinicId}`],
    refetchInterval: 5000,
  });

  // Add new WhatsApp number - opens QR popup
  const addNumberMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/whatsapp/numbers`, 'POST', { clinicId, userId });
      const data = await response.json();
      
      if (data.qrCode) {
        setCurrentQRCode(data.qrCode);
        setCurrentInstanceName(data.instanceName);
        setShowQRDialog(true);
      }
      
      return data;
    },
    onError: () => {
      toast({
        title: "Erro ao conectar",
        description: "Não foi possível gerar o QR Code",
        variant: "destructive",
      });
    },
  });

  // Check connection status - auto-closes dialog when connected
  const checkConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/whatsapp/status/${currentInstanceName}`, 'GET');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.status === 'connected') {
        setShowQRDialog(false); // Auto-close popup
        refetch();
        toast({
          title: "WhatsApp conectado!",
          description: "Número conectado com sucesso",
        });
      }
    },
  });

  // Remove WhatsApp number
  const removeNumberMutation = useMutation({
    mutationFn: async (numberId: number) => {
      await apiRequest(`/api/whatsapp/numbers/${numberId}`, 'DELETE');
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Número removido",
        description: "Número WhatsApp desconectado",
      });
    },
  });

  // Auto-check connection every 3 seconds when QR dialog is open
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (showQRDialog && currentInstanceName) {
      interval = setInterval(() => {
        checkConnectionMutation.mutate();
      }, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showQRDialog, currentInstanceName]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            WhatsApp Business
          </CardTitle>
          <Button 
            onClick={() => addNumberMutation.mutate()}
            disabled={addNumberMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {addNumberMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Adicionar Número
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {whatsappNumbers.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum número conectado</p>
            <p className="text-sm">Conecte seu WhatsApp para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {whatsappNumbers.map((number: WhatsAppNumber) => (
              <div key={number.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">
                      {number.phone_number || 'WhatsApp Business'}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Conectado
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeNumberMutation.mutate(number.id)}
                  disabled={removeNumberMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* QR Code Dialog - Simple and auto-closes */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 justify-center">
                <QrCode className="w-5 h-5 text-green-600" />
                Conectar WhatsApp
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4">
              {currentQRCode && (
                <div className="p-4 bg-white border-2 border-green-200 rounded-lg">
                  <img 
                    src={currentQRCode} 
                    alt="QR Code WhatsApp" 
                    className="w-56 h-56"
                  />
                </div>
              )}
              <div className="text-center space-y-2">
                <p className="font-medium">Escaneie com seu WhatsApp</p>
                <div className="text-sm text-gray-600">
                  <p>Abra o WhatsApp → Menu → Aparelhos conectados</p>
                  <p>Toque em "Conectar um aparelho" e escaneie</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-green-600 mt-3">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Aguardando conexão...
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}