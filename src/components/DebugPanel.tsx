import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ApiTest {
  name: string;
  endpoint: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
  responseTime?: number;
  timestamp?: string;
}

export function DebugPanel() {
  const [tests, setTests] = useState<ApiTest[]>([
    { name: 'Health Check', endpoint: '/health', status: 'idle' },
    { name: 'API Test', endpoint: '/api/test', status: 'idle' },
    { name: 'Appointments', endpoint: '/api/appointments?clinic_id=1&limit=5', status: 'idle' },
    { name: 'Contacts', endpoint: '/api/contacts?clinic_id=1&limit=5', status: 'idle' },
    { name: 'Calendar Events', endpoint: '/api/calendar/events?clinic_id=1&start_date=2025-07-01&end_date=2025-07-31', status: 'idle' }
  ]);
  
  const [isRunning, setIsRunning] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('');

  useEffect(() => {
    // Detect API base URL
    try {
      const viteApiUrl = (import.meta as any).env.VITE_API_URL;
      const isDev = (import.meta as any).env.DEV;
      
      if (viteApiUrl) {
        setApiBaseUrl(viteApiUrl);
      } else if (isDev) {
        setApiBaseUrl('http://localhost:3000 (proxy)');
      } else {
        setApiBaseUrl('❌ VITE_API_URL não configurada');
      }
    } catch (error) {
      setApiBaseUrl('❌ Erro ao detectar URL');
    }
  }, []);

  const runSingleTest = async (test: ApiTest): Promise<ApiTest> => {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 [DEBUG] Testing ${test.name}: ${test.endpoint}`);
      
      const response = await fetch(test.endpoint, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const responseTime = Date.now() - startTime;
      const timestamp = new Date().toLocaleTimeString();
      
      console.log(`📊 [DEBUG] ${test.name} - Status: ${response.status}, Time: ${responseTime}ms`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [DEBUG] ${test.name} failed:`, errorText);
        
        return {
          ...test,
          status: 'error',
          error: `HTTP ${response.status}: ${errorText}`,
          responseTime,
          timestamp
        };
      }
      
      const data = await response.json();
      const dataSize = Array.isArray(data) ? data.length : Object.keys(data).length;
      
      console.log(`✅ [DEBUG] ${test.name} success:`, { dataSize, responseTime });
      
      return {
        ...test,
        status: 'success',
        data: Array.isArray(data) ? `${dataSize} items` : data,
        responseTime,
        timestamp
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const timestamp = new Date().toLocaleTimeString();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`💥 [DEBUG] ${test.name} exception:`, errorMessage);
      
      return {
        ...test,
        status: 'error',
        error: errorMessage,
        responseTime,
        timestamp
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    console.log('🚀 [DEBUG] Starting API tests...');
    
    // Reset all tests to loading
    setTests(prev => prev.map(test => ({ ...test, status: 'loading' as const })));
    
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      console.log(`🔄 [DEBUG] Running test ${i + 1}/${tests.length}: ${test.name}`);
      
      const result = await runSingleTest(test);
      
      setTests(prev => prev.map((t, index) => 
        index === i ? result : t
      ));
      
      // Small delay between tests
      if (i < tests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setIsRunning(false);
    console.log('✅ [DEBUG] All tests completed');
  };

  const getStatusIcon = (status: ApiTest['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status: ApiTest['status']) => {
    switch (status) {
      case 'loading':
        return 'bg-blue-100 text-blue-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            🔍 Debug Panel - Frontend ↔ Backend
          </CardTitle>
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            size="sm"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Executar Testes
              </>
            )}
          </Button>
        </div>
        
        <div className="text-sm text-gray-600 space-y-1">
          <div><strong>Frontend:</strong> https://operabase.vercel.app</div>
          <div><strong>Backend:</strong> {apiBaseUrl}</div>
          <div><strong>Environment:</strong> {(import.meta as any).env.DEV ? 'Development' : 'Production'}</div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {tests.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <div>
                  <div className="font-medium">{test.name}</div>
                  <div className="text-sm text-gray-500">{test.endpoint}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {test.responseTime && (
                  <Badge variant="outline" className="text-xs">
                    {test.responseTime}ms
                  </Badge>
                )}
                
                {test.timestamp && (
                  <Badge variant="outline" className="text-xs">
                    {test.timestamp}
                  </Badge>
                )}
                
                <Badge className={`text-xs ${getStatusColor(test.status)}`}>
                  {test.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        {tests.some(test => test.error) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
              <AlertTriangle className="w-4 h-4" />
              Erros Detectados
            </div>
            <div className="space-y-1 text-sm">
              {tests.filter(test => test.error).map((test, index) => (
                <div key={index}>
                  <strong>{test.name}:</strong> {test.error}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {tests.some(test => test.status === 'success' && test.data) && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
              <CheckCircle className="w-4 h-4" />
              Dados Recebidos
            </div>
            <div className="space-y-1 text-sm">
              {tests.filter(test => test.status === 'success' && test.data).map((test, index) => (
                <div key={index}>
                  <strong>{test.name}:</strong> {typeof test.data === 'string' ? test.data : JSON.stringify(test.data).substring(0, 100)}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 