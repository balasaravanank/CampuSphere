import { useState } from 'react';
import { Users, Calendar, Video, Trophy, Plus, Clock, CheckCircle, ExternalLink, X, Search } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const { data: mentors, isLoading: mentorsLoading } = useQuery({
    queryKey: ['mentors', searchTerm],
    queryFn: () => api.get(`/mentors/profiles${searchTerm ? `?skills=${searchTerm}` : ''}`).then(r => r.data),
  });

  const assignMentorMutation = useMutation({
    mutationFn: (mentorId: number) => api.post('/mentors/assign', { mentor_id: mentorId, student_id: user?.id }),
    onSuccess: () => {
      toast.success('Successfully matched with mentor!');
      queryClient.invalidateQueries({ queryKey: ['mentors'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to assign mentor')
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
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <p className="text-secondary">Find a mentor based on skills and connect.</p>
            <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
              <Search size={16} className="text-secondary" style={{ marginRight: '8px' }} />
              <input 
                type="text" 
                placeholder="Search by skills (e.g. React, AI)" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', width: '200px' }}
              />
            </div>
          </div>
          
          {mentorsLoading ? (
            <div className="wf-state spin"><Clock /></div>
          ) : !mentors || mentors.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Users size={48} style={{ color: 'var(--border)', margin: '0 auto 16px' }} />
              <h3 style={{ margin: '0 0 8px 0' }}>No Mentors Found</h3>
              <p className="text-secondary" style={{ margin: '0 0 20px 0' }}>Try a different skill or check back later.</p>
            </div>
          ) : (
            <div className="module-grid-2 fade-in">
              {mentors.map((mentor: any) => (
                <div key={mentor.id} className="card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 className="card-title" style={{ margin: 0 }}><Users size={18} /> Mentor</h3>
                    <span className="badge badge-success">Accepting Mentees</span>
                  </div>
                  <div className="mentor-profile" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                    <div className="mentor-avatar" style={{ 
                      width: '64px', height: '64px', borderRadius: '50%', 
                      background: 'var(--primary-light)', color: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 600
                    }}>
                      {mentor.user?.name?.charAt(0) || 'M'}
                    </div>
                    <div className="mentor-info">
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{mentor.user?.name || 'Unknown'}</h4>
                      <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{mentor.user?.department || 'Department'}</p>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {mentor.skills?.map((skill: string, i: number) => (
                          <span key={i} className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {mentor.bio && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                      {mentor.bio}
                    </p>
                  )}
                  <div className="mentor-actions" style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: 1 }}
                      onClick={() => assignMentorMutation.mutate(mentor.user_id)}
                      disabled={assignMentorMutation.isPending}
                    >
                      <Plus size={16} /> Request Mentorship
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Video size={48} style={{ color: 'var(--border)', margin: '0 auto 16px' }} />
              <h3 style={{ margin: '0 0 8px 0' }}>No Workshops Available</h3>
              <p className="text-secondary" style={{ margin: '0 0 20px 0' }}>Be the first to host a workshop or check back later.</p>
              <button className="btn btn-primary" onClick={() => setRequestModal(true)}>
                <Plus size={16} /> Host a Workshop
              </button>
            </div>
          ) : (
            <div className="events-grid">
              {workshops.map((ws: any) => {
                const isHost = ws.host?.id === user?.id;
                
                return (
                  <div key={ws.id} className="card event-card" style={{ display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                    <div className="event-top" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span className={`badge ${ws.status === 'approved' ? 'badge-primary' : ws.status === 'completed' ? 'badge-success' : ws.status === 'live' ? 'badge-danger' : 'badge-warning'}`}>
                          {ws.status === 'approved' ? 'UPCOMING' : ws.status.toUpperCase()}
                        </span>
                        {isHost && <span className="badge" style={{ background: 'var(--accent)', color: 'white', border: 'none' }}>HOST</span>}
                      </div>
                      <span className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Trophy size={12} style={{ color: 'var(--warning)' }} /> {ws.reward_points_attendee} pts
                      </span>
                    </div>
                    
                    <h3 className="event-title" style={{ fontSize: '1.2rem', marginBottom: '8px', lineHeight: 1.3 }}>{ws.title}</h3>
                    <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '16px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ws.description}</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                        <Calendar size={14} className="text-secondary" /> 
                        <span style={{ fontWeight: 500 }}>{new Date(ws.scheduled_date).toLocaleDateString()}</span> • {new Date(ws.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                        <Users size={14} className="text-secondary" /> 
                        Host: <span style={{ fontWeight: 500 }}>{ws.host?.name}</span>
                      </div>
                      
                      {ws.meet_link && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)' }}>
                          <Video size={14} /> 
                          <a href={ws.meet_link} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>Join Google Meet <ExternalLink size={12} /></a>
                        </div>
                      )}
                    </div>
                    
                    <div className="event-capacity-bar" style={{ marginTop: 'auto', background: 'var(--border)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div className={`event-capacity-fill ${ws.is_full ? 'full' : ''}`} style={{ width: `${(ws.booked_count / ws.max_participants) * 100}%`, background: ws.is_full ? 'var(--danger)' : 'var(--primary)', height: '100%', transition: 'width 0.3s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '6px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      <span>{ws.booked_count} Booked</span>
                      <span>{ws.max_participants} Capacity</span>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Host Actions */}
                      {isHost && ws.status === 'approved' && (
                        <>
                          <button className="btn btn-sm btn-secondary" onClick={() => handleMeetLinkUpdate(ws.id)} style={{ flex: 1, borderColor: ws.meet_link ? 'var(--success)' : 'var(--border)' }}>
                            <Video size={14} style={{ color: ws.meet_link ? 'var(--success)' : 'inherit' }} /> {ws.meet_link ? 'Edit Link' : 'Add Link'}
                          </button>
                          <button 
                            className="btn btn-sm btn-primary" 
                            style={{ flex: 1, backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                            onClick={() => {
                              if (window.confirm("Are you sure you want to mark this workshop as complete? Attendees will be prompted to claim their points.")) {
                                completeMutation.mutate(ws.id);
                              }
                            }}
                          >
                            <CheckCircle size={14} /> Complete
                          </button>
                        </>
                      )}

                      {/* Attendee Actions */}
                      {!isHost && ws.status === 'approved' && (
                        <button 
                          className={`btn btn-sm ${ws.my_booking_status === 'booked' ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ width: '100%', opacity: ws.is_full && ws.my_booking_status !== 'booked' ? 0.5 : 1 }}
                          disabled={ws.is_full || ws.my_booking_status === 'booked' || bookMutation.isPending}
                          onClick={() => bookMutation.mutate(ws.id)}
                        >
                          {ws.my_booking_status === 'booked' ? (
                            <><CheckCircle size={14} style={{ color: 'var(--success)' }} /> Booked (Awaiting Meet Link)</>
                          ) : ws.is_full ? 'Slot Full' : 'Book Slot'}
                        </button>
                      )}

                      {!isHost && ws.status === 'completed' && ws.my_booking_status === 'booked' && (
                        <button 
                          className="btn btn-sm btn-primary" 
                          style={{ width: '100%', backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }}
                          onClick={() => confirmAttendanceMutation.mutate(ws.id)}
                          disabled={confirmAttendanceMutation.isPending}
                        >
                          <CheckCircle size={14} /> Claim {ws.reward_points_attendee} Points
                        </button>
                      )}
                      
                      {!isHost && ws.status === 'completed' && ws.my_booking_status === 'attended' && (
                        <div style={{ width: '100%', textAlign: 'center', padding: '8px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <CheckCircle size={16} /> Reward Claimed
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
