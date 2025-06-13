import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Copy, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

interface ErrorSolution {
  id: string;
  emoji: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  steps: string[];
  code?: string;
  references?: string[];
  tags: string[];
}

const errorSolutions: ErrorSolution[] = [
  {
    id: 'login-failed',
    emoji: '🔐',
    title: 'Falha no Login',
    description: 'Erro de autenticação ao tentar fazer login no sistema',
    category: 'Autenticação',
    severity: 'high',
    steps: [
      'Verificar se email e senha estão corretos',
      'Confirmar se usuário está ativo no sistema',
      'Verificar conexão com banco de dados',
      'Limpar cache do navegador e cookies',
      'Tentar fazer login novamente'
    ],
    code: `// Verificar logs de autenticação
console.log('Erro de login:', error.message);

// Redefinir senha se necessário
await resetPassword(email);`,
    references: ['Manual do Usuário - Seção Login', 'FAQ - Problemas de Acesso'],
    tags: ['login', 'autenticação', 'senha', 'acesso']
  },
  {
    id: 'prontuario-save',
    emoji: '📋',
    title: 'Erro ao Salvar Prontuário',
    description: 'Falha ao salvar ou atualizar prontuário médico',
    category: 'Prontuários',
    severity: 'critical',
    steps: [
      'Verificar se todos os campos obrigatórios estão preenchidos',
      'Confirmar conexão com o banco de dados',
      'Verificar se há espaço suficiente no servidor',
      'Salvar uma cópia local como backup',
      'Tentar salvar novamente em alguns minutos'
    ],
    code: `// Validar dados antes de salvar
if (!prontuario.contact_id || !prontuario.clinic_id) {
  throw new Error('Campos obrigatórios não preenchidos');
}

// Tentar salvar com retry
await retryOperation(() => saveProntuario(data), 3);`,
    references: ['Guia de Prontuários', 'Backup e Recuperação'],
    tags: ['prontuário', 'salvar', 'médico', 'dados']
  },
  {
    id: 'calendar-sync',
    emoji: '📅',
    title: 'Erro de Sincronização do Calendário',
    description: 'Falha na sincronização com Google Calendar',
    category: 'Integrações',
    severity: 'medium',
    steps: [
      'Verificar se token de acesso ainda é válido',
      'Reautorizar acesso ao Google Calendar',
      'Verificar permissões da conta Google',
      'Testar conexão com internet',
      'Reconfigurar integração se necessário'
    ],
    code: `// Renovar token do Google Calendar
const newToken = await refreshGoogleToken(refreshToken);

// Testar conexão
await testCalendarConnection(newToken);`,
    references: ['Integração Google Calendar', 'Configuração de APIs'],
    tags: ['calendário', 'google', 'sincronização', 'token']
  },
  {
    id: 'payment-error',
    emoji: '💳',
    title: 'Erro no Processamento de Pagamento',
    description: 'Falha ao processar cobrança via Asaas',
    category: 'Financeiro',
    severity: 'high',
    steps: [
      'Verificar dados do cliente (CPF, email, etc.)',
      'Confirmar se valor está correto',
      'Verificar status da integração Asaas',
      'Checar se há saldo na conta Asaas',
      'Tentar novamente após alguns minutos'
    ],
    code: `// Verificar configuração Asaas
const customer = await asaas.getCustomer(customerId);
if (!customer) {
  await asaas.createCustomer(customerData);
}

// Criar cobrança
const charge = await asaas.createCharge({
  customer: customer.id,
  billingType: 'PIX',
  value: amount,
  dueDate: new Date()
});`,
    references: ['API Asaas', 'Configuração de Pagamentos'],
    tags: ['pagamento', 'asaas', 'cobrança', 'pix']
  },
  {
    id: 'database-connection',
    emoji: '🗄️',
    title: 'Erro de Conexão com Banco',
    description: 'Falha na conexão com banco de dados',
    category: 'Sistema',
    severity: 'critical',
    steps: [
      'Verificar se serviço do banco está rodando',
      'Confirmar credenciais de conexão',
      'Testar conectividade de rede',
      'Verificar logs do banco de dados',
      'Reiniciar serviço se necessário'
    ],
    code: `// Testar conexão
try {
  await db.raw('SELECT 1');
  console.log('Banco conectado');
} catch (error) {
  console.error('Erro de conexão:', error);
}`,
    references: ['Configuração de Banco', 'Troubleshooting'],
    tags: ['banco', 'conexão', 'postgresql', 'supabase']
  },
  {
    id: 'whatsapp-api',
    emoji: '💬',
    title: 'Erro na API do WhatsApp',
    description: 'Falha ao enviar mensagens via WhatsApp',
    category: 'Comunicação',
    severity: 'medium',
    steps: [
      'Verificar se número está no formato correto',
      'Confirmar se API key do WhatsApp é válida',
      'Checar limite de mensagens',
      'Verificar se número não está bloqueado',
      'Testar com outro número'
    ],
    code: `// Validar formato do número
const phone = formatPhoneNumber(rawPhone);

// Enviar mensagem
await whatsappAPI.sendMessage({
  to: phone,
  message: content
});`,
    references: ['API WhatsApp', 'Configuração de Mensagens'],
    tags: ['whatsapp', 'mensagem', 'api', 'comunicação']
  }
];

