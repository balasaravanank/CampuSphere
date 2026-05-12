import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Calendar, ClipboardList, UserCheck, Award, Gift,
  Clock, CheckCircle2, AlertCircle, XCircle, BookOpen, Plus,
  Loader2, ChevronDown, Filter, Search
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import './ModulePage.css';
import './WorkflowsPage.css';

const WORKFLOW_TYPES = [
  { value: 'general_letter', label: 'General Letter', icon: FileText },
  { value: 'event_application', label: 'Event Application', icon: Calendar },
  { value: 'leave_application', label: 'Leave Application', icon: ClipboardList },
  { value: 'manual_academic_attendance', label: 'Manual Academic Attendance', icon: UserCheck },
  { value: 'manual_event_attendance', label: 'Manual Event Attendance', icon: UserCheck },
  { value: 'reward_claim', label: 'Reward Claim', icon: Award },
  { value: 'reward_redeem', label: 'Reward Redeem', icon: Gift },
];

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: any }> = {
  approved: { label: 'Approved', badge: 'badge-success', icon: CheckCircle2 },
  under_review: { label: 'Under Review', badge: 'badge-warning', icon: Clock },
  submitted: { label: 'Submitted', badge: 'badge-primary', icon: BookOpen },
  rejected: { label: 'Rejected', badge: 'badge-danger', icon: XCircle },
  draft: { label: 'Draft', badge: 'badge-primary', icon: BookOpen },
  cancelled: { label: 'Cancelled', badge: 'badge-danger', icon: AlertCircle },
  escalated: { label: 'Escalated', badge: 'badge-warning', icon: Clock },
};

const TYPE_LABELS: Record<string, string> = {
  general_letter: 'General Letter',
  event_application: 'Event Application',
  leave_application: 'Leave Application',
  manual_academic_attendance: 'Manual Academic Attendance',
  manual_event_attendance: 'Manual Event Attendance',
  reward_claim: 'Reward Claim',
  reward_redeem: 'Reward Redeem',
};

interface ApprovalStep {
  id: number;
  step_order: number;
  label: string;
  approver_role: string;
  approver_name: string | null;
  status: string;
  comment: string | null;
  acted_at: string | null;
}

interface WorkflowItem {
  id: number;
  type: string;
  template_id: number | null;
  template_name: string | null;
  student_id: number;
  student_name: string | null;
  status: string;
  current_step: number;
  title: string;
  description: string | null;
  payload: Record<string, any> | null;
  created_at: string;
  resolved_at: string | null;
  approval_steps: ApprovalStep[];
}

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'my' | 'pending'>('my');

  const isStaffOrAdmin = user?.role === 'staff' || user?.role === 'admin';

  const { data: myRequests, isLoading } = useQuery({
    queryKey: ['workflows', statusFilter, typeFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      return api.get(`/workflows/?${params}`).then(r => r.data.data as WorkflowItem[]);
    },
  });

  const { data: pendingRequests, isLoading: pendingLoading } = useQuery({
    queryKey: ['workflows-pending'],
    queryFn: () => api.get('/workflows/pending').then(r => r.data.data as WorkflowItem[]),
    enabled: isStaffOrAdmin,
  });

  const handleNewApplication = (type: string) => {
    setShowDropdown(false);
    navigate(`/workflows/new/${type}`);
  };

  const displayData = activeTab === 'pending' ? pendingRequests : myRequests;
  const loading = activeTab === 'pending' ? pendingLoading : isLoading;

  // Group requests by type
  const grouped = (displayData ?? []).reduce<Record<string, WorkflowItem[]>>((acc, r) => {
    const key = r.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div className="module-page">
      {/* Header */}
      <div className="module-header">
        <div>
          <h2>Workflow Requests</h2>
          <p className="wf-subtitle">Create and track your approval workflows.</p>
        </div>
        <div className="wf-dropdown-wrapper">
          <button
            className="btn btn-primary btn-sm wf-new-btn"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Plus size={14} /> New Application <ChevronDown size={14} />
          </button>
          {showDropdown && (
            <>
              <div className="wf-dropdown-backdrop" onClick={() => setShowDropdown(false)} />
              <div className="wf-dropdown-menu">
                {WORKFLOW_TYPES.map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      className="wf-dropdown-item"
                      onClick={() => handleNewApplication(t.value)}
                    >
                      <Icon size={15} /> {t.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs for staff/admin */}
      {isStaffOrAdmin && (
        <div className="wf-tabs">
          <button
            className={`wf-tab ${activeTab === 'my' ? 'wf-tab-active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            My Requests
          </button>
          <button
            className={`wf-tab ${activeTab === 'pending' ? 'wf-tab-active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Approvals
            {pendingRequests && pendingRequests.length > 0 && (
              <span className="wf-tab-badge">{pendingRequests.length}</span>
            )}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="wf-filters">
        <div className="wf-filter-group">
          <Filter size={14} />
          <select
            className="wf-filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="wf-filter-group">
          <Search size={14} />
          <select
            className="wf-filter-select"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            {WORKFLOW_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="wf-state"><Loader2 size={24} className="spin" /><span>Loading requests...</span></div>
      )}

      {!loading && (!displayData || displayData.length === 0) && (
        <div className="wf-empty-state card">
          <ClipboardList size={48} strokeWidth={1} />
          <h3>No requests found</h3>
          <p>
            {activeTab === 'pending'
              ? 'No requests are waiting for your approval.'
              : 'Submit your first workflow request using the button above.'}
          </p>
        </div>
      )}

      {!loading && displayData && displayData.length > 0 && (
        <div className="wf-categories">
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type} className="wf-category">
              <h3 className="wf-category-title">{TYPE_LABELS[type] || type}s</h3>
              <div className="card wf-table-card">
                <table className="data-table">
                  <thead>
                    <tr>
                      {activeTab === 'pending' && <th>Student</th>}
                      <th>Title</th>
                      <th>Workflow</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(r => {
                      const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.submitted;
                      const Icon = cfg.icon;
                      const totalSteps = r.approval_steps.length;
                      const completedSteps = r.approval_steps.filter(
                        s => s.status === 'approved'
                      ).length;

                      return (
                        <tr
                          key={r.id}
                          className="workflow-row"
                          onClick={() => navigate(`/workflows/${r.id}`)}
                        >
                          {activeTab === 'pending' && (
                            <td className="text-secondary">{r.student_name}</td>
                          )}
                          <td className="workflow-title">{r.title}</td>
                          <td>
                            <span className="wf-template-name">
                              {r.template_name || '—'}
                            </span>
                          </td>
                          <td className="mono-text">{r.created_at}</td>
                          <td>
                            <span className={`badge ${cfg.badge}`}>
                              <Icon size={12} /> {cfg.label}
                            </span>
                          </td>
                          <td>
                            {totalSteps > 0 ? (
                              <div className="wf-progress-mini">
                                <div className="wf-progress-bar-mini">
                                  <div
                                    className="wf-progress-fill-mini"
                                    style={{
                                      width: `${(completedSteps / totalSteps) * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="wf-progress-text">
                                  {completedSteps}/{totalSteps}
                                </span>
                              </div>
                            ) : (
                              <span className="text-secondary">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
