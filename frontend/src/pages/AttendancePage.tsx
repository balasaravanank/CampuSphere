import { useState, useEffect } from 'react';
import { CalendarCheck, MapPin, BookOpen, Key, X, Clock } from 'lucide-react';
import { useAuth } from '../lib/auth';
import api from '../lib/api';
import './ModulePage.css';

interface ScheduleItem {
  id: number;
  type: string;
  time: string;
  subject: string;
  room: string;
  faculty: string;
  status: string; // 'pending', 'active', 'present', 'absent'
  session_id: number | null;
  otp_generated: boolean;
}

const subjectHealth = [
  { subject: 'Data Structures', percent: 88, status: 'safe' },
  { subject: 'DBMS', percent: 72, status: 'warning' },
  { subject: 'Operating Systems', percent: 65, status: 'danger' },
  { subject: 'AI & ML', percent: 90, status: 'safe' },
];

export default function AttendancePage() {
  const { user } = useAuth();
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedSlot, setSelectedSlot] = useState<ScheduleItem | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      // Fetching all days for demonstration
      const res = await api.get('/attendance/schedule?all_days=true');
      if (res.data.success) {
        setScheduleData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch schedule', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const openModal = (slot: ScheduleItem) => {
    // Only open if staff/admin (to generate OTP) or if active session for students
    if (user?.role === 'staff' || user?.role === 'admin') {
      setSelectedSlot(slot);
      setGeneratedOtp(null);
      setModalError('');
    } else if (user?.role === 'student' && slot.status === 'active') {
      setSelectedSlot(slot);
      setOtpValue('');
      setModalError('');
    }
  };

  const closeModal = () => {
    setSelectedSlot(null);
  };

  const handleGenerateOTP = async () => {
    if (!selectedSlot) return;
    setModalLoading(true);
    setModalError('');
    try {
      const res = await api.post('/attendance/sessions', {
        slot_id: selectedSlot.id,
        expires_in_minutes: 10
      });
      if (res.data.success) {
        setGeneratedOtp(res.data.data.otp);
        fetchSchedule(); // Refresh to show active status
      }
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to generate OTP');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSubmitOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !selectedSlot.session_id) return;
    
    setModalLoading(true);
    setModalError('');
    try {
      const res = await api.post(`/attendance/sessions/${selectedSlot.session_id}/mark`, {
        otp: otpValue
      });
      if (res.data.success) {
        closeModal();
        fetchSchedule(); // Refresh to show present status
      }
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <h2>Attendance & Schedule</h2>
        {user?.role === 'student' && (
          <span className="badge badge-success">Overall: 82%</span>
        )}
      </div>

      <div className="module-grid-2">
        <div className="card">
          <h3 className="card-title"><CalendarCheck size={18} /> Today's Schedule</h3>
          
          {loading ? (
            <div className="wf-state"><span className="spin"><Clock size={20} /></span> Loading schedule...</div>
          ) : scheduleData.length === 0 ? (
            <div className="wf-state">No classes scheduled for today.</div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Subject</th>
                    <th>Room</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleData.map((row) => {
                    // Check if clickable
                    const isClickable = (user?.role === 'staff' || user?.role === 'admin') 
                      || (user?.role === 'student' && row.status === 'active');
                      
                    return (
                      <tr 
                        key={row.id} 
                        onClick={() => isClickable && openModal(row)}
                        style={{ cursor: isClickable ? 'pointer' : 'default' }}
                      >
                        <td className="mono-text">{row.time}</td>
                        <td>
                          {row.subject}
                          {user?.role === 'student' ? (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{row.faculty}</div>
                          ) : null}
                        </td>
                        <td><span className="badge badge-primary"><MapPin size={12} /> {row.room}</span></td>
                        <td>
                          <span className={`badge badge-${row.status === 'present' ? 'success' : row.status === 'absent' ? 'danger' : row.status === 'active' ? 'accent' : 'warning'}`}>
                            {row.status === 'active' && user?.role === 'student' ? 'enter otp' : 
                             row.status === 'active' && user?.role !== 'student' ? 'session active' :
                             row.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {user?.role === 'student' && (
          <div className="card">
            <h3 className="card-title"><BookOpen size={18} /> Subject Health</h3>
            <div className="health-list">
              {subjectHealth.map((s, i) => (
                <div key={i} className="health-item">
                  <div className="health-info">
                    <span className="health-subject">{s.subject}</span>
                    <span className={`health-percent health-${s.status}`}>{s.percent}%</span>
                  </div>
                  <div className="health-bar">
                    <div
                      className={`health-bar-fill health-bar-${s.status}`}
                      style={{ width: `${s.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="health-warning">
              ⚠️ If you skip OS today, attendance drops to <strong>61%</strong> — below required 75%
            </p>
          </div>
        )}
      </div>

      {/* OTP Modal */}
      {selectedSlot && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}><X size={20} /></button>
            <h3 className="modal-title">{selectedSlot.subject}</h3>
            
            <div className="modal-body">
              <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                <Clock size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />
                {selectedSlot.time} • Room {selectedSlot.room}
              </p>

              {modalError && (
                <div className="wf-error" style={{ padding: '10px 0' }}>{modalError}</div>
              )}

              {/* STAFF/ADMIN VIEW */}
              {(user?.role === 'staff' || user?.role === 'admin') && (
                <>
                  {generatedOtp || selectedSlot.status === 'active' ? (
                    <div>
                      <p style={{ textAlign: 'center', fontWeight: 500 }}>Active Session OTP</p>
                      <div className="otp-display">
                        {generatedOtp || '••••••'} 
                        {/* We only have the plain OTP if we just generated it, otherwise it's hidden */}
                      </div>
                      {!generatedOtp && (
                        <p className="text-secondary" style={{ textAlign: 'center', fontSize: '0.8125rem' }}>
                          Session is active. OTP was already generated.
                        </p>
                      )}
                    </div>
                  ) : (
                    <button 
                      className="btn btn-primary" 
                      onClick={handleGenerateOTP}
                      disabled={modalLoading}
                      style={{ width: '100%', padding: '12px', marginTop: 10 }}
                    >
                      {modalLoading ? 'Generating...' : 'Generate Attendance OTP'}
                    </button>
                  )}
                </>
              )}

              {/* STUDENT VIEW */}
              {user?.role === 'student' && (
                <form onSubmit={handleSubmitOTP} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="input-group">
                    <label>Enter 6-Digit OTP</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="e.g. 123456"
                      value={otpValue}
                      onChange={e => setOtpValue(e.target.value)}
                      maxLength={6}
                      required
                      autoFocus
                      style={{ fontSize: '1.2rem', letterSpacing: '2px', textAlign: 'center' }}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={modalLoading || otpValue.length < 4}
                  >
                    {modalLoading ? 'Verifying...' : 'Mark Present'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
