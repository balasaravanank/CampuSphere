import { useState } from 'react';
import { Users, Calendar, MessageSquare, Video, Trophy, Plus, Clock, CheckCircle, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import './ModulePage.css';

export default function MentorshipPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'mentorship' | 'workshops'>('mentorship');
  const [requestModal, setRequestModal] = useState(false);
  
  // Workshop Request Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'workshop',
    scheduled_date: '',
    start_time: '',
    end_time: '',
    max_participants: 50,
  });

  const { data: workshops, isLoading: wsLoading } = useQuery({
    queryKey: ['workshops'],
    queryFn: () => api.get('/workshops').then(r => r.data.data),
  });

  const requestMutation = useMutation({
    mutationFn: (data: any) => api.post('/workshops', data),
    onSuccess: () => {
      toast.success('Workshop request submitted for approval!');
      setRequestModal(false);
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to submit request')
  });

  const bookMutation = useMutation({
    mutationFn: (id: number) => api.post(`/workshops/${id}/book`),
    onSuccess: () => {
      toast.success('Booked successfully!');
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Booking failed')
  });

  const meetLinkMutation = useMutation({
    mutationFn: (data: { id: number; link: string }) => api.patch(`/workshops/${data.id}/meet-link`, { meet_link: data.link }),
    onSuccess: () => {
      toast.success('Meet link updated!');
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/workshops/${id}/complete`, { completion_notes: "Completed successfully" }),
    onSuccess: () => {
      toast.success('Workshop marked complete! Points awarded.');
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
    },
  });

  const confirmAttendanceMutation = useMutation({
    mutationFn: (id: number) => api.post(`/workshops/${id}/confirm-attendance`),
    onSuccess: () => {
      toast.success('Attendance confirmed! You earned reward points.');
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to confirm attendance')
  });

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.scheduled_date || !formData.start_time || !formData.end_time) {
      toast.error('Please fill all date/time fields');
      return;
    }

    // Combine date and time
    const sDate = new Date(`${formData.scheduled_date}T${formData.start_time}`);
    const eDate = new Date(`${formData.scheduled_date}T${formData.end_time}`);
    const now = new Date();

    if (sDate <= now) {
      toast.error('Schedule date must be in the future');
      return;
    }
    if (eDate <= sDate) {
      toast.error('End time must be after start time');
      return;
    }

    requestMutation.mutate({
      ...formData,
      scheduled_date: sDate.toISOString(),
      start_time: sDate.toISOString(),
      end_time: eDate.toISOString(),
    });
  };

  const handleMeetLinkUpdate = (wsId: number) => {
    const link = prompt('Enter Google Meet Link (e.g., https://meet.google.com/abc-defg-hij):');
    if (link) {
      meetLinkMutation.mutate({ id: wsId, link });
    }
  };

  return (
    <div className="module-page">
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Mentorship & Activities</h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`btn ${activeTab === 'mentorship' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('mentorship')}
          >
            <Users size={16} /> 1-on-1 Mentorship
          </button>
          <button 
            className={`btn ${activeTab === 'workshops' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('workshops')}
          >
            <Video size={16} /> Workshops & Events
          </button>
        </div>
      </div>

      {activeTab === 'mentorship' && (
        <div className="module-grid-2 fade-in">
          <div className="card">
            <h3 className="card-title"><Users size={18} /> My Mentor</h3>
            <div className="mentor-profile">
              <div className="mentor-avatar">RK</div>
              <div className="mentor-info">
                <h4>Prof. Raj Kumar</h4>
                <p>Computer Science Department</p>
                <p className="text-secondary">Cabin: Faculty Block B-204</p>
              </div>
            </div>
            <div className="mentor-actions">
              <button className="btn btn-primary btn-sm"><Calendar size={14} /> Book Meeting</button>
              <button className="btn btn-secondary btn-sm"><MessageSquare size={14} /> Message</button>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title"><Calendar size={18} /> Upcoming Meetings</h3>
            <div className="meeting-list">
              {[
                { date: 'Apr 23, Wed', time: '3:00 PM', topic: 'Semester progress review', status: 'scheduled' },
                { date: 'May 7, Wed', time: '3:00 PM', topic: 'Career guidance & internship', status: 'scheduled' },
              ].map((m, i) => (
                <div key={i} className="meeting-item">
                  <div className="meeting-date">
                    <span className="mono-text">{m.date}</span>
                    <span className="text-secondary">{m.time}</span>
                  </div>
                  <div className="meeting-topic">{m.topic}</div>
                  <span className="badge badge-primary">{m.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'workshops' && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <p className="text-secondary">Host or join peer-led and staff-led activities to earn reward points.</p>
            <button className="btn btn-primary" onClick={() => setRequestModal(true)}>
              <Plus size={16} /> Host a Workshop
            </button>
          </div>

          {wsLoading ? (
            <div className="wf-state spin"><Clock /></div>
          ) : !workshops || workshops.length === 0 ? (
            <div className="wf-state">No workshops available right now.</div>
          ) : (
            <div className="events-grid">
              {workshops.map((ws: any) => {
                const isHost = ws.host?.id === user?.id;
                
                return (
                  <div key={ws.id} className="card event-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="event-top">
                      <span className={`badge ${ws.status === 'approved' ? 'badge-primary' : ws.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                        {ws.status.toUpperCase()}
                      </span>
                      {isHost && <span className="badge badge-secondary">HOST</span>}
                    </div>
                    
                    <h3 className="event-title" style={{ fontSize: '1.1rem' }}>{ws.title}</h3>
                    <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '12px', flex: 1 }}>{ws.description}</p>
                    
                    <div className="event-details" style={{ marginBottom: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                      <span><Calendar size={14} /> {new Date(ws.scheduled_date).toLocaleDateString()} at {new Date(ws.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      <span><Users size={14} /> Host: {ws.host?.name}</span>
                      <span><Trophy size={14} /> Reward: {ws.reward_points_attendee} pts (Host: {ws.reward_points_host} pts)</span>
                      
                      {ws.meet_link && (
                        <span>
                          <Video size={14} style={{ color: 'var(--success)' }} /> 
                          <a href={ws.meet_link} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Join Meeting <ExternalLink size={12} /></a>
                        </span>
                      )}
                    </div>
                    
                    <div className="event-capacity-bar" style={{ marginTop: 'auto' }}>
                      <div className={`event-capacity-fill ${ws.is_full ? 'full' : ''}`} style={{ width: `${(ws.booked_count / ws.max_participants) * 100}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                      <span>{ws.booked_count} Booked</span>
                      <span>{ws.max_participants} Total</span>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Host Actions */}
                      {isHost && ws.status === 'approved' && (
                        <>
                          <button className="btn btn-sm btn-secondary" onClick={() => handleMeetLinkUpdate(ws.id)} style={{ flex: 1 }}>
                            {ws.meet_link ? 'Edit Meet Link' : '+ Meet Link'}
                          </button>
                          <button 
                            className="btn btn-sm btn-primary" 
                            style={{ flex: 1, backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                            onClick={() => {
                              if (window.confirm("Are you sure you want to mark this workshop as complete?")) {
                                completeMutation.mutate(ws.id);
                              }
                            }}
                          >
                            Mark Complete
                          </button>
                        </>
                      )}

                      {/* Attendee Actions */}
                      {!isHost && ws.status === 'approved' && (
                        <button 
                          className="btn btn-sm btn-primary" 
                          style={{ width: '100%' }}
                          disabled={ws.is_full || ws.my_booking_status === 'booked' || bookMutation.isPending}
                          onClick={() => bookMutation.mutate(ws.id)}
                        >
                          {ws.my_booking_status === 'booked' ? 'Booked' : ws.is_full ? 'Full' : 'Book Slot'}
                        </button>
                      )}

                      {!isHost && ws.status === 'completed' && ws.my_booking_status === 'booked' && (
                        <button 
                          className="btn btn-sm btn-primary" 
                          style={{ width: '100%', backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                          onClick={() => confirmAttendanceMutation.mutate(ws.id)}
                          disabled={confirmAttendanceMutation.isPending}
                        >
                          <CheckCircle size={14} /> Confirm Attendance (Claim Points)
                        </button>
                      )}
                      
                      {!isHost && ws.status === 'completed' && ws.my_booking_status === 'attended' && (
                        <div className="badge badge-success" style={{ width: '100%', justifyContent: 'center', padding: '6px' }}>
                          <CheckCircle size={14} /> Points Claimed
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Host Workshop Modal */}
      {requestModal && (
        <div className="modal-backdrop fade-in">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Host a Workshop</h3>
              <button className="modal-close" onClick={() => setRequestModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleRequestSubmit} className="modal-body">
              <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
                Fill out the details below. Once approved by an Admin, students can start booking slots, and reward points will be set.
              </p>
              
              <div className="form-group">
                <label>Workshop Title</label>
                <input required type="text" className="input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Intro to Machine Learning" />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea required className="input" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="What will participants learn?" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Date</label>
                  <input required type="date" className="input" value={formData.scheduled_date} onChange={e => setFormData({...formData, scheduled_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Max Participants</label>
                  <input required type="number" min="1" max="500" className="input" value={formData.max_participants} onChange={e => setFormData({...formData, max_participants: parseInt(e.target.value) || 50})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Start Time</label>
                  <input required type="time" className="input" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input required type="time" className="input" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setRequestModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={requestMutation.isPending}>
                  {requestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
