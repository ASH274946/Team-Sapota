export interface AgentContext {
  organizationId: string;
  userId?: string;
  courseId?: string;
  sessionId: string;
  memoryData?: any;
}

export interface AgentResult {
  success: boolean;
  data: any;
  confidenceScore: number;
  citations: string[];
  executionTimeMs: number;
  tokensUsed: number;
}

export abstract class BaseAgent {
  public abstract readonly name: string;
  public abstract readonly capabilities: string[];

  /**
   * Pre-execution validation (RBAC, Guardrails, Data Access).
   */
  protected abstract validateContext(context: AgentContext): Promise<boolean>;

  /**
   * Fetch context from Hybrid RAG / Vector Store before executing.
   */
  protected abstract buildRAGContext(query: string, context: AgentContext): Promise<string>;

  /**
   * Core execution loop of the specialized Agent.
   */
  protected abstract executeTask(query: string, ragContext: string, context: AgentContext): Promise<AgentResult>;

  /**
   * Post-execution validation (Hallucination detection, Safety thresholds).
   */
  protected abstract validateResponse(result: AgentResult): Promise<boolean>;

  /**
   * Main entrypoint for the Agent Orchestrator.
   */
  public async run(query: string, context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    console.log(`[${this.name}] Starting task: ${query}`);

    await this.validateContext(context);
    
    const ragContext = await this.buildRAGContext(query, context);
    
    const result = await this.executeTask(query, ragContext, context);
    
    const isValid = await this.validateResponse(result);
    if (!isValid) {
      throw new Error(`[${this.name}] Response failed safety/confidence validation.`);
    }

    result.executionTimeMs = Date.now() - startTime;
    console.log(`[${this.name}] Task completed in ${result.executionTimeMs}ms with confidence ${result.confidenceScore}`);
    
    return result;
  }
}
