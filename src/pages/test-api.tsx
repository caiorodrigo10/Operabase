import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Globe } from 'lucide-react';

interface TestResult {
  endpoint: string;
  status: 'success' | 'error' | 'loading';
  data?: any;
  error?: string;
  responseTime?: number;
}

export default function TestApiPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const testEndpoints = [
    { name: 'Health Check', endpoint: '/health' },
    { name: 'API Test', endpoint: '/api/test' },
    { name: 'Calendar Events', endpoint: '/api/calendar/events?clinic_id=1' },
    { name: 'Contacts', endpoint: '/api/contacts?clinic_id=1' }
  ];

  const runTest = async (endpoint: string) => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(endpoint, {
        credentials: 'include'
      });
      
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        endpoint,
        status: 'success' as const,
        data,
        responseTime
      };
    } catch (error) {
      return {
        endpoint,
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);

    for (const test of testEndpoints) {
      // Add loading state
      setResults(prev => [...prev, {
        endpoint: test.endpoint,
        status: 'loading'
      }]);

      const result = await runTest(test.endpoint);
      
      // Update with result
      setResults(prev => 
        prev.map(r => 
          r.endpoint === test.endpoint ? result : r
        )
      );

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'loading':
        return <Badge variant="secondary">Loading...</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🧪 API Test Suite</h1>
          <p className="text-gray-600">
            Teste a comunicação entre o frontend (Vercel) e backend (AWS)
          </p>
        </div>

        <Alert className="mb-6">
          <Globe className="h-4 w-4" />
          <AlertDescription>
            <strong>Frontend:</strong> operabase-main.vercel.app<br />
            <strong>Backend:</strong> operabase-backend-mvp-env-1.sa-east-1.elasticbeanstalk.com
          </AlertDescription>
        </Alert>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Testes de Conectividade
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                className="ml-4"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Executar Testes'
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testEndpoints.map((test, index) => {
                const result = results.find(r => r.endpoint === test.endpoint);
                
                return (
                  <div 
                    key={test.endpoint}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {result && getStatusIcon(result.status)}
                      <div>
                        <h3 className="font-medium">{test.name}</h3>
                        <p className="text-sm text-gray-500">{test.endpoint}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {result?.responseTime && (
                        <span className="text-sm text-gray-500">
                          {result.responseTime}ms
                        </span>
                      )}
                      {result && getStatusBadge(result.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados Detalhados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={result.endpoint} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium">{result.endpoint}</h4>
                      {getStatusBadge(result.status)}
                    </div>
                    
                    {result.error && (
                      <Alert variant="destructive" className="mb-2">
                        <AlertDescription>{result.error}</AlertDescription>
                      </Alert>
                    )}
                    
                    {result.data && (
                      <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 