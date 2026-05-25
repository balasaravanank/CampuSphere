import { useState } from 'react';
import { Settings, Users, FileText, BarChart3, Shield, X, Loader2, Briefcase, Target, GitBranch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import './ModulePage.css';

export default function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddUser, setShowAddUser] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reg_no: '',
    department: '',
    role: 'staff'
  });

  // Fetch real stats
  const { data: statsData } = useQuery({
    queryKey: ['admin_dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data.data),
  });

  const createUserMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_dashboard'] });
      toast.success('User created successfully');
      setShowAddUser(false);
      setFormData({ name: '', email: '', reg_no: '', department: '', role: 'staff' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to create user');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const stats = [
    { label: 'Total Students', value: statsData?.total_students || '...', icon: Users, color: 'accent' },
    { label: 'Total Staff', value: statsData?.total_staff || '...', icon: Users, color: 'success' },
    { label: 'Pending Requests', value: statsData?.pending_workflows || '...', icon: FileText, color: 'warning' },
    { label: 'Active Circulars', value: statsData?.active_circulars || '...', icon: BarChart3, color: 'primary' },
    { label: 'Opportunities', value: statsData?.total_opportunities || '...', icon: Target, color: 'accent' },
  ];

  return (
    <div className="module-page">
      <div className="module-header">
        <h2>Admin Panel</h2>
        <span className="badge badge-danger"><Shield size={12} /> Admin Access</span>
      </div>

      <div className="dashboard-stats">
        {stats.map((s) => (
          <div key={s.label} className={`stat-card stat-${s.color}`}>
            <div className="stat-icon"><s.icon size={22} /></div>
            <div className="stat-content">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="module-grid-2" style={{ marginTop: 24 }}>
        <div className="card admin-section">
          <h3 className="card-title"><Users size={18} /> User Management</h3>
          <div className="admin-actions">
            <button className="btn btn-secondary btn-sm" disabled>View All Users</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddUser(true)}>Add New User (Staff)</button>
          </div>
        </div>

        <div className="card admin-section">
          <h3 className="card-title"><Settings size={18} /> Content Management</h3>
          <div className="admin-actions">
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/academics')}>Manage Subjects & Slots</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/events/new')}>Manage Events</button>
            <button className="btn btn-secondary btn-sm" disabled>Edit Departments</button>
          </div>
        </div>

        <div className="card admin-section">
          <h3 className="card-title"><GitBranch size={18} /> Workflow Templates</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
            Configure approval chains for workflow requests (Mentor → HOD → SCOFT Admin).
          </p>
          <div className="admin-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/admin/workflow-templates')}
            >
              Manage Templates
            </button>
          </div>
        </div>

        <div className="card admin-section">
          <h3 className="card-title"><Briefcase size={18} /> Opportunities Management</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
            Post hackathons, events, internships & competitions. Control which staff can post.
          </p>
          <div className="admin-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/opportunities')}
            >
              Post / Manage Opportunities
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/admin/opportunities-access')}
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              <Shield size={14} /> Manage Staff Access
            </button>
          </div>
        </div>

        <div className="card admin-section">
          <h3 className="card-title"><Users size={18} /> Workshops & Activities</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
            Approve pending workshop requests, set reward points, and manage hosted activities.
          </p>
          <div className="admin-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/admin/workshops')}
            >
              Manage Workshop Requests
            </button>
          </div>
        </div>
      </div>

      {showAddUser && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Staff / User</h3>
              <button className="btn-icon" onClick={() => setShowAddUser(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input required type="text" className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Prof. Jane Doe" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input required type="email" className="input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="jane@saveetha.ac.in" />
              </div>
              <div className="form-group">
                <label>Registration / Employee ID</label>
                <input required type="text" className="input" value={formData.reg_no} onChange={e => setFormData({ ...formData, reg_no: e.target.value })} placeholder="STF002" />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input required type="text" className="input" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} placeholder="Computer Science" />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select className="input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="student">Student</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                  A default password <strong>Staff@2026!</strong> will be assigned to the new user.
                </p>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddUser(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? <Loader2 size={16} className="spin" /> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
