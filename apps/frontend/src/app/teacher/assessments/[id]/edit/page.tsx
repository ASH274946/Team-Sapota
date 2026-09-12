'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    gradeLevel: '',
    targetAudience: 'All Enrolled Students',
    dueDate: ''
  });

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await api.get(`/assignments/${id}`);
        if (res.data?.success) {
          const assignment = res.data.data;
          setFormData({
            title: assignment.title || '',
            description: assignment.description || '',
            subject: assignment.subject || '',
            gradeLevel: assignment.gradeLevel || '10',
            targetAudience: assignment.targetAudience || 'All Enrolled Students',
            dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : ''
          });
        }
      } catch (err) {
        toast.error('Failed to load assignment details');
      } finally {
        setInitialLoad(false);
      }
    };
    fetchAssignment();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.subject || !formData.dueDate) {
      toast.error('Title, Subject, and Due Date are required');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        gradeLevel: formData.gradeLevel,
        targetAudience: formData.targetAudience,
        dueDate: formData.dueDate
      };

      const res = await api.put(`/assignments/${id}`, payload);
      if (res.data?.success) {
        toast.success('Assignment updated successfully');
        router.push('/assignments');
      }
    } catch (err) {
      toast.error('Failed to update assignment');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return <div style={{ padding: 20 }}>Loading assignment...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800, margin: '0 auto' }}>
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}>
        <ArrowLeft size={16} /> Back to Hub
      </button>

      <PageHeader
        title="Edit Assignment"
        subtitle="Update assignment details and deadlines."
      />

      <Card padding="32px">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Title *</label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 'var(--text-base)', outline: 'none', background: 'var(--surface)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Instructions / Description</label>
            <textarea 
              rows={4}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 'var(--text-base)', outline: 'none', background: 'var(--surface)', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Subject *</label>
              <input 
                type="text" 
                required
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 'var(--text-base)', outline: 'none', background: 'var(--surface)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Due Date *</label>
              <input 
                type="date" 
                required
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 'var(--text-base)', outline: 'none', background: 'var(--surface)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button type="submit" variant="primary" disabled={loading}>
              <Save size={16} style={{ marginRight: 8 }} />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
