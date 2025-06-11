import { z } from 'zod';

// Asaas API Types
export interface AsaasCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  country?: string;
  observations?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  externalReference?: string;
  canDelete?: boolean;
  cannotBeDeletedReason?: string;
  canEdit?: boolean;
  cannotEditReason?: string;
  dateCreated: string;
}

export interface AsaasCharge {
  id: string;
  customer: string;
  subscription?: string;
  installmentCount?: number;
  value: number;
  netValue?: number;
  originalValue?: number;
  interestValue?: number;
  description?: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  status: 'PENDING' | 'CONFIRMED' | 'RECEIVED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'REFUND_IN_PROGRESS' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
  dueDate: string;
  originalDueDate?: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  installmentNumber?: number;
  externalReference?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  transactionReceiptUrl?: string;
  invoiceNumber?: string;
  deleted: boolean;
  anticipated?: boolean;
  anticipable?: boolean;
  creditCard?: {
    creditCardNumber?: string;
    creditCardBrand?: string;
    creditCardToken?: string;
  };
  discount?: {
    value?: number;
    dueDateLimitDays?: number;
    type?: 'FIXED' | 'PERCENTAGE';
  };
  fine?: {
    value?: number;
    type?: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value?: number;
    type?: 'PERCENTAGE';
  };
  dateCreated: string;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  nextDueDate: string;
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'OVERDUE' | 'ERROR';
  dateCreated: string;
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  country?: string;
  observations?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  externalReference?: string;
}

export interface CreateChargeRequest {
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  discount?: {
    value: number;
    dueDateLimitDays?: number;
    type?: 'FIXED' | 'PERCENTAGE';
  };
  fine?: {
    value: number;
    type?: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value: number;
    type?: 'PERCENTAGE';
  };
  postalService?: boolean;
  split?: Array<{
    walletId: string;
    fixedValue?: number;
    percentualValue?: number;
  }>;
}

export interface CreateSubscriptionRequest {
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  nextDueDate: string;
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  endDate?: string;
  externalReference?: string;
  discount?: {
    value: number;
    dueDateLimitDays?: number;
    type?: 'FIXED' | 'PERCENTAGE';
  };
  fine?: {
    value: number;
    type?: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value: number;
    type?: 'PERCENTAGE';
  };
}

export class AsaasService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, sandbox = true) {
    this.apiKey = apiKey || process.env.ASAAS_API_KEY || '';
    this.baseUrl = sandbox 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/v3';
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Asaas API key not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'access_token': this.apiKey,
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Asaas API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Asaas API request failed:', error);
      throw error;
    }
  }

  // Customer operations
  async createCustomer(data: CreateCustomerRequest): Promise<AsaasCustomer> {
    return this.makeRequest<AsaasCustomer>('/customers', 'POST', data);
  }

  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    return this.makeRequest<AsaasCustomer>(`/customers/${customerId}`);
  }

  async updateCustomer(customerId: string, data: Partial<CreateCustomerRequest>): Promise<AsaasCustomer> {
    return this.makeRequest<AsaasCustomer>(`/customers/${customerId}`, 'PUT', data);
  }

  async listCustomers(params?: {
    offset?: number;
    limit?: number;
    name?: string;
    email?: string;
    cpfCnpj?: string;
  }): Promise<{ data: AsaasCustomer[]; hasMore: boolean; totalCount: number; offset: number; limit: number }> {
    const query = new URLSearchParams();
    if (params?.offset) query.append('offset', params.offset.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.name) query.append('name', params.name);
    if (params?.email) query.append('email', params.email);
    if (params?.cpfCnpj) query.append('cpfCnpj', params.cpfCnpj);

    return this.makeRequest<any>(`/customers?${query.toString()}`);
  }

  // Charge operations
  async createCharge(data: CreateChargeRequest): Promise<AsaasCharge> {
    return this.makeRequest<AsaasCharge>('/payments', 'POST', data);
  }

  async getCharge(chargeId: string): Promise<AsaasCharge> {
    return this.makeRequest<AsaasCharge>(`/payments/${chargeId}`);
  }

  async updateCharge(chargeId: string, data: Partial<CreateChargeRequest>): Promise<AsaasCharge> {
    return this.makeRequest<AsaasCharge>(`/payments/${chargeId}`, 'PUT', data);
  }

  async deleteCharge(chargeId: string): Promise<{ deleted: boolean }> {
    return this.makeRequest<{ deleted: boolean }>(`/payments/${chargeId}`, 'DELETE');
  }

  async listCharges(params?: {
    offset?: number;
    limit?: number;
    customer?: string;
    subscription?: string;
    status?: string;
    billingType?: string;
    dateCreated_ge?: string;
    dateCreated_le?: string;
    dueDate_ge?: string;
    dueDate_le?: string;
  }): Promise<{ data: AsaasCharge[]; hasMore: boolean; totalCount: number; offset: number; limit: number }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, value.toString());
      });
    }

    return this.makeRequest<any>(`/payments?${query.toString()}`);
  }

  // Subscription operations
  async createSubscription(data: CreateSubscriptionRequest): Promise<AsaasSubscription> {
    return this.makeRequest<AsaasSubscription>('/subscriptions', 'POST', data);
  }

  async getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    return this.makeRequest<AsaasSubscription>(`/subscriptions/${subscriptionId}`);
  }

  async updateSubscription(subscriptionId: string, data: Partial<CreateSubscriptionRequest>): Promise<AsaasSubscription> {
    return this.makeRequest<AsaasSubscription>(`/subscriptions/${subscriptionId}`, 'PUT', data);
  }

  async deleteSubscription(subscriptionId: string): Promise<{ deleted: boolean }> {
    return this.makeRequest<{ deleted: boolean }>(`/subscriptions/${subscriptionId}`, 'DELETE');
  }

  async listSubscriptions(params?: {
    offset?: number;
    limit?: number;
    customer?: string;
    status?: string;
  }): Promise<{ data: AsaasSubscription[]; hasMore: boolean; totalCount: number; offset: number; limit: number }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, value.toString());
      });
    }

    return this.makeRequest<any>(`/subscriptions?${query.toString()}`);
  }

  // Webhook signature validation
  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return hash === signature;
  }

  // Utility methods
  formatCurrency(valueInCents: number): string {
    return (valueInCents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  parseCurrency(value: string): number {
    // Remove R$, espaços e converte vírgula para ponto
    const cleanValue = value.replace(/[R$\s]/g, '').replace(',', '.');
    return Math.round(parseFloat(cleanValue) * 100);
  }
}

export const asaasService = new AsaasService();