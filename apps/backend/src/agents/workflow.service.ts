import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { agentOrchestrator } from './orchestrator.service';

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export const multiAgentQueue = new Queue('multi-agent-workflows', { connection: redis });

export const multiAgentWorker = new Worker('multi-agent-workflows', async (job: Job) => {
  const { organizationId, task, payload } = job.data;
  
  console.log(`[WorkflowEngine] Processing job ${job.id} for task ${task}`);
  
  try {
    const result = await agentOrchestrator.executeTask(organizationId, task, payload);
    return result;
  } catch (error: any) {
    console.error(`[WorkflowEngine] Job ${job.id} failed:`, error.message);
    throw error;
  }
}, { connection: redis, concurrency: 5 });

multiAgentWorker.on('completed', (job: Job) => {
  console.log(`[WorkflowEngine] Job ${job.id} has completed!`);
});

multiAgentWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.log(`[WorkflowEngine] Job ${job?.id} has failed with ${err.message}`);
});
