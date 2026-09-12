export interface AgentCapability {
  task: string;
  subjects?: string[];
  priority: number;
}

export interface AgentDescriptor {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  version: string;
  costPerHour?: number;
}

class AgentRegistryService {
  private agents: Map<string, AgentDescriptor> = new Map();

  public register(agent: AgentDescriptor) {
    this.agents.set(agent.id, agent);
    console.log(`[AgentRegistry] Registered agent: ${agent.name} (${agent.version})`);
  }

  public getAgent(id: string): AgentDescriptor | undefined {
    return this.agents.get(id);
  }

  public findAgentsForTask(task: string): AgentDescriptor[] {
    const matched = Array.from(this.agents.values()).filter(agent =>
      agent.capabilities.some(cap => cap.task === task)
    );
    return matched.sort((a, b) => {
      const pA = a.capabilities.find(c => c.task === task)?.priority || 0;
      const pB = b.capabilities.find(c => c.task === task)?.priority || 0;
      return pB - pA;
    });
  }
}

export const agentRegistry = new AgentRegistryService();
