import { useState } from 'react';
import { useLocation } from 'wouter';
import { ConfiguracoesLayout } from './index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Plus, CreditCard, Settings, Edit, Trash2, Search, DollarSign, Download, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface Plano {
  id: string;
  nome: string;
  tipo: 'padrao' | 'personalizado';
  descricao?: string;
  tratamentos: string[];
  isAtivo: boolean;
}

interface Tratamento {
  id: string;
  nome: string;
  valorTratamento: number;
  custoTratamento: number;
  aceitaConvenio: boolean;
  ativo: boolean;
}

interface Especialidade {
  id: string;
  nome: string;
  tratamentos: Tratamento[];
}

// Dados mockados das especialidades
const especialidadesMock: Especialidade[] = [
  {
    id: 'cirurgia',
    nome: 'Cirurgia',
    tratamentos: [
      { id: 'alveoloplastia', nome: 'Alveoloplastia', valorTratamento: 140.00, custoTratamento: 0.00, aceitaConvenio: true, ativo: true },
      { id: 'cirurgia-periodontal', nome: 'Cirurgia Periodontal', valorTratamento: 250.00, custoTratamento: 80.00, aceitaConvenio: true, ativo: true },
      { id: 'exodontia', nome: 'Exodontia', valorTratamento: 85.00, custoTratamento: 15.00, aceitaConvenio: true, ativo: true },
    ]
  },
  {
    id: 'dentistica',
    nome: 'Dentística',
    tratamentos: [
      { id: 'restauracao-resina', nome: 'Restauração em Resina', valorTratamento: 120.00, custoTratamento: 25.00, aceitaConvenio: true, ativo: true },
      { id: 'clareamento', nome: 'Clareamento Dental', valorTratamento: 300.00, custoTratamento: 50.00, aceitaConvenio: false, ativo: true },
      { id: 'faceta-porcelana', nome: 'Faceta de Porcelana', valorTratamento: 800.00, custoTratamento: 200.00, aceitaConvenio: false, ativo: true },
    ]
  },
  {
    id: 'endodontia',
    nome: 'Endodontia',
    tratamentos: [
      { id: 'tratamento-canal', nome: 'Tratamento de Canal', valorTratamento: 350.00, custoTratamento: 100.00, aceitaConvenio: true, ativo: true },
      { id: 'retratamento-canal', nome: 'Retratamento de Canal', valorTratamento: 450.00, custoTratamento: 150.00, aceitaConvenio: true, ativo: true },
    ]
  },
  {
    id: 'ortodontia',
    nome: 'Ortodontia',
    tratamentos: [
      { id: 'aparelho-fixo', nome: 'Aparelho Ortodôntico Fixo', valorTratamento: 2500.00, custoTratamento: 800.00, aceitaConvenio: false, ativo: true },
      { id: 'aparelho-movel', nome: 'Aparelho Ortodôntico Móvel', valorTratamento: 1200.00, custoTratamento: 400.00, aceitaConvenio: false, ativo: true },
    ]
  },
  {
    id: 'protese',
    nome: 'Prótese',
    tratamentos: [
      { id: 'protese-total', nome: 'Prótese Total', valorTratamento: 1500.00, custoTratamento: 600.00, aceitaConvenio: true, ativo: true },
      { id: 'protese-parcial', nome: 'Prótese Parcial', valorTratamento: 800.00, custoTratamento: 300.00, aceitaConvenio: true, ativo: true },
    ]
  },
  {
    id: 'implantodontia',
    nome: 'Implantodontia',
    tratamentos: [
      { id: 'implante-unitario', nome: 'Implante Unitário', valorTratamento: 2200.00, custoTratamento: 1000.00, aceitaConvenio: false, ativo: true },
      { id: 'enxerto-osseo', nome: 'Enxerto Ósseo', valorTratamento: 800.00, custoTratamento: 300.00, aceitaConvenio: false, ativo: true },
    ]
  },
  {
    id: 'periodontia',
    nome: 'Periodontia',
    tratamentos: [
      { id: 'limpeza-periodontal', nome: 'Limpeza Periodontal', valorTratamento: 150.00, custoTratamento: 30.00, aceitaConvenio: true, ativo: true },
      { id: 'raspagem-alisamento', nome: 'Raspagem e Alisamento', valorTratamento: 200.00, custoTratamento: 50.00, aceitaConvenio: true, ativo: true },
    ]
  }
];

