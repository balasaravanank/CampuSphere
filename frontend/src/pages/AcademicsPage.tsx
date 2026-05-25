import { useState } from 'react';
import { BookOpen, Clock, Calendar, ChevronRight, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import './ModulePage.css';

interface EnrolledSubject {
  enrollment_id: number;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  credits: number;
  department: string;
  semester: number;
  term: string | null;
  slot_number: string | null;
  room: string | null;
  faculty_name: string | null;
  attendance_percentage: number;
  present_count: number;
  total_sessions: number;
  upcoming_sessions: number;
  first_session_date: string | null;
  last_session_date: string | null;
}

export default function AcademicsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['enrolled-subjects'],
    queryFn: () => api.get('/academics/enrolled').then(r => r.data.data),
  });

  const filtered = (subjects || []).filter((s: EnrolledSubject) =>
    s.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.subject_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAttendanceColor = (pct: number) => {
    if (pct >= 85) return 'var(--success)';
    if (pct >= 75) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getAttendanceBg = (pct: number) => {
    if (pct >= 85) return 'var(--success-light, rgba(16,185,129,0.1))';
    if (pct >= 75) return 'var(--warning-light, rgba(245,158,11,0.1))';
    return 'var(--danger-light, rgba(239,68,68,0.1))';
  };

  return (
    <div className="module-page">
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Academics</h2>
        <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
          <Search size={16} className="text-secondary" style={{ marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', width: '200px' }}
          />
        </div>
      </div>

      <p className="text-secondary" style={{ marginBottom: '24px' }}>
        Your enrolled subjects with attendance and session details.
      </p>

      {isLoading ? (
        <div className="wf-state spin"><Clock /></div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <BookOpen size={56} style={{ color: 'var(--border)', margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 8px 0' }}>
            {searchTerm ? 'No Matching Subjects' : 'No Enrolled Subjects'}
          </h3>
          <p className="text-secondary" style={{ margin: 0 }}>
            {searchTerm ? 'Try a different search term.' : 'Contact your admin to get enrolled in subjects.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
          {filtered.map((subj: EnrolledSubject) => (
            <div
              key={subj.enrollment_id}
              className="card"
              onClick={() => navigate(`/academics/subject/${subj.enrollment_id}`)}
              style={{
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = '';
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', lineHeight: 1.3 }}>
                    {subj.subject_code} - {subj.subject_name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {subj.slot_number && <span>Slot {subj.slot_number} · </span>}
                    {subj.term && <span>{subj.term} · </span>}
                    {subj.credits} Credits
                  </p>
                </div>
                <ChevronRight size={20} className="text-secondary" />
              </div>

              {/* Stats row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '16px',
              }}>
                {/* Attendance */}
                <div style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: getAttendanceBg(subj.attendance_percentage),
                  borderLeft: `3px solid ${getAttendanceColor(subj.attendance_percentage)}`,
                }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    Attendance
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: getAttendanceColor(subj.attendance_percentage) }}>
                    {subj.attendance_percentage}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {subj.present_count} / {subj.total_sessions}
                  </div>
                </div>

                {/* Sessions */}
                <div style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  borderLeft: '3px solid var(--primary)',
                }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    Sessions
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {subj.total_sessions}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {subj.upcoming_sessions} upcoming
                  </div>
                </div>

                {/* Faculty */}
                <div style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  borderLeft: '3px solid var(--accent, var(--primary))',
                }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    Faculty
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {subj.faculty_name || 'TBA'}
                  </div>
                  {subj.room && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Room {subj.room}
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline footer */}
              {(subj.first_session_date || subj.last_session_date) && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginTop: 'auto',
                }}>
                  <Calendar size={13} />
                  <span>
                    {subj.first_session_date ? new Date(subj.first_session_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    {' → '}
                    {subj.last_session_date ? new Date(subj.last_session_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
