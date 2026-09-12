'use client';

import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { Network, Database, Sparkles, Target, ArrowRight, Play, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIWorkflowDesignerPage() {
  const handleExecuteWorkflow = () => {
    toast.success('Agent Orchestrator dispatched workflow for execution!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="Multi-Agent Workflow Designer"
          subtitle="Visually construct autonomous AI pipelines by chaining specialized agents."
        />
        <div style={{ display: 'flex', gap: 12 }}>
           <Button variant="outline">Save Template</Button>
           <Button variant="primary" onClick={handleExecuteWorkflow}><Play size={16} style={{ marginRight: 8 }} /> Test Workflow</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 24, height: '600px' }}>
        
        {/* Agent Toolbox */}
        <Card padding="24px" style={{ background: 'var(--bg-muted)' }}>
           <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 16px 0' }}>Agent Swarm</h3>
           <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 24 }}>Drag agents into the canvas to build pipelines.</p>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
             <div style={{ padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, cursor: 'grab' }}>
               <Database size={18} color="#3B82F6" />
               <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Knowledge Agent</span>
             </div>
             <div style={{ padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, cursor: 'grab' }}>
               <FileText size={18} color="#10B981" />
               <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Assessment Agent</span>
             </div>
             <div style={{ padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, cursor: 'grab' }}>
               <Target size={18} color="#8B5CF6" />
               <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>OBE & Accreditation Agent</span>
             </div>
             <div style={{ padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, cursor: 'grab' }}>
               <Sparkles size={18} color="#F59E0B" />
               <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Research Agent</span>
             </div>
           </div>
        </Card>

        {/* Visual Canvas (Mocked Node-Graph for Phase 23 scaffolding) */}
        <div style={{ background: 'var(--bg-canvas, #F9FAFB)', border: '2px dashed var(--border)', borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
          
          <div style={{ position: 'absolute', top: 16, left: 16, fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Network size={14} /> ACTIVE WORKFLOW: "Automated Course Generation Pipeline"
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
             
             {/* Node 1 */}
             <div style={{ width: 220, padding: 16, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#3B82F6' }}>
                 <Database size={16} /> <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Knowledge Agent</span>
               </div>
               <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                 Ingests uploaded Syllabus PDF, chunks semantically, and stores in Hybrid RAG.
               </p>
               <div style={{ marginTop: 12, fontSize: 'var(--text-xs)', color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                 <CheckCircle2 size={12} /> Execution Mode: Sequential
               </div>
             </div>

             <ArrowRight size={24} color="var(--text-muted)" />

             {/* Node 2 */}
             <div style={{ width: 220, padding: 16, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#10B981' }}>
                 <FileText size={16} /> <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Assessment Agent</span>
               </div>
               <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                 Reads Hybrid RAG syllabus context to generate a 50-question diagnostic exam blueprint.
               </p>
               <div style={{ marginTop: 12, fontSize: 'var(--text-xs)', color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                 <CheckCircle2 size={12} /> Depends on: Node 1
               </div>
             </div>

             <ArrowRight size={24} color="var(--text-muted)" />

             {/* Node 3 */}
             <div style={{ width: 220, padding: 16, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#8B5CF6' }}>
                 <Target size={16} /> <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>OBE Agent</span>
               </div>
               <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                 Maps the generated questions to NBA Course Outcomes and evaluates Bloom Taxonomy coverage.
               </p>
               <div style={{ marginTop: 12, fontSize: 'var(--text-xs)', color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                 <CheckCircle2 size={12} /> Depends on: Node 2
               </div>
             </div>

          </div>
        </div>

      </div>
    </div>
  );
}
