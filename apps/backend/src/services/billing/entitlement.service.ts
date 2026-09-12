export type SaaSPlanTier = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface TenantEntitlements {
  organizationId: string;
  tier: SaaSPlanTier;
  isActive: boolean;
  maxSeats: number;
  aiCreditsRemaining: number;
  features: {
    multiAgent: boolean;
    digitalLibrary: boolean;
    accreditationReports: boolean;
    whiteLabel: boolean;
  }
}

import prisma from '../../config/prisma';
import { AIMetricsUtil } from '../../utils/ai-metrics.util';

/**
 * FeatureEntitlementService
 * The absolute source of truth for all feature access and AI usage metering across the platform.
 */
export class FeatureEntitlementService {
  private static instance: FeatureEntitlementService;

  private constructor() {}

  public static getInstance(): FeatureEntitlementService {
    if (!FeatureEntitlementService.instance) {
      FeatureEntitlementService.instance = new FeatureEntitlementService();
    }
    return FeatureEntitlementService.instance;
  }

  /**
   * Fetches the current entitlements for a given tenant.
   * In production, this heavily caches the DB query in Redis to prevent latency on every API call.
   */
  public async getTenantEntitlements(organizationId: string): Promise<TenantEntitlements> {
    console.log(`[EntitlementService] Fetching entitlements for Organization: ${organizationId}`);
    
    // Un-mocked: Read from database
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscription: true
      }
    });

    if (!org) {
      throw new Error(`[EntitlementService] Organization ${organizationId} not found.`);
    }

    // @ts-expect-error - Prisma mismatch
    const tier = (org.subscription?.tier || org.subscription?.plan || 'FREE') as SaaSPlanTier;
    // @ts-expect-error - Prisma mismatch
    const aiCreditsRemaining = org.subscription?.aiCreditsRemaining || 0;
    
    // Feature gating logic based on tier
    const isProfessionalOrEnterprise = tier === 'PROFESSIONAL' || tier === 'ENTERPRISE';
    const isEnterprise = tier === 'ENTERPRISE';

    return {
      organizationId,
      tier,
      isActive: org.subscription?.status === 'ACTIVE',
      // @ts-expect-error - Prisma mismatch
      maxSeats: org.subscription?.maxSeats || 10,
      aiCreditsRemaining,
      features: {
        multiAgent: isProfessionalOrEnterprise,
        digitalLibrary: true,
        accreditationReports: isEnterprise,
        whiteLabel: isEnterprise
      }
    };
  }

  /**
   * Validates if a tenant has access to a specific premium feature.
   * Throws an error if unauthorized, halting the API request.
   */
  public async enforceFeatureAccess(organizationId: string, feature: keyof TenantEntitlements['features']): Promise<boolean> {
    const entitlements = await this.getTenantEntitlements(organizationId);
    
    if (!entitlements.isActive) {
      throw new Error(`[EntitlementService] Subscription inactive. Please renew to access features.`);
    }

    if (!entitlements.features[feature]) {
      throw new Error(`[EntitlementService] 403 Forbidden: Feature '${feature}' requires a higher SaaS tier.`);
    }

    return true;
  }

  /**
   * Deducts AI compute credits for expensive operations (RAG, LLM inference, OCR).
   */
  public async consumeAICredits(organizationId: string, tokensUsed: number): Promise<boolean> {
    const entitlements = await this.getTenantEntitlements(organizationId);
    
    const creditsToConsume = AIMetricsUtil.tokensToCredits(tokensUsed);

    if (entitlements.aiCreditsRemaining < creditsToConsume) {
      throw new Error(`[EntitlementService] 402 Payment Required: Insufficient AI Credits. Please upgrade plan.`);
    }

    console.log(`[EntitlementService] Deducting ${creditsToConsume} credits from Org ${organizationId}`);
    
    await prisma.subscription.update({
      where: { organizationId },
      data: {
        // @ts-expect-error - Prisma mismatch
        aiCreditsRemaining: {
          decrement: creditsToConsume
        }
      }
    });
    
    return true;
  }
}
