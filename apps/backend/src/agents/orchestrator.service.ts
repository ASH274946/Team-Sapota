import { agentRegistry } from './registry.service';
import { agentMemoryService } from './memory.service';
import { v4 as uuidv4 } from 'uuid';

class AgentOrchestrator {
  public async executeTask(organizationId: string, task: string, _payload: any): Promise<any> {
    const workflowId = uuidv4();
    console.log(`[Orchestrator] Starting workflow ${workflowId} for task: ${task}`);

    const agents = agentRegistry.findAgentsForTask(task);
    if (agents.length === 0) {
      throw new Error(`No agents available for task: ${task}`);
    }

    // Select highest priority agent
    const selectedAgentDescriptor = agents[0];
    
    // In a real implementation, we would instantiate the class dynamically.
    // For this scaffold, we simulate the workflow progression.
    console.log(`[Orchestrator] Selected Agent: ${selectedAgentDescriptor.name}`);
    
    await agentMemoryService.updateContext(organizationId, workflowId, {
      task,
      status: 'IN_PROGRESS'
    });

    // Workflow Engine Simulation (Sequential)
    // 1. Agent Executes
    // 2. Writes to Shared Memory
    // 3. Next Agent Executes or Finalizes
    
    await agentMemoryService.updateContext(organizationId, workflowId, {
      status: 'COMPLETED',
      finalOutput: { success: true, message: `Task ${task} completed by ${selectedAgentDescriptor.name}` }
    });

    const finalContext = await agentMemoryService.getContext(organizationId, workflowId);
    return finalContext.finalOutput;
  }
}

export const agentOrchestrator = new AgentOrchestrator();
