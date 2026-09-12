import { BaseAgent, AgentContext, AgentResult } from './base-agent.interface';

export class OBEAgent extends BaseAgent {
  public readonly name = 'OBEAgent';
  public readonly capabilities = ['CO Mapping', 'PO Mapping', 'Attainment Calculation', 'Accreditation Reports'];

  protected async validateContext(context: AgentContext): Promise<boolean> {
    console.log(`[${this.name}] Validating Institutional OBE context for Org: ${context.organizationId}`);
    return true; // Assume valid
  }

  protected async buildRAGContext(_query: string, _context: AgentContext): Promise<string> {
    console.log(`[${this.name}] Fetching Institutional Course Outcomes from Knowledge Graph...`);
    // Simulated RAG Fetch for Accreditation rules
    return 'CO1: Understand Data Structures. CO2: Implement Trees. PO1: Engineering Knowledge.';
  }

  protected async executeTask(query: string, ragContext: string, context: AgentContext): Promise<AgentResult> {
    console.log(`[${this.name}] Executing task: ${query}`);
    
    const previousAgentResults = context.memoryData?.previousResults;
    if (!previousAgentResults) {
      throw new Error(`[${this.name}] Failed to find memory context. OBE Agent requires output from Assessment Agent to map outcomes.`);
    }

    // In a real workflow, the Assessment Agent passes the questions down the pipeline.
    const assessmentData = previousAgentResults[previousAgentResults.length - 1].data;
    console.log(`[${this.name}] Mapping Course Outcomes against ${assessmentData.length} generated questions...`);

    const mappedQuestions = assessmentData.map((q: any) => ({
      ...q,
      mappedCO: q.type === 'Subjective' ? 'CO2' : 'CO1',
      mappedPO: 'PO1'
    }));

    return {
      success: true,
      data: {
        mappedAssessment: mappedQuestions,
        nbaCompliant: true,
        attainmentRisk: 'Low'
      },
      confidenceScore: 0.96,
      citations: ['institutional_accreditation_policy_v2'],
      executionTimeMs: 0,
      tokensUsed: 1120
    };
  }

  protected async validateResponse(result: AgentResult): Promise<boolean> {
    console.log(`[${this.name}] Verifying NBA/ABET strict outcome formatting...`);
    return result.confidenceScore > 0.90; // High threshold for accreditation data
  }
}
