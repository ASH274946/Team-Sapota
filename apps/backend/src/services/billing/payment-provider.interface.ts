export interface PaymentSubscription {
  id: string;
  planId: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodEnd: Date;
}

export interface PaymentInvoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void';
  pdfUrl?: string;
  createdAt: Date;
}

/**
 * Interface that all external payment gateways (Stripe, Razorpay, Paddle) must implement.
 * This guarantees we never hardcode vendor-specific logic into our core billing engine.
 */
export interface PaymentProviderInterface {
  readonly providerName: string;

  createCustomer(organizationId: string, email: string, name: string): Promise<string>;
  
  createSubscription(customerId: string, planId: string): Promise<PaymentSubscription>;
  
  cancelSubscription(subscriptionId: string, immediate: boolean): Promise<boolean>;
  
  getSubscription(subscriptionId: string): Promise<PaymentSubscription | null>;
  
  listInvoices(customerId: string, limit?: number): Promise<PaymentInvoice[]>;
  
  // Metered billing for AI credits
  reportUsage(subscriptionId: string, metric: 'tokens' | 'ocr_pages' | 'storage_gb', quantity: number): Promise<boolean>;
}
