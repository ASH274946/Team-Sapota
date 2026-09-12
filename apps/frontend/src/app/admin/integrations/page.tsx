'use client';

import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { Settings, RefreshCw, Link as LinkIcon, Unlink, Activity, ShieldCheck, Database } from 'lucide-react';
import toast from 'react-hot-toast';

const INTEGRATIONS = [
  { id: 'google_workspace', name: 'Google Workspace', category: 'Productivity & Identity', status: 'Connected', lastSync: '10 mins ago', icon: <Database size={24} color="#4285F4" /> },
  { id: 'm365', name: 'Microsoft 365', category: 'Productivity & Identity', status: 'Disconnected', lastSync: 'Never', icon: <Database size={24} color="#00A4EF" /> },
  { id: 'canvas', name: 'Canvas LMS', category: 'Learning Management', status: 'Connected', lastSync: '2 hours ago', icon: <Activity size={24} color="#E72429" /> },
  { id: 'moodle', name: 'Moodle LMS', category: 'Learning Management', status: 'Disconnected', lastSync: 'Never', icon: <Activity size={24} color="#F98012" /> },
  { id: 'azure_ad', name: 'Azure Active Directory (SSO)', category: 'Identity Provider', status: 'Connected', lastSync: 'Real-time', icon: <ShieldCheck size={24} color="#0078D4" /> },
];

export default function IntegrationsAdminDashboard() {
  const handleConnect = (id: string) => {
    toast.success(`Initiating OAuth flow for ${id}...`);
  };

  const handleSync = () => {
    toast.success('Sync job dispatched to BullMQ workers.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="Integration Center"
          subtitle="Manage external connections, LMS syncing, Identity providers, and Webhooks."
        />
        <div style={{ display: 'flex', gap: 12 }}>
           <Button variant="outline"><Settings size={16} style={{ marginRight: 8 }} /> Webhook Config</Button>
           <Button variant="primary" onClick={handleSync}><RefreshCw size={16} style={{ marginRight: 8 }} /> Force Global Sync</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
        
        {/* Core LMS Connectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>Learning Management Systems</h3>
          
          {INTEGRATIONS.filter(i => i.category === 'Learning Management').map(integration => (
            <Card key={integration.id} padding="24px">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ padding: 12, background: 'var(--bg-muted)', borderRadius: 12 }}>{integration.icon}</div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-base)', fontWeight: 700 }}>{integration.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: integration.status === 'Connected' ? '#10B981' : '#EF4444' }} />
                      {integration.status} &middot; Last Sync: {integration.lastSync}
                    </div>
                  </div>
                </div>
                <div>
                  {integration.status === 'Connected' ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                       <Button variant="outline" size="sm" onClick={handleSync}><RefreshCw size={14} /></Button>
                       <Button variant="outline" size="sm" style={{ color: '#EF4444', borderColor: '#FCA5A5' }}><Unlink size={14} /></Button>
                    </div>
                  ) : (
                    <Button variant="primary" size="sm" onClick={() => handleConnect(integration.id)}><LinkIcon size={14} style={{ marginRight: 6 }}/> Connect</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Productivity & Identity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>Workspace & Identity (SSO)</h3>
          
          {INTEGRATIONS.filter(i => i.category !== 'Learning Management').map(integration => (
            <Card key={integration.id} padding="24px">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ padding: 12, background: 'var(--bg-muted)', borderRadius: 12 }}>{integration.icon}</div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-base)', fontWeight: 700 }}>{integration.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: integration.status === 'Connected' ? '#10B981' : '#EF4444' }} />
                      {integration.status} &middot; Last Sync: {integration.lastSync}
                    </div>
                  </div>
                </div>
                <div>
                  {integration.status === 'Connected' ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                       <Button variant="outline" size="sm" onClick={handleSync}><RefreshCw size={14} /></Button>
                       <Button variant="outline" size="sm" style={{ color: '#EF4444', borderColor: '#FCA5A5' }}><Unlink size={14} /></Button>
                    </div>
                  ) : (
                    <Button variant="primary" size="sm" onClick={() => handleConnect(integration.id)}><LinkIcon size={14} style={{ marginRight: 6 }}/> Connect</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}
