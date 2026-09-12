'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface Student {
  id: string; // groupStudent id
  name: string;
  rollNo: string;
  email: string;
  classStudentId?: string;
}

interface EligibleStudent {
  id: string; // classStudent id
  name: string;
  rollNo: string;
  email: string;
  className: string;
}

export default function EditGroupPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    classId: '',
  });

  const [currentStudents, setCurrentStudents] = useState<Student[]>([]);
  const [eligibleStudents, setEligibleStudents] = useState<EligibleStudent[]>([]);
  const [selectedEligible, setSelectedEligible] = useState<EligibleStudent[]>([]);

  const fetchGroupData = async () => {
    try {
      const [groupRes, studentsRes, eligibleRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/groups/${groupId}/students`),
        api.get('/groups/eligible-students')
      ]);

      const group = groupRes.data.data;
      setFormData({
        name: group.name || '',
        description: group.description || '',
        subject: group.subject || '',
        classId: group.classId || '',
      });

      setCurrentStudents(studentsRes.data.data || []);

      const eligibleData = eligibleRes.data.data.map((s: any) => ({
        id: s.id,
        name: s.name,
        rollNo: s.rollNo,
        email: s.email,
        className: s.class ? `${s.class.grade} - ${s.class.section}` : '',
      }));
      setEligibleStudents(eligibleData);
    } catch (err: any) {
      toast.error('Failed to load group details');
      router.push('/teacher/groups');
    } finally {
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Group name is required');
      return;
    }
    
    setLoading(true);
    try {
      await api.put(`/groups/${groupId}`, formData);
      toast.success('Group updated successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudents = async () => {
    if (selectedEligible.length === 0) return;
    setLoading(true);
    try {
      await api.post(`/groups/${groupId}/students/bulk`, {
        students: selectedEligible.map(s => ({
          classStudentId: s.id,
          name: s.name,
          rollNo: s.rollNo,
          email: s.email,
        }))
      });
      toast.success(`${selectedEligible.length} students added`);
      setSelectedEligible([]);
      fetchGroupData(); // refresh
    } catch (err: any) {
      toast.error('Failed to add students');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student from the group?')) return;
    try {
      await api.delete(`/groups/${groupId}/students/${studentId}`);
      toast.success('Student removed');
      setCurrentStudents(currentStudents.filter(s => s.id !== studentId));
    } catch (err: any) {
      toast.error('Failed to remove student');
    }
  };

  const handleEligibleToggle = (student: EligibleStudent) => {
    const isSelected = selectedEligible.some(s => s.id === student.id);
    if (isSelected) {
      setSelectedEligible(selectedEligible.filter(s => s.id !== student.id));
    } else {
      setSelectedEligible([...selectedEligible, student]);
    }
  };

  if (initialLoad) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading group data...</div>;
  }

  // Filter out students already in the group
  const availableToSelect = eligibleStudents.filter(
    eligible => !currentStudents.some(current => current.classStudentId === eligible.id)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40, width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button 
          onClick={() => router.push('/teacher/groups')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={20} color="var(--text-secondary)" />
        </button>
        <PageHeader 
          title="Edit Group" 
          subtitle="Update group details and manage student roster."
        />
      </div>

      <form onSubmit={handleUpdateGroup} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Card padding="24px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Group Details</h3>
            <button 
              type="submit"
              disabled={loading}
              style={{ padding: '8px 16px', background: 'var(--brand)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Save size={16} /> Save Details
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Group Name <span style={{color: 'var(--error)'}}>*</span></label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
                required
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        </Card>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Current Students List */}
        <Card padding="24px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Current Students</h3>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>
              {currentStudents.length} Students
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
            {currentStudents.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-muted)', borderRadius: 12 }}>
                No students in this group yet.
              </div>
            ) : (
              currentStudents.map(student => (
                <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{student.rollNo}</div>
                  </div>
                  <button 
                    onClick={() => handleRemoveStudent(student.id)}
                    style={{ background: 'var(--error-muted)', color: 'var(--error)', border: 'none', padding: 8, borderRadius: 8, cursor: 'pointer' }}
                    title="Remove from group"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Add New Students */}
        <Card padding="24px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Add Students</h3>
            <button 
              onClick={handleAddStudents}
              disabled={selectedEligible.length === 0 || loading}
              style={{ padding: '6px 12px', background: selectedEligible.length > 0 ? 'var(--brand)' : 'var(--bg-muted)', border: 'none', borderRadius: 8, color: selectedEligible.length > 0 ? 'white' : 'var(--text-tertiary)', fontWeight: 600, cursor: selectedEligible.length > 0 ? 'pointer' : 'not-allowed', fontSize: 13 }}
            >
              Add Selected ({selectedEligible.length})
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
            {availableToSelect.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-muted)', borderRadius: 12 }}>
                No eligible students to add.
              </div>
            ) : (
              availableToSelect.map(student => {
                const isSelected = selectedEligible.some(s => s.id === student.id);
                return (
                  <div 
                    key={student.id}
                    onClick={() => handleEligibleToggle(student)}
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
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
