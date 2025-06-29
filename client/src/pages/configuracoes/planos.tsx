import { ConfiguracoesLayout } from './index';

export default function PlanosPage() {
  return (
    <ConfiguracoesLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Planos</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os planos e assinaturas da sua clínica.
          </p>
        </div>
        
        <div className="text-center py-8">
          <p className="text-slate-600">Funcionalidade em desenvolvimento.</p>
        </div>
      </div>
    </ConfiguracoesLayout>
  );
}