import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, CheckCircle2, Circle, XCircle, Clock, Loader2,
  FileText, User, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import './ModulePage.css';
import './WorkflowsPage.css';

const TYPE_LABELS: Record<string, string> = {
  general_letter: 'General Letter',
  event_application: 'Event Application',
  leave_application: 'Leave Application',
  manual_academic_attendance: 'Manual Academic Attendance',
  manual_event_attendance: 'Manual Event Attendance',
  reward_claim: 'Reward Claim',
  reward_redeem: 'Reward Redeem',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  approved: { label: 'Approved', color: 'var(--success)' },
  under_review: { label: 'Under Review', color: 'var(--warning)' },
  submitted: { label: 'Submitted', color: 'var(--accent)' },
  rejected: { label: 'Rejected', color: 'var(--danger)' },
  cancelled: { label: 'Cancelled', color: 'var(--text-tertiary)' },
  draft: { label: 'Draft', color: 'var(--text-tertiary)' },
};

interface ApprovalStep {
  id: number;
  step_order: number;
  label: string;
  approver_role: string;
  approver_id: number | null;
  approver_name: string | null;
  status: string;
  comment: string | null;
  acted_at: string | null;
}

interface WorkflowDetail {
  id: number;
  type: string;
  template_name: string | null;
  student_name: string | null;
  status: string;
  current_step: number;
  title: string;
  description: string | null;
  payload: Record<string, any> | null;
  attachment_urls: string[] | null;
  created_at: string;
  resolved_at: string | null;
  approval_steps: ApprovalStep[];
}

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'workflow' | 'chat'>('details');

  const { data: request, isLoading } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => api.get(`/workflows/${id}`).then(r => r.data.data as WorkflowDetail),
  });

  const approveMutation = useMutation({
    mutationFn: () => api.post(`/workflows/${id}/approve`, { comment: comment || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflows-pending'] });
      toast.success('Step approved successfully!');
      setComment('');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.post(`/workflows/${id}/reject`, { comment: comment || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflows-pending'] });
      toast.success('Request rejected');
      setComment('');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to reject'),
  });

  if (isLoading) {
    return (
      <div className="module-page">
        <div className="wf-state"><Loader2 size={24} className="spin" /> Loading...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="module-page">
        <div className="wf-state">Request not found</div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[request.status] || STATUS_CONFIG.submitted;
  const canApprove =
    user &&
    (user.role === 'staff' || user.role === 'admin') &&
    (request.status === 'submitted' || request.status === 'under_review');

  // Check if current step matches user's role
  const currentStep = request.approval_steps.find(
    s => s.step_order === request.current_step
  );
  const isMyTurn =
    canApprove &&
    currentStep &&
    currentStep.status === 'pending' &&
    currentStep.approver_role === user?.role;

  return (
    <div className="module-page">
      {/* Header */}
      <div className="wf-detail-header">
        <div className="wf-detail-header-left">
          <h2>{request.title}</h2>
          <div className="wf-detail-meta">
            <span className="badge badge-primary">{TYPE_LABELS[request.type]}</span>
            <span
              className="wf-detail-status"
              style={{ color: statusCfg.color }}
            >
              ● {statusCfg.label}
            </span>
            <span className="text-secondary">#{request.id}</span>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/workflows')}>
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {/* Tabs */}
      <div className="wf-tabs">
        <button
          className={`wf-tab ${activeTab === 'details' ? 'wf-tab-active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <FileText size={14} /> Details
        </button>
        <button
          className={`wf-tab ${activeTab === 'workflow' ? 'wf-tab-active' : ''}`}
          onClick={() => setActiveTab('workflow')}
        >
          <User size={14} /> Approval Workflow
        </button>
        <button
          className={`wf-tab ${activeTab === 'chat' ? 'wf-tab-active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={14} /> Chat
        </button>
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="card wf-detail-card">
          <div className="wf-detail-grid">
            <div className="wf-detail-field">
              <span className="wf-detail-label">Submitted by</span>
              <span>{request.student_name}</span>
            </div>
            <div className="wf-detail-field">
              <span className="wf-detail-label">Date</span>
              <span className="mono-text">{request.created_at}</span>
            </div>
            <div className="wf-detail-field">
              <span className="wf-detail-label">Workflow</span>
              <span>{request.template_name || '—'}</span>
            </div>
            <div className="wf-detail-field">
              <span className="wf-detail-label">Status</span>
              <span style={{ color: statusCfg.color, fontWeight: 600 }}>
                {statusCfg.label}
              </span>
            </div>
          </div>

          {/* Payload fields */}
          {request.payload && (
            <div className="wf-detail-payload">
              <h4>Request Details</h4>
              {Object.entries(request.payload).map(([key, val]) => (
                val ? (
                  <div key={key} className="wf-detail-field">
                    <span className="wf-detail-label">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className={key === 'content' ? 'wf-detail-content' : ''}>
                      {String(val)}
                    </span>
                  </div>
                ) : null
              ))}
            </div>
          )}

          {request.description && (
            <div className="wf-detail-field" style={{ marginTop: 16 }}>
              <span className="wf-detail-label">Description</span>
              <span>{request.description}</span>
            </div>
          )}
        </div>
      )}

      {/* Approval Workflow Tab */}
      {activeTab === 'workflow' && (
        <div className="card wf-detail-card">
          <h4 style={{ marginBottom: 20 }}>Approval Pipeline</h4>
          <div className="wf-stepper wf-stepper-vertical">
            {/* Submitter step */}
            <div className="wf-step-v">
              <div className="wf-step-v-left">
                <div className="wf-step-dot-v wf-step-approved">
                  <CheckCircle2 size={20} />
                </div>
                <div className="wf-step-connector" />
              </div>
              <div className="wf-step-v-content">
                <div className="wf-step-v-header">
                  <span className="wf-step-v-label">Submitted</span>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Done</span>
                </div>
                <p className="wf-step-v-detail">
                  {request.student_name} · {request.created_at}
                </p>
              </div>
            </div>

            {/* Approval steps */}
            {request.approval_steps.map((step, i) => {
              let dotClass = 'wf-step-pending';
              let DotIcon = Circle;
              let badgeClass = '';
              let badgeText = 'Pending';

              if (step.status === 'approved') {
                dotClass = 'wf-step-approved';
                DotIcon = CheckCircle2;
                badgeClass = 'badge-success';
                badgeText = 'Approved';
              } else if (step.status === 'rejected') {
                dotClass = 'wf-step-rejected';
                DotIcon = XCircle;
                badgeClass = 'badge-danger';
                badgeText = 'Rejected';
              } else if (step.step_order === request.current_step) {
                dotClass = 'wf-step-current';
                DotIcon = Clock;
                badgeClass = 'badge-warning';
                badgeText = 'Awaiting';
              }

              const isLast = i === request.approval_steps.length - 1;

              return (
                <div key={step.id} className="wf-step-v">
                  <div className="wf-step-v-left">
                    <div className={`wf-step-dot-v ${dotClass}`}>
                      <DotIcon size={20} />
                    </div>
                    {!isLast && <div className="wf-step-connector" />}
                  </div>
                  <div className="wf-step-v-content">
                    <div className="wf-step-v-header">
                      <span className="wf-step-v-label">{step.label}</span>
                      <span className={`badge ${badgeClass}`} style={{ fontSize: '0.7rem' }}>
                        {badgeText}
                      </span>
                    </div>
                    <p className="wf-step-v-detail">
                      {step.approver_name
                        ? `${step.approver_name} · ${step.acted_at || ''}`
                        : `Waiting for ${step.approver_role} approval`
                      }
                    </p>
                    {step.comment && (
                      <p className="wf-step-comment">"{step.comment}"</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Approve / Reject actions */}
          {isMyTurn && (
            <div className="wf-approval-actions">
              <h4>Your Action Required</h4>
              <p className="text-secondary" style={{ fontSize: '0.8125rem', marginBottom: 12 }}>
                You are the <strong>{currentStep?.label}</strong> for this request.
              </p>
              <div className="form-group">
                <label className="form-label">Comment (optional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
              </div>
              <div className="wf-approval-btns">
                <button
                  className="btn btn-danger"
                  onClick={() => rejectMutation.mutate()}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? <Loader2 size={14} className="spin" /> : <XCircle size={14} />}
                  Reject
                </button>
                <button
                  className="btn btn-primary wf-approve-btn"
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />}
                  Approve & Forward
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat Tab (placeholder) */}
      {activeTab === 'chat' && (
        <div className="card wf-detail-card">
          <div className="wf-chat-placeholder">
            <MessageSquare size={40} strokeWidth={1} />
            <h4>Chat Coming Soon</h4>
            <p className="text-secondary">
              Discussion thread for this request will be available in a future update.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
