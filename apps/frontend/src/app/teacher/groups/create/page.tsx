'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  classId?: string;
  className?: string;
}

export default function CreateGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    classId: '',
  });

  const [eligibleStudents, setEligibleStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const fetchEligibleStudents = async () => {
    try {
      const res = await api.get('/groups/eligible-students');
      const studentsData = res.data.data.map((s: any) => ({
        id: s.id,
        userId: s.userId || s.id,
        classStudentId: s.classStudentId,
        name: s.name,
        rollNo: s.rollNo,
        email: s.email,
        classId: s.classId,
        className: s.class ? `${s.class.grade} - ${s.class.section}` : '',
      }));
      setEligibleStudents(studentsData);
    } catch (err: any) {
      toast.error('Failed to load eligible students');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchEligibleStudents();
  }, []);

  const handleStudentToggle = (student: Student) => {
    const isSelected = selectedStudents.some(s => s.id === student.id);
    if (isSelected) {
      setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Group name is required');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        subject: formData.subject,
        classId: formData.classId || undefined,
        students: selectedStudents.map(s => ({
          userId: (s as any).userId || s.id,
          classStudentId: (s as any).classStudentId || undefined,
          name: s.name,
          rollNo: s.rollNo,
          email: s.email,
        })),
      };

      await api.post('/groups', payload);
      toast.success('Group created successfully');
      router.push('/teacher/groups');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40, width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button 
          onClick={() => router.back()}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={20} color="var(--text-secondary)" />
        </button>
        <PageHeader 
          title="Create New Group" 
          subtitle="Set up a new student group and add members."
        />
      </div>

      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Card padding="24px">
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Group Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Group Name <span style={{color: 'var(--error)'}}>*</span></label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Math Club, Remedial English, Advanced Physics"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
                required
              />
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="What is this group for?"
                rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-muted)', color: 'var(--text-primary)', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Subject</label>
              <input 
                type="text" 
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                placeholder="e.g. Mathematics"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        </Card>

        <Card padding="24px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Select Students</h3>
            <div style={{ fontSize: 14, color: 'var(--brand)', fontWeight: 600 }}>
              {selectedStudents.length} Selected
            </div>
          </div>
          
          {loadingStudents ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading eligible students...</div>
          ) : eligibleStudents.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-muted)', borderRadius: 12 }}>
              No eligible students found.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
              {eligibleStudents.map(student => {
                const isSelected = selectedStudents.some(s => s.id === student.id);
                return (
                  <div 
                    key={student.id}
                    onClick={() => handleStudentToggle(student)}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 12, 
                      padding: 12, borderRadius: 12, 
                      border: isSelected ? '2px solid var(--brand)' : '1px solid var(--border)',
                      background: isSelected ? 'var(--brand-muted)' : 'var(--surface)',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ width: 20, height: 20, borderRadius: 4, border: isSelected ? 'none' : '2px solid var(--border)', background: isSelected ? 'var(--brand)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isSelected && <div style={{ width: 10, height: 10, background: 'white', borderRadius: 2 }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{student.rollNo} • {student.className}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button 
            type="button"
            onClick={() => router.back()}
            style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            style={{ padding: '10px 24px', background: 'var(--brand)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Save size={18} />
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </form>
    </div>
  );
}
