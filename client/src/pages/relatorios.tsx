import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockMetrics } from "@/lib/mock-data";
import { Download, FileText, BarChart3, TrendingUp, PieChart, Clock, Mail, Calendar, CheckCircle, Star } from "lucide-react";

export function Relatorios() {
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("7days");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-64 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Relatórios</h2>
        <p className="text-slate-600">Análise detalhada do desempenho da Livia IA</p>
      </div>

      {/* Date Range Selector */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-slate-700">Período:</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Últimos 7 dias</SelectItem>
                  <SelectItem value="30days">Últimos 30 dias</SelectItem>
                  <SelectItem value="thismonth">Este mês</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-3">
              <Button className="bg-medical-blue hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Mensagens por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">Gráfico de Mensagens</p>
                <p className="text-sm text-slate-400">Últimos 7 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Consultas Marcadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">Gráfico de Agendamentos</p>
                <p className="text-sm text-slate-400">Por período selecionado</p>
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
                <p className="text-slate-500">Taxa de Conversão</p>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-medical-green">{mockMetrics.taxaConversao}%</p>
                  <p className="text-sm text-slate-500">Contatos → Agendamentos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Tempo de Resposta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
              <div className="text-center">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">Tempo Médio de Resposta</p>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-medical-blue">{mockMetrics.tempoResposta}</p>
                  <p className="text-sm text-slate-500">Resposta da Livia IA</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Mensagens</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{mockMetrics.totalMensagens.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-medical-blue" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Consultas Agendadas</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{mockMetrics.consultasAgendadas}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-medical-green" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{mockMetrics.taxaSucesso}%</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-medical-purple" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Satisfação</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{mockMetrics.satisfacao}/5</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
