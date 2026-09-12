'use client';

import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { Wrench, Network, TerminalSquare, BrainCircuit, Search, Database, RefreshCw } from 'lucide-react';

const REGISTERED_TOOLS = [
  { name: 'Generate Question', owner: 'AssessmentAgent', version: '1.2.0', status: 'Active', latency: '450ms' },
  { name: 'Semantic Search (Hybrid)', owner: 'LibraryAgent', version: '2.0.1', status: 'Active', latency: '120ms' },
  { name: 'OCR Ingestion', owner: 'KnowledgeAgent', version: '1.0.5', status: 'Active', latency: '1.4s' },
  { name: 'Map Course Outcomes', owner: 'OBEAgent', version: '1.1.0', status: 'Active', latency: '890ms' }
];

const SYSTEM_PROMPTS = [
  { domain: 'Assessment', version: 'v4.2', lastUpdated: '2 days ago', status: 'Deployed' },
  { domain: 'Grading', version: 'v3.1', lastUpdated: '1 week ago', status: 'Deployed' },
  { domain: 'Research', version: 'v2.0-beta', lastUpdated: '4 hours ago', status: 'Testing' }
];

export default function AIControlCenter() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="AI Control Center (MCP)"
          subtitle="Manage the Model Context Protocol server, dynamic tool registries, and prompt versioning."
        />
        <Button variant="outline"><RefreshCw size={16} style={{ marginRight: 8 }} /> Restart MCP Server</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 24 }}>
        
        {/* MCP Server Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card padding="24px" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 16px 0', color: '#0369A1', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Network size={18} /> MCP Server Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 'var(--text-sm)', color: '#0C4A6E' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Connection</span>
                <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>● Connected (SSE)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Active Agents</span>
                <span>14 connected</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Memory Graph</span>
                <span>4.2GB Allocated</span>
              </div>
            </div>
          </Card>

          <Card padding="24px">
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database size={18} color="var(--brand)" /> Long-Term Memory
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Explore the hierarchical semantic memory graph shared across all agents.
            </p>
            <Button variant="outline" style={{ width: '100%' }}>Open Memory Explorer</Button>
          </Card>
        </div>

        {/* Dynamic Registries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <Card padding="24px">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wrench size={20} color="var(--text-primary)" /> Dynamic Tool Registry
              </h3>
              <div style={{ position: 'relative', width: 250 }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 8 }} />
                <input placeholder="Search registered tools..." style={{ width: '100%', padding: '6px 12px 6px 36px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 'var(--text-sm)' }} />
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 0', fontWeight: 600 }}>Tool Capability</th>
                  <th style={{ padding: '12px 0', fontWeight: 600 }}>Owner Agent</th>
                  <th style={{ padding: '12px 0', fontWeight: 600 }}>Version</th>
                  <th style={{ padding: '12px 0', fontWeight: 600 }}>Avg Latency</th>
                  <th style={{ padding: '12px 0', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {REGISTERED_TOOLS.map((tool, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <TerminalSquare size={16} color="var(--text-muted)" /> {tool.name}
                    </td>
                    <td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>{tool.owner}</td>
                    <td style={{ padding: '12px 0' }}><span style={{ padding: '2px 8px', background: 'var(--bg-muted)', borderRadius: 4, fontSize: '11px', fontWeight: 600 }}>{tool.version}</span></td>
                    <td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>{tool.latency}</td>
                    <td style={{ padding: '12px 0' }}><Button variant="outline" size="sm">Inspect Schema</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card padding="24px">
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BrainCircuit size={20} color="#8B5CF6" /> Centralized Prompt Registry
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {SYSTEM_PROMPTS.map((prompt, i) => (
                <div key={i} style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{prompt.domain} Domain</span>
                    <span style={{ 
                      padding: '2px 8px', borderRadius: 12, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                      background: prompt.status === 'Deployed' ? '#D1FAE5' : '#FEF3C7',
                      color: prompt.status === 'Deployed' ? '#059669' : '#D97706'
                    }}>
                      {prompt.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Version {prompt.version} • Updated {prompt.lastUpdated}
                  </div>
                  <Button variant="outline" size="sm" style={{ width: '100%' }}>View Template</Button>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