export default function PlanosPage() {
  const [, setLocation] = useLocation();
  const [planos, setPlanos] = useState<Plano[]>([
    {
      id: '1',
      nome: 'Particular',
      tipo: 'padrao',
      descricao: 'Plano padrão para pacientes particulares',
      tratamentos: [
        'Consulta de rotina',
        'Exames básicos', 
        'Procedimentos simples',
        'Orientações gerais'
      ],
      isAtivo: true
    }
  ]);

  const [novoPlanoDialogOpen, setNovoPlanoDialogOpen] = useState(false);
  const [novoPlanoNome, setNovoPlanoNome] = useState('');
  const [opcaoCopiaTratamentos, setOpcaoCopiaTratamentos] = useState<'copiar' | 'vazio'>('copiar');
  const [planoDetalhesOpen, setPlanoDetalhesOpen] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState<Plano | null>(null);
  
  // Estados para o popup de detalhes
  const [especialidades, setEspecialidades] = useState<Especialidade[]>(especialidadesMock);
  const [especialidadeSelecionada, setEspecialidadeSelecionada] = useState('cirurgia');
  const [busca, setBusca] = useState('');
  const [planoNome, setPlanoNome] = useState('Plano Particular');
  const [pagoPorConvenio, setPagoPorConvenio] = useState(false);

  // Funções auxiliares para o popup de detalhes
  const especialidadesFiltradas = especialidades.map(esp => ({
    ...esp,
    tratamentos: esp.tratamentos.filter(trat => 
      trat.nome.toLowerCase().includes(busca.toLowerCase())
    )
  })).filter(esp => 
    esp.nome.toLowerCase().includes(busca.toLowerCase()) || esp.tratamentos.length > 0
  );

  const especialidadeAtual = especialidadesFiltradas.find(esp => esp.id === especialidadeSelecionada);

  const handleTratamentoChange = (especialidadeId: string, tratamentoId: string, field: keyof Tratamento, value: any) => {
    setEspecialidades(prev => prev.map(esp => 
      esp.id === especialidadeId 
        ? {
            ...esp,
            tratamentos: esp.tratamentos.map(trat =>
              trat.id === tratamentoId ? { ...trat, [field]: value } : trat
            )
          }
        : esp
    ));
  };

  const tratamentosAtivos = especialidadeAtual?.tratamentos.filter(t => t.ativo).length || 0;
  const totalTratamentos = especialidadeAtual?.tratamentos.length || 0;

  const handleCriarPlano = () => {
    if (!novoPlanoNome.trim()) return;

    const novoPlano: Plano = {
      id: Date.now().toString(),
      nome: novoPlanoNome,
      tipo: 'personalizado',
      tratamentos: opcaoCopiaTratamentos === 'copiar' 
        ? [...planos.find(p => p.tipo === 'padrao')?.tratamentos || []]
        : [],
      isAtivo: true
    };

    setPlanos([...planos, novoPlano]);
    setNovoPlanoNome('');
    setOpcaoCopiaTratamentos('copiar');
    setNovoPlanoDialogOpen(false);
  };

  const handleExcluirPlano = (id: string) => {
    setPlanos(planos.filter(p => p.id !== id));
  };

  return (
    <ConfiguracoesLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Planos</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie os planos de atendimento da sua clínica.
            </p>
          </div>
          
          <Dialog open={novoPlanoDialogOpen} onOpenChange={setNovoPlanoDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar plano
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo plano</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome-plano">Nome do Plano*</Label>
                  <Input
                    id="nome-plano"
                    placeholder="Digite o nome do plano"
                    value={novoPlanoNome}
                    onChange={(e) => setNovoPlanoNome(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <RadioGroup 
                    value={opcaoCopiaTratamentos} 
                    onValueChange={(value) => setOpcaoCopiaTratamentos(value as 'copiar' | 'vazio')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="copiar" id="copiar-tratamentos" />
                      <Label htmlFor="copiar-tratamentos" className="cursor-pointer">
                        Copiar tratamentos do plano padrão
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="vazio" id="plano-vazio" />
                      <Label htmlFor="plano-vazio" className="cursor-pointer">
                        Não copiar (plano vazio)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setNovoPlanoDialogOpen(false)}>
                  Fechar
                </Button>
                <Button 
                  onClick={handleCriarPlano}
                  disabled={!novoPlanoNome.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Continuar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Planos */}
        <div className="grid gap-4">
          {planos.map((plano) => (
            <Card key={plano.id} className="border border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-teal-600" />
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {plano.nome}
                        {plano.tipo === 'padrao' && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                            Padrão
                          </Badge>
                        )}
                        {plano.isAtivo && (
                          <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                            Ativo
                          </Badge>
                        )}
                      </CardTitle>
                      {plano.descricao && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {plano.descricao}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                      <Settings className="h-4 w-4" />
                    </Button>
                    {plano.tipo === 'personalizado' && (
                      <>
                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleExcluirPlano(plano.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      Tratamentos inclusos ({plano.tratamentos.length})
                    </h4>
                    {plano.tratamentos.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {plano.tratamentos.map((tratamento, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                            {tratamento}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">
                        Nenhum tratamento configurado
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-teal-600 border-teal-200 hover:bg-teal-50"
                      onClick={() => {
                        setPlanoSelecionado(plano);
                        setPlanoDetalhesOpen(true);
                      }}
                    >
                      Ver detalhes do plano
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {planos.length === 0 && (
            <Card className="border-dashed border-2 border-slate-200">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CreditCard className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Nenhum plano configurado
                </h3>
                <p className="text-slate-600 text-center mb-4">
                  Crie seu primeiro plano de atendimento para organizar os serviços da sua clínica.
                </p>
                <Button 
                  onClick={() => setNovoPlanoDialogOpen(true)}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeiro plano
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ConfiguracoesLayout>
  );
}