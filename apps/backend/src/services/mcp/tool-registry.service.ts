export interface AgentTool {
  id: string;
  name: string;
  description: string;
  inputSchema: any; // JSON Schema for input validation
  outputSchema: any;
  ownerAgent: string;
  version: string;
  costEstimate: number;
}

/**
 * Dynamic Tool Registry (MCP Standard)
 * Instead of hardcoding function calls, agents query this registry at runtime to discover capabilities.
 */
export class ToolRegistryService {
  private static instance: ToolRegistryService;
  private tools: Map<string, AgentTool> = new Map();

  private constructor() {}

  public static getInstance(): ToolRegistryService {
    if (!ToolRegistryService.instance) {
      ToolRegistryService.instance = new ToolRegistryService();
    }
    return ToolRegistryService.instance;
  }

  public registerTool(tool: AgentTool): void {
    console.log(`[ToolRegistry] Registering tool: ${tool.id} v${tool.version} (Owner: ${tool.ownerAgent})`);
    this.tools.set(tool.id, tool);
  }

  /**
   * Called by an autonomous agent attempting to solve a task.
   */
  public discoverTools(intentKeywords: string[]): AgentTool[] {
    const discovered: AgentTool[] = [];
    
    // In production, this uses semantic search over tool descriptions
    for (const tool of this.tools.values()) {
      if (intentKeywords.some(kw => tool.description.toLowerCase().includes(kw.toLowerCase()))) {
        discovered.push(tool);
      }
    }

    return discovered;
  }

  public async executeTool(toolId: string, payload: any): Promise<any> {
    const tool = this.tools.get(toolId);
    if (!tool) throw new Error(`[ToolRegistry] Tool ${toolId} not found.`);

    console.log(`[ToolRegistry] Agent dispatched execution of ${tool.name} with payload:`, payload);
    // Dynamic execution logic would live here
    return { success: true, message: `Tool ${tool.name} executed successfully.` };
  }
}
