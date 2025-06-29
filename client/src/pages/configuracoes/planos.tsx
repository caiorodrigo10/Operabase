import { useState } from 'react';
import { ConfiguracoesLayout } from './index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Plus, CreditCard, Settings, Edit, Trash2 } from 'lucide-react';

interface Plano {
  id: string;
  nome: string;
  tipo: 'padrao' | 'personalizado';
  descricao?: string;
  tratamentos: string[];
  isAtivo: boolean;
}

export default function PlanosPage() {
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