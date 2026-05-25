import { useState } from 'react';
import { BookOpen, Clock, Plus, X, Trash2, Users, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import './ModulePage.css';

type ActiveSection = 'subjects' | 'slots' | 'enrollments';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminAcademicsPage() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<ActiveSection>('subjects');

  // ── Subject State ──
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    code: '', name: '', credits: 3, department: '', semester: 1, term: ''
  });

  // ── Slot State ──
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotForm, setSlotForm] = useState({
    subject_id: '', faculty_id: '', day_of_week: 0,
    time_start: '08:00', time_end: '09:00', room: '', slot_number: ''
  });

  // ── Enrollment State ──
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ student_id: '', subject_id: '' });
  const [enrollFilterSubject, setEnrollFilterSubject] = useState('');

  // ── Queries ──
  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['admin-subjects'],
    queryFn: () => api.get('/admin/subjects').then(r => r.data.data),
  });

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['admin-slots'],
    queryFn: () => api.get('/admin/slots').then(r => r.data.data),
  });

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['admin-enrollments', enrollFilterSubject],
    queryFn: () => api.get(`/admin/enrollments${enrollFilterSubject ? `?subject_id=${enrollFilterSubject}` : ''}`).then(r => r.data.data),
  });

  const { data: staffList } = useQuery({
    queryKey: ['admin-staff-list'],
    queryFn: () => api.get('/admin/users?role=staff&limit=100').then(r => r.data.data),
  });

  const { data: studentList } = useQuery({
    queryKey: ['admin-student-list'],
    queryFn: () => api.get('/admin/users?role=student&limit=100').then(r => r.data.data),
  });

  // ── Mutations ──
  const createSubjectMut = useMutation({
    mutationFn: (data: any) => api.post('/admin/subjects', data),
    onSuccess: () => {
      toast.success('Subject created');
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      setShowSubjectModal(false);
      setSubjectForm({ code: '', name: '', credits: 3, department: '', semester: 1, term: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed'),
  });

  const createSlotMut = useMutation({
    mutationFn: (data: any) => api.post('/admin/slots', data),
    onSuccess: () => {
      toast.success('Slot created');
      queryClient.invalidateQueries({ queryKey: ['admin-slots'] });
      setShowSlotModal(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed'),
  });

  const createEnrollMut = useMutation({
    mutationFn: (data: any) => api.post('/admin/enrollments', data),
    onSuccess: () => {
      toast.success('Student enrolled');
      queryClient.invalidateQueries({ queryKey: ['admin-enrollments'] });
      setShowEnrollModal(false);
      setEnrollForm({ student_id: '', subject_id: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed'),
  });

  const deleteEnrollMut = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/enrollments/${id}`),
    onSuccess: () => {
      toast.success('Enrollment removed');
      queryClient.invalidateQueries({ queryKey: ['admin-enrollments'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed'),
  });

  return (
    <div className="module-page">
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Manage Academics</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(['subjects', 'slots', 'enrollments'] as ActiveSection[]).map(sec => (
            <button
              key={sec}
              className={`btn ${activeSection === sec ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveSection(sec)}
            >
              {sec === 'subjects' && <BookOpen size={16} />}
              {sec === 'slots' && <Calendar size={16} />}
              {sec === 'enrollments' && <Users size={16} />}
              {sec.charAt(0).toUpperCase() + sec.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ─── SUBJECTS ─── */}
      {activeSection === 'subjects' && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <p className="text-secondary">Manage subjects offered in your institution.</p>
            <button className="btn btn-primary" onClick={() => setShowSubjectModal(true)}>
              <Plus size={16} /> Add Subject
            </button>
          </div>

          {subjectsLoading ? (
            <div className="wf-state spin"><Clock /></div>
          ) : !subjects || subjects.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <BookOpen size={48} style={{ color: 'var(--border)', margin: '0 auto 16px' }} />
              <h3>No Subjects</h3>
              <p className="text-secondary">Add your first subject to get started.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-wrapper">
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Credits</th>
                      <th>Department</th>
                      <th>Semester</th>
                      <th>Term</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((s: any) => (
                      <tr key={s.id}>
                        <td><strong>{s.code}</strong></td>
                        <td>{s.name}</td>
                        <td>{s.credits}</td>
                        <td>{s.department}</td>
                        <td>{s.semester}</td>
                        <td>{s.term || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── SLOTS ─── */}
      {activeSection === 'slots' && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <p className="text-secondary">Manage time slots for subjects.</p>
            <button className="btn btn-primary" onClick={() => setShowSlotModal(true)}>
              <Plus size={16} /> Add Slot
            </button>
          </div>

          {slotsLoading ? (
            <div className="wf-state spin"><Clock /></div>
          ) : !slots || slots.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <Calendar size={48} style={{ color: 'var(--border)', margin: '0 auto 16px' }} />
              <h3>No Slots</h3>
              <p className="text-secondary">Create slots after adding subjects.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-wrapper">
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Slot #</th>
                      <th>Day</th>
                      <th>Time</th>
                      <th>Room</th>
                      <th>Faculty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((s: any) => (
                      <tr key={s.id}>
                        <td><strong>{s.subject_code}</strong> — {s.subject_name}</td>
                        <td>{s.slot_number || '—'}</td>
                        <td>{DAYS[s.day_of_week] || s.day_of_week}</td>
                        <td className="mono-text">{s.time_start} - {s.time_end}</td>
                        <td><span className="badge badge-primary">{s.room}</span></td>
                        <td>{s.faculty_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── ENROLLMENTS ─── */}
      {activeSection === 'enrollments' && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <p className="text-secondary" style={{ margin: 0 }}>Manage student enrollments.</p>
              {subjects && subjects.length > 0 && (
                <select
                  className="input"
                  value={enrollFilterSubject}
                  onChange={e => setEnrollFilterSubject(e.target.value)}
                  style={{ width: '220px', padding: '6px 10px', fontSize: '0.8125rem' }}
                >
                  <option value="">All Subjects</option>
                  {subjects.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                  ))}
                </select>
              )}
            </div>
            <button className="btn btn-primary" onClick={() => setShowEnrollModal(true)}>
              <Plus size={16} /> Enroll Student
            </button>
          </div>

          {enrollmentsLoading ? (
            <div className="wf-state spin"><Clock /></div>
          ) : !enrollments || enrollments.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <Users size={48} style={{ color: 'var(--border)', margin: '0 auto 16px' }} />
              <h3>No Enrollments</h3>
              <p className="text-secondary">Enroll students to subjects.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-wrapper">
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Reg No</th>
                      <th>Subject</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((e: any) => (
                      <tr key={e.id}>
                        <td><strong>{e.student_name}</strong></td>
                        <td>{e.student_reg_no}</td>
                        <td>{e.subject_code} — {e.subject_name}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-secondary"
                            style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '4px 10px' }}
                            onClick={() => {
                              if (window.confirm('Remove this enrollment?')) {
                                deleteEnrollMut.mutate(e.id);
                              }
                            }}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Add Subject Modal ─── */}
      {showSubjectModal && (
        <div className="modal-backdrop fade-in">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Add Subject</h3>
              <button className="modal-close" onClick={() => setShowSubjectModal(false)}><X size={20} /></button>
            </div>
            <form
              className="modal-body"
              onSubmit={e => {
                e.preventDefault();
                createSubjectMut.mutate({
                  ...subjectForm,
                  term: subjectForm.term || undefined,
                });
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Subject Code</label>
                  <input required className="input" placeholder="e.g. 19AI545" value={subjectForm.code} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Credits</label>
                  <input required type="number" min={1} max={10} className="input" value={subjectForm.credits} onChange={e => setSubjectForm({ ...subjectForm, credits: parseInt(e.target.value) || 3 })} />
                </div>
              </div>
              <div className="form-group">
                <label>Subject Name</label>
                <input required className="input" placeholder="e.g. Modern Web Application Development" value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Department</label>
                  <input required className="input" placeholder="e.g. CSE (AI&ML)" value={subjectForm.department} onChange={e => setSubjectForm({ ...subjectForm, department: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Semester</label>
                  <input required type="number" min={1} max={8} className="input" value={subjectForm.semester} onChange={e => setSubjectForm({ ...subjectForm, semester: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
              <div className="form-group">
                <label>Term (optional)</label>
                <input className="input" placeholder="e.g. 25-26 EVEN T2" value={subjectForm.term} onChange={e => setSubjectForm({ ...subjectForm, term: e.target.value })} />
              </div>
              <div className="modal-actions" style={{ marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSubjectModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createSubjectMut.isPending}>
                  {createSubjectMut.isPending ? 'Creating...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add Slot Modal ─── */}
      {showSlotModal && (
        <div className="modal-backdrop fade-in">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Add Time Slot</h3>
              <button className="modal-close" onClick={() => setShowSlotModal(false)}><X size={20} /></button>
            </div>
            <form
              className="modal-body"
              onSubmit={e => {
                e.preventDefault();
                createSlotMut.mutate({
                  ...slotForm,
                  subject_id: parseInt(slotForm.subject_id as string),
                  faculty_id: parseInt(slotForm.faculty_id as string),
                  slot_number: slotForm.slot_number || undefined,
                });
              }}
            >
              <div className="form-group">
                <label>Subject</label>
                <select required className="input" value={slotForm.subject_id} onChange={e => setSlotForm({ ...slotForm, subject_id: e.target.value })}>
                  <option value="">Select subject...</option>
                  {(subjects || []).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Faculty</label>
                <select required className="input" value={slotForm.faculty_id} onChange={e => setSlotForm({ ...slotForm, faculty_id: e.target.value })}>
                  <option value="">Select faculty...</option>
                  {(staffList || []).map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Day of Week</label>
                  <select required className="input" value={slotForm.day_of_week} onChange={e => setSlotForm({ ...slotForm, day_of_week: parseInt(e.target.value) })}>
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Room</label>
                  <input required className="input" placeholder="e.g. 1452" value={slotForm.room} onChange={e => setSlotForm({ ...slotForm, room: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Start Time</label>
                  <input required type="time" className="input" value={slotForm.time_start} onChange={e => setSlotForm({ ...slotForm, time_start: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input required type="time" className="input" value={slotForm.time_end} onChange={e => setSlotForm({ ...slotForm, time_end: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Slot Number (optional)</label>
                <input className="input" placeholder="e.g. CLS08-10" value={slotForm.slot_number} onChange={e => setSlotForm({ ...slotForm, slot_number: e.target.value })} />
              </div>
              <div className="modal-actions" style={{ marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSlotModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createSlotMut.isPending}>
                  {createSlotMut.isPending ? 'Creating...' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Enroll Student Modal ─── */}
      {showEnrollModal && (
        <div className="modal-backdrop fade-in">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Enroll Student</h3>
              <button className="modal-close" onClick={() => setShowEnrollModal(false)}><X size={20} /></button>
            </div>
            <form
              className="modal-body"
              onSubmit={e => {
                e.preventDefault();
                createEnrollMut.mutate({
                  student_id: parseInt(enrollForm.student_id),
                  subject_id: parseInt(enrollForm.subject_id),
                });
              }}
            >
              <div className="form-group">
                <label>Subject</label>
                <select required className="input" value={enrollForm.subject_id} onChange={e => setEnrollForm({ ...enrollForm, subject_id: e.target.value })}>
                  <option value="">Select subject...</option>
                  {(subjects || []).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Student</label>
                <select required className="input" value={enrollForm.student_id} onChange={e => setEnrollForm({ ...enrollForm, student_id: e.target.value })}>
                  <option value="">Select student...</option>
                  {(studentList || []).map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.reg_no})</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions" style={{ marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEnrollModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createEnrollMut.isPending}>
                  {createEnrollMut.isPending ? 'Enrolling...' : 'Enroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
