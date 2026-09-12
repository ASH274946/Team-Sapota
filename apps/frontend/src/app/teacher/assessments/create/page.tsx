'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { Input } from '@/design-system/Input';
import { DatePicker } from '@/design-system/DatePicker';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    gradeLevel: '',
    targetAudience: 'All Enrolled Students',
    dueDate: '',
    duration: 45 as number | string,
    totalMarks: 100 as number | string,
    questionCount: 10 as number | string
  });

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
        gradeLevel: formData.gradeLevel || '10',
        targetAudience: formData.targetAudience,
        dueDate: formData.dueDate,
        duration: Number(formData.duration) || 45,
        totalMarks: Number(formData.totalMarks) || 100,
        questionConfig: {
          types: ['mcq', 'short-answer', 'long-answer'],
          count: Number(formData.questionCount) || 10,
          difficulty: { easy: 34, medium: 33, hard: 33 }
        }
      };

      const res = await api.post('/assignments', payload);
      if (res.data?.success) {
        toast.success('Assignment created successfully');
        router.push('/assignments');
      }
    } catch (err) {
      toast.error('Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800, margin: '0 auto' }}>
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}>
        <ArrowLeft size={16} /> Back to Hub
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <PageHeader
          title="Create New Assignment"
          subtitle="Configure a new assignment or assessment for your class."
        />
        <Button variant="primary" onClick={() => router.push('/assignments/create')}>
          <Sparkles size={16} style={{ marginRight: 8 }} /> AI Question Paper Studio
        </Button>
      </div>

      <Card padding="32px">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Input 
            label="Title *"
            required
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Instructions / Description</label>
            <textarea 
              rows={4}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 'var(--text-base)', outline: 'none', background: 'var(--surface)', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical', transition: 'border-color 0.15s, box-shadow 0.15s' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-focus)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232, 83, 29, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input 
              label="Subject *"
              required
              value={formData.subject}
              onChange={e => setFormData({ ...formData, subject: e.target.value })}
            />
            <DatePicker 
              label="Due Date *"
              required
              value={formData.dueDate}
              onChange={(val) => setFormData({ ...formData, dueDate: val })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Input 
              label="Duration (mins) *"
              type="number"
              min="1"
              max="600"
              required
              value={formData.duration}
              onChange={e => setFormData({ ...formData, duration: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })}
            />
            <Input 
              label="Total Marks *"
              type="number"
              min="1"
              max="1000"
              required
              value={formData.totalMarks}
              onChange={e => setFormData({ ...formData, totalMarks: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })}
            />
            <Input 
              label="Number of Questions *"
              type="number"
              min="1"
              max="100"
              required
              value={formData.questionCount}
              onChange={e => setFormData({ ...formData, questionCount: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button type="submit" variant="primary" disabled={loading}>
              <Save size={16} style={{ marginRight: 8 }} />
              {loading ? 'Creating...' : 'Create Assignment'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
