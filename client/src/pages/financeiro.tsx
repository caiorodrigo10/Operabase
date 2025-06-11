import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Plus,
  Receipt,
  Users,
  Clock,
  AlertTriangle,
  FileText,
  PieChart,
  BarChart3,
  Download
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Schemas para formulários
const customerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  cpf_cnpj: z.string().optional(),
  address: z.string().optional(),
  contact_id: z.number().optional(),
});

const chargeSchema = z.object({
  customer_id: z.number({ required_error: "Cliente é obrigatório" }),
  value: z.number().min(1, "Valor deve ser maior que 0"),
  description: z.string().min(1, "Descrição é obrigatória"),
  due_date: z.string().min(1, "Data de vencimento é obrigatória"),
  billing_type: z.enum(["BOLETO", "CREDIT_CARD", "PIX", "UNDEFINED"]),
  appointment_id: z.number().optional(),
});

const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.number().min(1, "Valor deve ser maior que 0"),
  payment_method: z.string().optional(),
  reference_date: z.string().min(1, "Data é obrigatória"),
  notes: z.string().optional(),
  contact_id: z.number().optional(),
  appointment_id: z.number().optional(),
});

// Função para formatar moeda
const formatCurrency = (valueInCents: number) => {
  return (valueInCents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

// Função para converter moeda para centavos
const parseCurrency = (value: string) => {
  const cleanValue = value.replace(/[R$\s]/g, '').replace(',', '.');
  return Math.round(parseFloat(cleanValue) * 100);
};

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isNewChargeOpen, setIsNewChargeOpen] = useState(false);
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
  const { toast } = useToast();

  // Queries
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ["/api/financial/dashboard"],
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["/api/financial/customers"],
  });

  const { data: charges = [], isLoading: chargesLoading } = useQuery({
    queryKey: ["/api/financial/charges"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/financial/transactions"],
  });

  // Forms
  const customerForm = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      cpf_cnpj: "",
      address: "",
    },
  });

  const chargeForm = useForm({
    resolver: zodResolver(chargeSchema),
    defaultValues: {
      customer_id: 0,
      value: 0,
      description: "",
      due_date: "",
      billing_type: "PIX" as const,
    },
  });

  const transactionForm = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "INCOME" as const,
      category: "",
      description: "",
      amount: 0,
      payment_method: "",
      reference_date: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  // Mutations
  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/financial/customers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/customers"] });
      setIsNewCustomerOpen(false);
      customerForm.reset();
      toast({ title: "Cliente criado com sucesso!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao criar cliente", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const createChargeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/financial/charges", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/charges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/dashboard"] });
      setIsNewChargeOpen(false);
      chargeForm.reset();
      toast({ title: "Cobrança criada com sucesso!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao criar cobrança", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/financial/transactions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/dashboard"] });
      setIsNewTransactionOpen(false);
      transactionForm.reset();
      toast({ title: "Transação registrada com sucesso!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao registrar transação", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800',
      'RECEIVED': 'bg-green-100 text-green-800',
      'OVERDUE': 'bg-red-100 text-red-800',
      'REFUNDED': 'bg-gray-100 text-gray-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getBillingTypeIcon = (type: string) => {
    switch (type) {
      case 'PIX': return '💰';
      case 'CREDIT_CARD': return '💳';
      case 'BOLETO': return '📄';
      default: return '💸';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Módulo Financeiro</h1>
          <p className="text-muted-foreground">Gestão completa de pagamentos e faturamento</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={isNewTransactionOpen} onOpenChange={setIsNewTransactionOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="charges">Cobranças</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {dashboardLoading ? (
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(dashboard?.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +12.5% do mês passado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(dashboard?.totalExpenses || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +2.1% do mês passado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(dashboard?.pendingCharges || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboard?.chargesByStatus?.find(s => s.status === 'PENDING')?.count || 0} cobranças
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(dashboard?.overdueCharges || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboard?.chargesByStatus?.find(s => s.status === 'OVERDUE')?.count || 0} cobranças
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Transações Recentes</CardTitle>
                <CardDescription>Últimas movimentações financeiras</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard?.recentTransactions?.slice(0, 5).map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          transaction.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">{transaction.category}</p>
                        </div>
                      </div>
                      <div className={`text-sm font-medium ${
                        transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground">Nenhuma transação encontrada</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status das Cobranças</CardTitle>
                <CardDescription>Distribuição por status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard?.chargesByStatus?.map((item: any) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        <span className="text-sm">{item.count} cobranças</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground">Nenhuma cobrança encontrada</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charges" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Cobranças</h2>
            <Dialog open={isNewChargeOpen} onOpenChange={setIsNewChargeOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Cobrança
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nova Cobrança</DialogTitle>
                  <DialogDescription>
                    Crie uma nova cobrança para um cliente
                  </DialogDescription>
                </DialogHeader>
                <Form {...chargeForm}>
                  <form onSubmit={chargeForm.handleSubmit((data) => {
                    createChargeMutation.mutate({
                      ...data,
                      value: parseCurrency(data.value.toString()),
                    });
                  })} className="space-y-4">
                    <FormField
                      control={chargeForm.control}
                      name="customer_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um cliente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers.map((customer: any) => (
                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                  {customer.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={chargeForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Consulta de Psicologia" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={chargeForm.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor (R$)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="150.00" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={chargeForm.control}
                        name="due_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vencimento</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={chargeForm.control}
                      name="billing_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Cobrança</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PIX">PIX</SelectItem>
                              <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                              <SelectItem value="BOLETO">Boleto</SelectItem>
                              <SelectItem value="UNDEFINED">Não Definido</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsNewChargeOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createChargeMutation.isPending}>
                        {createChargeMutation.isPending ? "Criando..." : "Criar Cobrança"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {chargesLoading ? (
                  <div className="p-4">Carregando cobranças...</div>
                ) : charges.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhuma cobrança encontrada</p>
                    <p className="text-sm">Crie sua primeira cobrança para começar</p>
                  </div>
                ) : (
                  charges.map((charge: any) => (
                    <div key={charge.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">{getBillingTypeIcon(charge.billing_type)}</div>
                          <div>
                            <h4 className="font-medium">{charge.description}</h4>
                            <p className="text-sm text-muted-foreground">
                              Cliente #{charge.customer_id} • Vencimento: {new Date(charge.due_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{formatCurrency(charge.value)}</div>
                          <Badge variant="outline" className={getStatusColor(charge.status)}>
                            {charge.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Clientes</h2>
            <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Cliente</DialogTitle>
                  <DialogDescription>
                    Adicione um novo cliente ao sistema financeiro
                  </DialogDescription>
                </DialogHeader>
                <Form {...customerForm}>
                  <form onSubmit={customerForm.handleSubmit((data) => createCustomerMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={customerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={customerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@exemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={customerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(11) 99999-9999" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={customerForm.control}
                      name="cpf_cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF/CNPJ</FormLabel>
                          <FormControl>
                            <Input placeholder="000.000.000-00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={customerForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Endereço completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsNewCustomerOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createCustomerMutation.isPending}>
                        {createCustomerMutation.isPending ? "Criando..." : "Criar Cliente"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {customersLoading ? (
                  <div className="p-4">Carregando clientes...</div>
                ) : customers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhum cliente encontrado</p>
                    <p className="text-sm">Adicione seu primeiro cliente para começar</p>
                  </div>
                ) : (
                  customers.map((customer: any) => (
                    <div key={customer.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{customer.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {customer.email} • {customer.phone}
                          </p>
                          {customer.cpf_cnpj && (
                            <p className="text-xs text-muted-foreground">{customer.cpf_cnpj}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">
                            {customer.asaas_customer_id ? 'Sincronizado' : 'Local'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Transações</h2>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {transactionsLoading ? (
                  <div className="p-4">Carregando transações...</div>
                ) : transactions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhuma transação encontrada</p>
                    <p className="text-sm">Registre sua primeira transação para começar</p>
                  </div>
                ) : (
                  transactions.map((transaction: any) => (
                    <div key={transaction.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${
                            transaction.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <h4 className="font-medium">{transaction.description}</h4>
                            <p className="text-sm text-muted-foreground">
                              {transaction.category} • {new Date(transaction.reference_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </div>
                          {transaction.payment_method && (
                            <p className="text-xs text-muted-foreground">{transaction.payment_method}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Relatórios</h2>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar Relatório
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Receitas vs Despesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Receitas</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(dashboard?.totalRevenue || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Despesas</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(dashboard?.totalExpenses || 0)}
                    </span>
                  </div>
                  <hr />
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Lucro Líquido</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(dashboard?.netProfit || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Assinatura Recorrente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">MRR (Receita Mensal Recorrente)</span>
                    <span className="font-medium">
                      {formatCurrency(dashboard?.monthlyRecurringRevenue || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">ARR (Receita Anual Recorrente)</span>
                    <span className="font-medium">
                      {formatCurrency((dashboard?.monthlyRecurringRevenue || 0) * 12)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para Nova Transação */}
      <Dialog open={isNewTransactionOpen} onOpenChange={setIsNewTransactionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
            <DialogDescription>
              Registre uma nova entrada ou saída financeira
            </DialogDescription>
          </DialogHeader>
          <Form {...transactionForm}>
            <form onSubmit={transactionForm.handleSubmit((data) => {
              createTransactionMutation.mutate({
                ...data,
                amount: parseCurrency(data.amount.toString()),
              });
            })} className="space-y-4">
              <FormField
                control={transactionForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INCOME">Receita</SelectItem>
                        <SelectItem value="EXPENSE">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={transactionForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Consultas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={transactionForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="150.00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={transactionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição da transação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={transactionForm.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CASH">Dinheiro</SelectItem>
                          <SelectItem value="CARD">Cartão</SelectItem>
                          <SelectItem value="PIX">PIX</SelectItem>
                          <SelectItem value="TRANSFER">Transferência</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={transactionForm.control}
                  name="reference_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={transactionForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observações adicionais..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsNewTransactionOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createTransactionMutation.isPending}>
                  {createTransactionMutation.isPending ? "Registrando..." : "Registrar Transação"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}