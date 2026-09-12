import { agentMemoryService } from './memory.service';

export abstract class BaseAgent {
  public id: string;
  public name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  public async execute(organizationId: string, workflowId: string, payload: any): Promise<any> {
    console.log(`[Agent] ${this.name} executing in workflow ${workflowId}...`);
    
    // Fetch shared memory context
    const context = await agentMemoryService.getContext(organizationId, workflowId);
    
    // Abstract execution logic (must be implemented by child agents)
    const result = await this.performTask(payload, context);
    
    // Update shared memory
    await agentMemoryService.updateContext(organizationId, workflowId, {
      [`${this.id}_result`]: result
    });

    return result;
  }

  protected abstract performTask(payload: any, context: Record<string, any>): Promise<any>;
}
