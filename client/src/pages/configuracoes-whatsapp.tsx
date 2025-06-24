import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, MessageSquare, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EvolutionApiConfig {
  id?: number;
  api_url: string;
  api_key: string;
  instance_name: string;
  is_active: boolean;
}

export default function ConfiguracoesWhatsApp() {
  const [config, setConfig] = useState<EvolutionApiConfig>({
    api_url: '',
    api_key: '',
    instance_name: 'default',
    is_active: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const response = await fetch('/api/whatsapp/config');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast({
          title: "Configuração salva",
          description: "As configurações do WhatsApp foram salvas com sucesso.",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao salvar configurações do WhatsApp.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de conexão ao salvar configurações.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setTestResult({
          success: true,
          message: 'Conexão com Evolution API estabelecida com sucesso!'
        });
      } else {
        setTestResult({
          success: false,
          message: result.message || 'Falha na conexão com Evolution API'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Erro de rede ao testar conexão'
      });
    }
    setIsTesting(false);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <MessageSquare className="w-8 h-8 text-green-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações WhatsApp</h1>
            <p className="text-gray-600">Configure a integração com Evolution API</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Evolution API
            </CardTitle>
            <CardDescription>
              Configure os dados de acesso à sua instância Evolution API para envio de mensagens WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="api_url">URL da API *</Label>
              <Input
                id="api_url"
                type="url"
                placeholder="https://sua-evolution-api.com"
                value={config.api_url}
                onChange={(e) => setConfig(prev => ({ ...prev, api_url: e.target.value }))}
              />
              <p className="text-sm text-gray-500">
                URL completa da sua instância Evolution API
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">API Key *</Label>
              <Input
                id="api_key"
                type="password"
                placeholder="Sua API Key"
                value={config.api_key}
                onChange={(e) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
              />
              <p className="text-sm text-gray-500">
                Chave de acesso fornecida pela Evolution API
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instance_name">Nome da Instância</Label>
              <Input
                id="instance_name"
                placeholder="default"
                value={config.instance_name}
                onChange={(e) => setConfig(prev => ({ ...prev, instance_name: e.target.value }))}
              />
              <p className="text-sm text-gray-500">
                Nome da instância WhatsApp configurada na Evolution API
              </p>
            </div>

            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {testResult.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleTest}
                variant="outline"
                disabled={!config.api_url || !config.api_key || isTesting}
                className="flex-1"
              >
                {isTesting ? 'Testando...' : 'Testar Conexão'}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!config.api_url || !config.api_key || isLoading}
                className="flex-1"
              >
                {isLoading ? 'Salvando...' : 'Salvar Configuração'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Como configurar:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Acesse sua instância Evolution API</li>
            <li>2. Copie a URL base (exemplo: https://api.exemplo.com)</li>
            <li>3. Gere ou copie sua API Key de acesso</li>
            <li>4. Informe o nome da instância WhatsApp</li>
            <li>5. Teste a conexão antes de salvar</li>
          </ol>
        </div>
      </div>
    </div>
  );
}