const categories = Array.from(new Set(errorSolutions.map(s => s.category)));
const severityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800', 
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

export default function ErrorResolutionGuide() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const filteredSolutions = errorSolutions.filter(solution => {
    const matchesSearch = 
      solution.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solution.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solution.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || solution.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(Array.from(expandedItems));
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🛠️ Guia de Resolução de Erros
          </CardTitle>
          <p className="text-muted-foreground">
            Soluções rápidas para problemas comuns do sistema
          </p>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por problema, categoria ou tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todas as categorias</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de Soluções */}
          <div className="space-y-4">
            {filteredSolutions.map((solution) => {
              const isExpanded = expandedItems.has(solution.id);
              
              return (
                <Card key={solution.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl">{solution.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{solution.title}</h3>
                            <Badge className={severityColors[solution.severity]}>
                              {solution.severity}
                            </Badge>
                            <Badge variant="outline">{solution.category}</Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {solution.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(solution.id)}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="pt-0">
                      <Tabs defaultValue="steps" className="w-full">
                        <TabsList>
                          <TabsTrigger value="steps">Passos</TabsTrigger>
                          {solution.code && <TabsTrigger value="code">Código</TabsTrigger>}
                          {solution.references && <TabsTrigger value="refs">Referências</TabsTrigger>}
                        </TabsList>
                        
                        <TabsContent value="steps" className="mt-4">
                          <div className="space-y-2">
                            {solution.steps.map((step, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <Badge variant="outline" className="mt-0.5 text-xs">
                                  {index + 1}
                                </Badge>
                                <span className="text-sm">{step}</span>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        
                        {solution.code && (
                          <TabsContent value="code" className="mt-4">
                            <div className="relative">
                              <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                                <code>{solution.code}</code>
                              </pre>
                              <Button
                                size="sm"
                                variant="outline"
                                className="absolute top-2 right-2"
                                onClick={() => copyCode(solution.code!)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </TabsContent>
                        )}
                        
                        {solution.references && (
                          <TabsContent value="refs" className="mt-4">
                            <div className="space-y-2">
                              {solution.references.map((ref, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <ExternalLink className="w-4 h-4 text-blue-500" />
                                  <span className="text-sm text-blue-600 hover:underline cursor-pointer">
                                    {ref}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </TabsContent>
                        )}
                      </Tabs>
                      
                      {/* Tags */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex flex-wrap gap-1">
                          {solution.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {filteredSolutions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma solução encontrada para "{searchTerm}"</p>
              <p className="text-sm mt-2">Tente usar termos diferentes ou selecionar outra categoria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}