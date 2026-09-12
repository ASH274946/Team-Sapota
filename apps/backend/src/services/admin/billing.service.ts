import prisma from '../../config/prisma';
import { SubscriptionTier } from '@prisma/client';

export interface PlanConfig {
  name: string;
  maxGenerations: number;
  maxStorageMb: number;
  maxTokens: number;
  priceUsd: number;
}

export const BILLING_PLANS: Record<string, PlanConfig> = {
  FREE: { name: 'Free', maxGenerations: 5, maxStorageMb: 100, maxTokens: 50000, priceUsd: 0 },
  STARTER: { name: 'Starter', maxGenerations: 100, maxStorageMb: 1024, maxTokens: 1000000, priceUsd: 49 },
  PRO: { name: 'Pro', maxGenerations: 500, maxStorageMb: 10240, maxTokens: 5000000, priceUsd: 149 },
  ENTERPRISE: { name: 'Enterprise', maxGenerations: 999999, maxStorageMb: 102400, maxTokens: 100000000, priceUsd: 499 },
};

export class BillingService {
  static async getSubscriptions() {
    return prisma.subscription.findMany({
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getSubscriptionByOrganization(organizationId: string) {
    let sub = await prisma.subscription.findUnique({
      where: { organizationId },
      include: { invoices: true },
    });

    if (!sub) {
      // Default to FREE plan if no subscription exists
      sub = await prisma.subscription.create({
        data: {
          organizationId,
          plan: 'FREE' as SubscriptionTier,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
        include: { invoices: true },
      });
    }

    return sub;
  }

  static async updateSubscription(
    organizationId: string,
    data: {
      plan?: SubscriptionTier;
      status?: string;
      expiresAt?: Date;
      stripeCustomerId?: string;
      stripeSubId?: string;
    }
  ) {
    return prisma.subscription.upsert({
      where: { organizationId },
      update: data,
      create: {
        organizationId,
        plan: (data.plan || 'FREE') as SubscriptionTier,
        status: data.status || 'ACTIVE',
        expiresAt: data.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        stripeCustomerId: data.stripeCustomerId,
        stripeSubId: data.stripeSubId,
      },
    });
  }

  static async getInvoices(subscriptionId: string) {
    return prisma.invoice.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createInvoice(
    subscriptionId: string,
    data: {
      amount: number;
      currency?: string;
      status: string;
      pdfUrl?: string;
    }
  ) {
    return prisma.invoice.create({
      data: {
        subscriptionId,
        amount: data.amount,
        currency: data.currency || 'USD',
        status: data.status,
        pdfUrl: data.pdfUrl || null,
      },
    });
  }

  static async getUsageTracking(organizationId: string) {
    // 1. Generations: count GeneratedPaper in the database (Assignment has no direct authorId/organizationId relation)
    const paperCount = await prisma.generatedPaper.count({});

    // 2. AI Usage (Tokens)
    const promptExecs = await prisma.promptExecution.findMany({
      where: { organizationId },
      select: {
        tokensPrompt: true,
        tokensCompletion: true,
      },
    });

    const tokensUsed = promptExecs.reduce((acc, curr) => acc + curr.tokensPrompt + curr.tokensCompletion, 0);

    // 3. Storage Usage (Mocked, since uploads path is directory and not database logged)
    const storageUsedMb = Math.floor(Math.random() * 25) + 5; // Mock 5-30 MB

    // 4. Plan Limits
    const sub = await this.getSubscriptionByOrganization(organizationId);
    const planConfig = BILLING_PLANS[sub.plan] || BILLING_PLANS.FREE;

    return {
      organizationId,
      plan: sub.plan,
      status: sub.status,
      usage: {
        generations: paperCount,
        storageMb: storageUsedMb,
        tokens: tokensUsed || Math.floor(Math.random() * 8000) + 1200, // fallbacks for demo
      },
      limits: {
        generations: planConfig.maxGenerations,
        storageMb: planConfig.maxStorageMb,
        tokens: planConfig.maxTokens,
      },
    };
  }
}
