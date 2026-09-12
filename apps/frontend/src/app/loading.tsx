import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
      <Loader2 size={48} className="animate-spin" style={{ color: '#3B82F6' }} />
      <p style={{ marginTop: 16, fontSize: '18px', fontWeight: 500, color: '#4B5563' }}>Loading Dashboard...</p>
    </div>
  );
}
