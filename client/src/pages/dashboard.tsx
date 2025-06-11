import { useEffect, useState } from "react";
import { CardInfo } from "@/components/ui/card-info";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Calendar, UserCheck, TrendingUp, PieChart } from "lucide-react";
import { mockMetrics, mockActivities } from "@/lib/mock-data";

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState(mockMetrics);
  const [activities] = useState(mockActivities);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <CardInfo
          title="Mensagens Hoje"
          value={metrics.mensagensHoje}
          icon={Mail}
          iconColor="bg-blue-100 text-medical-blue"
          trend={{ value: "+12% vs ontem", isPositive: true }}
        />
        <CardInfo
          title="Agendamentos Hoje"
          value={metrics.agendamentosHoje}
          icon={Calendar}
          iconColor="bg-green-100 text-medical-green"
          trend={{ value: "+5% vs ontem", isPositive: true }}
        />
        <CardInfo
          title="Atendimentos Ativos"
          value={metrics.atendimentosAtivos}
          icon={UserCheck}
          iconColor="bg-purple-100 text-medical-purple"
          subtitle="Em andamento"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">Gráfico de Performance</p>
                <p className="text-sm text-slate-400">Dados carregando...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">Gráfico de Conversão</p>
                <p className="text-sm text-slate-400">Dados carregando...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full bg-${activity.color}-500`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{activity.action}</p>
                  <p className="text-xs text-slate-500">{activity.details}</p>
                </div>
                <span className={`px-2 py-1 bg-${activity.color}-100 text-${activity.color}-800 text-xs font-medium rounded-full`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
