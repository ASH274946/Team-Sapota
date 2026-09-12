import { BaseAgent, AgentContext, AgentResult } from './base-agent.interface';

export class AgentOrchestrator {
  private static instance: AgentOrchestrator;
  private agents: Map<string, BaseAgent> = new Map();

  private constructor() {}

  public static getInstance(): AgentOrchestrator {
    if (!AgentOrchestrator.instance) {
      AgentOrchestrator.instance = new AgentOrchestrator();
    }
    return AgentOrchestrator.instance;
  }

  public registerAgent(agent: BaseAgent) {
    this.agents.set(agent.name, agent);
    console.log(`[Orchestrator] Registered Agent: ${agent.name} with capabilities: [${agent.capabilities.join(', ')}]`);
  }

  /**
   * Determine the best agent for a single task and delegate.
   */
  public async delegateTask(query: string, context: AgentContext): Promise<AgentResult> {
    // Basic routing logic (in production, an LLM determines the routing)
    let selectedAgent: BaseAgent | null = null;
    
    if (query.toLowerCase().includes('generate quiz')) {
      selectedAgent = this.agents.get('AssessmentAgent') || null;
    } else if (query.toLowerCase().includes('accreditation') || query.toLowerCase().includes('obe')) {
      selectedAgent = this.agents.get('OBEAgent') || null;
    } else {
      selectedAgent = this.agents.get('KnowledgeAgent') || null;
    }

    if (!selectedAgent) {
      throw new Error(`[Orchestrator] No suitable agent found for task: ${query}`);
    }

    console.log(`[Orchestrator] Delegating task to ${selectedAgent.name}...`);
    return await selectedAgent.run(query, context);
  }

  /**
   * Execute a linear multi-agent workflow (e.g., Knowledge -> Assessment -> OBE).
   */
  public async executeWorkflow(queries: string[], context: AgentContext): Promise<AgentResult[]> {
    console.log(`[Orchestrator] Initiating Multi-Agent Workflow (${queries.length} steps)...`);
    const results: AgentResult[] = [];
    
    for (const query of queries) {
      // Memory persistence: pass previous results into the next agent's context
      context.memoryData = { previousResults: results };
      const res = await this.delegateTask(query, context);
      results.push(res);
    }

    console.log(`[Orchestrator] Multi-Agent Workflow Complete.`);
    return results;
  }

  /**
   * Pre-configured production workflow: Automated Course Generation Pipeline
   */
  public async executeSyllabusIngestionWorkflow(context: AgentContext): Promise<AgentResult[]> {
    console.log(`[Orchestrator] Starting Autonomous Workflow: Syllabus Ingestion Pipeline`);
    
    // Step 1: Knowledge Agent parses the syllabus and creates the Vector Context
    const knowledgeRes = await this.agents.get('KnowledgeAgent')!.run('Ingest and chunk syllabus.pdf', context);
    context.memoryData = { previousResults: [knowledgeRes] };

    // Step 2: Assessment Agent reads the vectors and generates a diagnostic quiz
    const assessmentRes = await this.agents.get('AssessmentAgent')!.run('Generate 2-question diagnostic exam from syllabus context', context);
    context.memoryData = { previousResults: [knowledgeRes, assessmentRes] };

    // Step 3: OBE Agent maps the diagnostic quiz to institutional accreditation outcomes
    const obeRes = await this.agents.get('OBEAgent')!.run('Map generated exam to Course Outcomes', context);
    
    console.log(`[Orchestrator] Autonomous Workflow Complete.`);
    return [knowledgeRes, assessmentRes, obeRes];
  }
}
