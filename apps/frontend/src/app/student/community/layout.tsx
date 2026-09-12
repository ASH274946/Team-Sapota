'use client';

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        position: 'fixed',
        top: 64,
        left: 260,
        right: 0,
        bottom: 0,
        background: '#f8f9fb',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ flex: 1, display: 'flex', minWidth: 0, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}
