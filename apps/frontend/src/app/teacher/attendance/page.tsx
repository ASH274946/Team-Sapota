'use client';

import { useState } from 'react';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { Check, X, Calendar as CalendarIcon, Users, Clock, HelpCircle, Lock, CheckCircle2, Eye } from 'lucide-react';
import { useAttendance, AttendanceStatus } from '@/hooks/useAttendance';
import { NativeSelect } from '@/components/ui/native-select';

function getTodayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function AttendancePage() {
  const [date, setDate] = useState(getTodayString());
  const [subject, setSubject] = useState('Computer Science 101');
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    students,
    loading,
    isLocked,
    isFutureDate,
    isSaved,
    setStatus,
    setAllStatus,
    saveAttendance
  } = useAttendance(date);

  const isReadOnly = isLocked || isFutureDate;

  const handleSaveClick = () => {
    if (isReadOnly) return;

    const unrecorded = students.filter(s => s.status === 'NONE').length;
    if (unrecorded > 0) {
      saveAttendance(subject); // triggers error toast inside hook
      return;
    }

    setShowConfirm(true);
  };

  const confirmSave = async () => {
    setShowConfirm(false);
    await saveAttendance(subject);
  };

  const presentCount  = students.filter(s => s.status === 'PRESENT').length;
  const absentCount   = students.filter(s => s.status === 'ABSENT').length;
  const lateCount     = students.filter(s => s.status === 'LATE').length;
  const excusedCount  = students.filter(s => s.status === 'EXCUSED').length;
  const unrecordedCount = students.filter(s => s.status === 'NONE').length;
  const totalCount    = students.length;

  const attendanceRate = totalCount > 0
    ? Math.round(((presentCount + lateCount + excusedCount) / totalCount) * 100)
    : 0;

  // Banner colour/text based on date state
  const dateBanner = (() => {
    if (isLocked) return {
      bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C',
      icon: <Lock size={18} />,
      text: 'Attendance for this past date is locked. Contact an admin to make changes.'
    };
    if (isFutureDate) return {
      bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8',
      icon: <Eye size={18} />,
      text: 'This is a future date — you can view but cannot record attendance yet.'
    };
    if (isSaved) return {
      bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D',
      icon: <CheckCircle2 size={18} />,
      text: 'Attendance already saved for today. You can still edit and re-save until end of day.'
    };
    return null;
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
      <PageHeader
        title="Class Attendance"
        subtitle="Record and manage daily or subject-specific attendance."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'stretch' }}>
        {/* Left Column: Configuration & Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card padding="20px">
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
              Configuration
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Date
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
                  <CalendarIcon size={16} color="var(--text-muted)" />
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Class / Subject
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
                  <Users size={16} color="var(--text-muted)" />
                  <NativeSelect
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}
                  >
                    <option value="Computer Science 101">Computer Science 101</option>
                    <option value="Advanced Mathematics">Advanced Mathematics</option>
                    <option value="Physics II">Physics II</option>
                  </NativeSelect>
                </div>
              </div>
            </div>
          </Card>

          <Card padding="20px">
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
              Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Total Students', value: totalCount, color: 'var(--text-primary)', bg: 'var(--bg-muted)' },
                { label: 'Present',     value: presentCount,   color: '#10B981', bg: '#ECFDF5' },
                { label: 'Absent',      value: absentCount,    color: '#EF4444', bg: '#FEF2F2' },
                { label: 'Late',        value: lateCount,      color: '#F59E0B', bg: '#FFFBEB' },
                { label: 'Excused',     value: excusedCount,   color: '#3B82F6', bg: '#EFF6FF' },
                { label: 'Unrecorded',  value: unrecordedCount,color: '#6B7280', bg: '#F3F4F6' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}:</span>
                  <span style={{ fontWeight: 600, color, background: bg, padding: '2px 8px', borderRadius: 12 }}>{value}</span>
                </div>
              ))}
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Attendance Rate:</span>
                <span style={{ fontWeight: 700, color: 'var(--brand)', fontSize: 'var(--text-base)' }}>{attendanceRate}%</span>
              </div>
            </div>
          </Card>

          {/* Status banner */}
          {dateBanner && (
            <Card padding="16px" style={{ background: dateBanner.bg, border: `1px solid ${dateBanner.border}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: dateBanner.color }}>
                <div style={{ flexShrink: 0, marginTop: 1 }}>{dateBanner.icon}</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, lineHeight: 1.5 }}>
                  {dateBanner.text}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Student List & Action Footer */}
        <Card padding="24px" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Student List</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {isReadOnly ? 'Viewing attendance records (read-only).' : 'Mark individual attendance or use bulk actions.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12, opacity: isReadOnly ? 0.4 : 1, pointerEvents: isReadOnly ? 'none' : 'auto' }}>
                <Button variant="outline" size="sm" onClick={() => setAllStatus('PRESENT')}>Mark All Present</Button>
                <Button variant="outline" size="sm" onClick={() => setAllStatus('ABSENT')}>Mark All Absent</Button>
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{ height: 64, background: 'var(--bg-muted)', borderRadius: 8, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                ))}
              </div>
            ) : students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
                No students assigned to this class.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {students.map((student) => (
                  <div
                    key={student.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: 'var(--bg-muted)',
                      borderRadius: 10,
                      border: '1px solid var(--border-subtle, transparent)',
                      opacity: isReadOnly ? 0.75 : 1,
                      transition: 'border-color 0.2s',
                      width: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand-light)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{student.name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{student.rollNo}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, opacity: isReadOnly ? 0.8 : 1, pointerEvents: isReadOnly ? 'none' : 'auto' }}>
                      <StatusButton status="PRESENT" currentStatus={student.status} onClick={() => setStatus(student.id, 'PRESENT')} icon={<Check size={16} />} label="Present" activeColor="#10B981" />
                      <StatusButton status="ABSENT"  currentStatus={student.status} onClick={() => setStatus(student.id, 'ABSENT')}  icon={<X size={16} />}     label="Absent"  activeColor="#EF4444" />
                      <StatusButton status="LATE"    currentStatus={student.status} onClick={() => setStatus(student.id, 'LATE')}    icon={<Clock size={16} />}  label="Late"    activeColor="#F59E0B" />
                      <StatusButton status="EXCUSED" currentStatus={student.status} onClick={() => setStatus(student.id, 'EXCUSED')} icon={<HelpCircle size={16} />} label="Excused" activeColor="#3B82F6" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 32,
              paddingTop: 20,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {unrecordedCount === 0 && !isFutureDate ? (
                <>
                  <CheckCircle2 size={18} color="#10B981" />
                  <span style={{ color: '#10B981', fontWeight: 600 }}>All {totalCount} students recorded</span>
                </>
              ) : isFutureDate ? (
                <span style={{ color: '#1D4ED8', fontWeight: 500 }}>Future date — view only</span>
              ) : (
                <span>
                  <strong style={{ color: 'var(--text-primary)' }}>{totalCount - unrecordedCount}</strong> of <strong>{totalCount}</strong> recorded ({unrecordedCount} remaining)
                </span>
              )}
            </div>

            {!isReadOnly && (
              <Button
                variant="primary"
                onClick={handleSaveClick}
                disabled={loading}
                style={{ padding: '0 32px', height: 42, fontSize: 'var(--text-sm)', fontWeight: 600 }}
              >
                {isSaved ? 'Update Attendance' : 'Save Attendance'}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 16, maxWidth: 420, width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
              {isSaved ? 'Update Attendance?' : 'Confirm Attendance'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5, fontSize: 'var(--text-sm)' }}>
              {isSaved
                ? `You are updating attendance for ${date}. This will overwrite the existing records for today.`
                : `You are submitting attendance for ${date}. You can edit this until the end of today, but not after.`}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button variant="primary" onClick={confirmSave}>
                {isSaved ? 'Update' : 'Submit Attendance'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusButton({
  status,
  currentStatus,
  onClick,
  icon,
  label,
  activeColor
}: {
  status: AttendanceStatus,
  currentStatus: AttendanceStatus,
  onClick: () => void,
  icon: React.ReactNode,
  label: string,
  activeColor: string
}) {
  const isActive = currentStatus === status;
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: 20,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        border: isActive ? `1px solid ${activeColor}` : '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        background: isActive ? activeColor : 'var(--surface)',
        color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
        boxShadow: isActive ? `0 4px 12px ${activeColor}33` : '0 1px 2px rgba(0,0,0,0.05)',
        fontSize: 'var(--text-xs)'
      }}
    >
      {icon} {label}
    </button>
  );
}
