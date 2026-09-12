'use client';
import { NativeSelect } from '@/components/ui/native-select';


import { useState } from 'react';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { Image as ImageIcon, Type, Palette, FileText, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WhiteLabelBrandingPage() {
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [secondaryColor, setSecondaryColor] = useState('#10B981');
  const [fontFamily, setFontFamily] = useState('Inter');

  const handleSave = () => {
    toast.success('Branding settings saved. Changes will propagate globally.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="White-Label Branding"
          subtitle="Customize the appearance of the platform for your institution."
        />
        <Button variant="primary" onClick={handleSave}>Save Changes</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        
        {/* Core Branding Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <Card padding="24px">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <Palette size={20} color="var(--brand)" />
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>Color Theme</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 8 }}>Primary Color</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                  <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6 }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 8 }}>Secondary (Accent) Color</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                  <input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6 }} />
                </div>
              </div>
            </div>
          </Card>

          <Card padding="24px">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <ImageIcon size={20} color="var(--brand)" />
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>Logos & Assets</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ padding: 24, border: '2px dashed var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: 'var(--bg-muted)' }}>
                <ImageIcon size={32} color="var(--text-muted)" />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Upload Institutional Logo (SVG, PNG)</p>
                  <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Recommended size: 512x128px</p>
                </div>
                <Button variant="outline" size="sm">Choose File</Button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, border: '1px solid var(--border)', borderRadius: 8 }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-sm)', fontWeight: 600 }}>Login Screen Background</h4>
                  <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Custom image for your SSO portal.</p>
                </div>
                <Button variant="outline" size="sm">Upload</Button>
              </div>
            </div>
          </Card>

          <Card padding="24px">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <Type size={20} color="var(--brand)" />
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>Typography</h3>
            </div>
            
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 8 }}>Global Font Family</label>
            <NativeSelect 
              value={fontFamily} 
              onChange={e => setFontFamily(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6 }}
            >
              <option value="Inter">Inter (Default)</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Merriweather">Merriweather (Serif)</option>
            </NativeSelect>
          </Card>

        </div>

        {/* Live Preview Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card padding="0" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', background: 'var(--bg-muted)', borderBottom: '1px solid var(--border)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Settings2 size={16} /> Live Preview
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, fontFamily: fontFamily }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Primary Button</span>
                <button style={{ 
                  background: primaryColor, color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                }}>
                  Submit Assignment
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Secondary Indicator</span>
                <div style={{ padding: '12px 16px', background: `${secondaryColor}15`, borderLeft: `4px solid ${secondaryColor}`, borderRadius: '0 6px 6px 0' }}>
                  <span style={{ color: secondaryColor, fontWeight: 600, fontSize: 'var(--text-sm)' }}>Sync Successful</span>
                </div>
              </div>

              <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>Typography Example</h4>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  This is how standard paragraph text will appear using the {fontFamily} font family across the platform.
                </p>
              </div>

            </div>
          </Card>
          
          <Card padding="24px">
             <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
               <FileText size={20} color="var(--text-secondary)" />
               <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>Advanced Customization</h3>
             </div>
             <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 16 }}>
               Need custom PDF report templates or a distinct mobile app build? Contact your Enterprise Account Manager.
             </p>
             <Button variant="outline" style={{ width: '100%' }}>Request Custom Templates</Button>
          </Card>
        </div>

      </div>
    </div>
  );
}
