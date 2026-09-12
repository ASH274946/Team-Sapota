export interface SystemPrompt {
  id: string;
  domain: 'ASSESSMENT' | 'RESEARCH' | 'GRADING' | 'OBE';
  version: string;
  template: string;
  isActive: boolean;
  createdBy: string;
}

/**
 * Centralized Prompt Registry
 * Ensures no hardcoded prompts exist in the codebase. Agents fetch the active prompt template dynamically.
 */
export class PromptRegistryService {
  private static instance: PromptRegistryService;
  private prompts: Map<string, SystemPrompt> = new Map();

  private constructor() {}

  public static getInstance(): PromptRegistryService {
    if (!PromptRegistryService.instance) {
      PromptRegistryService.instance = new PromptRegistryService();
    }
    return PromptRegistryService.instance;
  }

  public async fetchActivePrompt(domain: SystemPrompt['domain']): Promise<string> {
    console.log(`[PromptRegistry] Fetching active system prompt for domain: ${domain}`);
    // Simulated DB fetch
    return `You are a strict, helpful AI Agent specializing in ${domain}. Follow all institutional rubrics strictly.`;
  }
}
