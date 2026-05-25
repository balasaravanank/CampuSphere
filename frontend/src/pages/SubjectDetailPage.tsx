import { useState } from 'react';
import { ArrowLeft, Clock, Calendar, Users, MapPin, BookOpen, MessageSquare, CheckCircle, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import './ModulePage.css';

type TabKey = 'overview' | 'chat' | 'attendance' | 'sessions' | 'feedback';

export default function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const { data: detail, isLoading } = useQuery({
    queryKey: ['enrollment-detail', id],
    queryFn: () => api.get(`/academics/enrolled/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: attendanceData, isLoading: attLoading } = useQuery({
    queryKey: ['enrollment-attendance', id],
    queryFn: () => api.get(`/academics/enrolled/${id}/attendance`).then(r => r.data.data),
    enabled: activeTab === 'attendance' && !!id,
  });

  const { data: sessionsData, isLoading: sessLoading } = useQuery({
    queryKey: ['enrollment-sessions', id],
    queryFn: () => api.get(`/academics/enrolled/${id}/sessions`).then(r => r.data.data),
    enabled: activeTab === 'sessions' && !!id,
  });

  if (isLoading) {
    return (
      <div className="module-page">
        <div className="wf-state spin"><Clock /></div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="module-page">
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <BookOpen size={48} style={{ color: 'var(--border)', margin: '0 auto 16px' }} />
          <h3>Enrollment Not Found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/academics')} style={{ marginTop: '16px' }}>
            Back to Subjects
          </button>
        </div>
      </div>
    );
  }

  const { subject, slot, attendance, student } = detail;
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BookOpen size={14} /> },
    { key: 'chat', label: 'Chat', icon: <MessageSquare size={14} /> },
    { key: 'attendance', label: 'Attendance', icon: <CheckCircle size={14} /> },
    { key: 'sessions', label: 'Sessions', icon: <Calendar size={14} /> },
    { key: 'feedback', label: 'Feedback', icon: <FileText size={14} /> },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'badge-success';
      case 'ABSENT': return 'badge-danger';
      case 'UPCOMING': return 'badge-primary';
      case 'Completed': return 'badge-success';
      case 'Upcoming': return 'badge-warning';
      default: return 'badge-secondary';
    }
  };

  const getAttColor = (pct: number) => {
    if (pct >= 85) return 'var(--success)';
    if (pct >= 75) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="module-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0' }}>
            {subject.code} - {subject.name}
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {slot.slot_number && <span>Slot {slot.slot_number} · </span>}
            {subject.term && <span>{subject.term}</span>}
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/academics')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <ArrowLeft size={16} /> Back to Subjects
        </button>
      </div>

      {/* Summary cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div className="card" style={{
          padding: '16px 20px',
          borderTop: `3px solid ${getAttColor(attendance.percentage)}`,
        }}>
          <div style={{ fontSize: '0.75rem', color: getAttColor(attendance.percentage), fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            Overall Attendance
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {attendance.percentage}%
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Present <strong>{attendance.present} / {attendance.total}</strong>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderTop: '3px solid var(--primary)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            Total Sessions
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {attendance.total}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderTop: '3px solid var(--accent, var(--primary))' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent, var(--primary))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            Feedback Status
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>0</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Pending: 0</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderTop: '3px solid var(--warning)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            Session Timeline
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {slot.time_start} - {slot.time_end}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {slot.room && <span>Room {slot.room}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '2px solid var(--border)',
        marginBottom: '24px',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="fade-in">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
                Student
              </h4>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{student.name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Register No: {student.reg_no}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {student.department}
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
                LMS Links
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                No LMS links available.
              </p>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
                Slot Information
              </h4>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                  {subject.code} - {subject.name}
                </div>
                {slot.slot_number && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Slot: {slot.slot_number}
                  </div>
                )}
                {subject.term && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Academic Term: {subject.term}
                  </div>
                )}
                {slot.faculty_name && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    <Users size={13} style={{ verticalAlign: 'text-bottom', marginRight: '4px' }} />
                    Faculty: {slot.faculty_name}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <MessageSquare size={48} style={{ color: 'var(--border)', margin: '0 auto 16px' }} />
            <h3 style={{ margin: '0 0 8px 0' }}>Group Chat</h3>
            <p className="text-secondary" style={{ margin: 0 }}>
              Slot Group Chat — Coming Soon
            </p>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {attLoading ? (
              <div className="wf-state spin" style={{ padding: '40px' }}><Clock /></div>
            ) : !attendanceData || attendanceData.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p className="text-secondary">No attendance records yet.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Timing</th>
                      <th>Location</th>
                      <th>Attendance</th>
                      <th>Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.map((row: any) => (
                      <tr key={row.session_id}>
                        <td style={{ fontWeight: 500 }}>{row.date}</td>
                        <td className="mono-text">{row.time}</td>
                        <td>
                          <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                            {row.timing}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                            <MapPin size={11} style={{ marginRight: '2px' }} />{row.location}
                          </span>
                        </td>
                        <td>
                          <div>
                            <span className={`badge ${getStatusBadge(row.status)}`} style={{ fontSize: '0.75rem' }}>
                              {row.status}
                            </span>
                            {row.in_time && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                IN (BIO): {row.in_time}
                                {row.out_time && <><br />OUT (BIO): {row.out_time}</>}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          {row.status === 'PRESENT' ? (
                            row.feedback_submitted ? (
                              <span style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500 }}>
                                Submitted
                              </span>
                            ) : (
                              <span style={{ color: 'var(--warning)', fontSize: '0.8125rem', fontWeight: 500 }}>
                                Pending
                              </span>
                            )
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {sessLoading ? (
              <div className="wf-state spin" style={{ padding: '40px' }}><Clock /></div>
            ) : !sessionsData || sessionsData.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p className="text-secondary">No sessions scheduled yet.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Timing</th>
                      <th>Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionsData.map((row: any) => (
                      <tr key={row.session_id}>
                        <td style={{ fontWeight: 500 }}>{row.date}</td>
                        <td className="mono-text">{row.time}</td>
                        <td>
                          <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                            {row.timing}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                            <MapPin size={11} style={{ marginRight: '2px' }} />{row.location}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(row.status)}`} style={{ fontWeight: 600, fontSize: '0.75rem' }}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <FileText size={48} style={{ color: 'var(--border)', margin: '0 auto 16px' }} />
            <h3 style={{ margin: '0 0 8px 0' }}>Feedback</h3>
            <p className="text-secondary" style={{ margin: 0 }}>
              Session feedback — Coming Soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
