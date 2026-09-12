interface MemoryContext {
  organizationId: string;
  workflowId: string;
  data: Record<string, any>;
}

class MemoryService {
  private memoryStore: Map<string, MemoryContext> = new Map();

  public async getContext(organizationId: string, workflowId: string): Promise<Record<string, any>> {
    const key = `${organizationId}:${workflowId}`;
    if (!this.memoryStore.has(key)) {
      this.memoryStore.set(key, { organizationId, workflowId, data: {} });
    }
    return this.memoryStore.get(key)!.data;
  }

  public async updateContext(organizationId: string, workflowId: string, updates: Record<string, any>): Promise<void> {
    const context = await this.getContext(organizationId, workflowId);
    this.memoryStore.set(`${organizationId}:${workflowId}`, {
      organizationId,
      workflowId,
      data: { ...context, ...updates }
    });
  }

  public async clearMemory(organizationId: string, workflowId: string): Promise<void> {
    const key = `${organizationId}:${workflowId}`;
    this.memoryStore.delete(key);
  }
}

export const agentMemoryService = new MemoryService();
