import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Clock, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import './ModulePage.css';

export default function AdminWorkshopsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [approvalModal, setApprovalModal] = useState<{ open: boolean; workshop: any | null; mode: 'approve' | 'reject' }>({
    open: false,
    workshop: null,
    mode: 'approve'
  });

  const [points, setPoints] = useState({ host: 50, attendee: 10 });
  const [rejectReason, setRejectReason] = useState('');

  const { data: pendingWorkshops, isLoading } = useQuery({
    queryKey: ['admin_pending_workshops'],
    queryFn: () => api.get('/workshops/admin/pending').then(r => r.data.data),
  });

  const approveMutation = useMutation({
    mutationFn: (data: { id: number; reward_points_host: number; reward_points_attendee: number }) =>
      api.patch(`/workshops/${data.id}/approve`, {
        reward_points_host: data.reward_points_host,
        reward_points_attendee: data.reward_points_attendee
      }),
    onSuccess: () => {
      toast.success('Workshop approved successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin_pending_workshops'] });
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      setApprovalModal({ open: false, workshop: null, mode: 'approve' });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to approve')
  });

  const rejectMutation = useMutation({
    mutationFn: (data: { id: number; rejection_reason: string }) =>
      api.patch(`/workshops/${data.id}/reject`, { rejection_reason: data.rejection_reason }),
    onSuccess: () => {
      toast.success('Workshop rejected.');
      queryClient.invalidateQueries({ queryKey: ['admin_pending_workshops'] });
      setApprovalModal({ open: false, workshop: null, mode: 'approve' });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to reject')
  });

  const handleApprove = () => {
    if (!approvalModal.workshop) return;
    approveMutation.mutate({
      id: approvalModal.workshop.id,
      reward_points_host: points.host,
      reward_points_attendee: points.attendee
    });
  };

  const handleReject = () => {
    if (!approvalModal.workshop) return;
    if (!rejectReason) {
      toast.error('Please provide a reason');
      return;
    }
    rejectMutation.mutate({
      id: approvalModal.workshop.id,
      rejection_reason: rejectReason
    });
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-icon btn-ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft size={20} />
          </button>
          <h2>Manage Workshop Requests</h2>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="wf-state spin"><Clock /></div>
        ) : !pendingWorkshops || pendingWorkshops.length === 0 ? (
          <div className="wf-state">No pending workshop requests.</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Host</th>
                  <th>Title</th>
                  <th>Date & Time</th>
                  <th>Capacity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingWorkshops.map((ws: any) => (
                  <tr key={ws.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{ws.host?.name}</div>
                      <div className="text-secondary" style={{ fontSize: '0.75rem' }}>{ws.host?.role} - {ws.host?.department}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{ws.title}</div>
                      <div className="text-secondary" style={{ fontSize: '0.75rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ws.description}
                      </div>
                    </td>
                    <td>
                      <div>{new Date(ws.scheduled_date).toLocaleDateString()}</div>
                      <div className="text-secondary">{new Date(ws.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td>{ws.max_participants}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-sm btn-primary"
                          style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                          onClick={() => setApprovalModal({ open: true, workshop: ws, mode: 'approve' })}
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => setApprovalModal({ open: true, workshop: ws, mode: 'reject' })}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {approvalModal.open && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {approvalModal.mode === 'approve' ? 'Approve Workshop' : 'Reject Workshop'}
              </h3>
              <button className="modal-close" onClick={() => setApprovalModal({ open: false, workshop: null, mode: 'approve' })}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem' }}>
                Workshop: <strong>{approvalModal.workshop?.title}</strong><br/>
                Host: <strong>{approvalModal.workshop?.host?.name}</strong>
              </p>

              {approvalModal.mode === 'approve' ? (
                <>
                  <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>
                    Set reward points to be awarded automatically upon completion.
                  </p>
                  <div className="form-group">
                    <label>Points for Host</label>
                    <input
                      type="number"
                      className="input"
                      value={points.host}
                      onChange={(e) => setPoints({ ...points, host: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Points for Attendees (each)</label>
                    <input
                      type="number"
                      className="input"
                      value={points.attendee}
                      onChange={(e) => setPoints({ ...points, attendee: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label>Rejection Reason</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="E.g., Please provide more details about the agenda..."
                  />
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button className="btn btn-secondary" onClick={() => setApprovalModal({ open: false, workshop: null, mode: 'approve' })}>
                  Cancel
                </button>
                {approvalModal.mode === 'approve' ? (
                  <button className="btn btn-primary" onClick={handleApprove} disabled={approveMutation.isPending}>
                    {approveMutation.isPending ? 'Approving...' : 'Approve & Set Points'}
                  </button>
                ) : (
                  <button className="btn btn-danger" onClick={handleReject} disabled={rejectMutation.isPending}>
                    {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
