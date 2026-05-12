import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Mail, Shield, ShieldCheck, ShieldOff,
  Loader2, AlertCircle, Plus, Trash2, Users, Clock,
  CheckCircle2, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import './AdminOpportunitiesAccessPage.css';
import './ModulePage.css';

interface StaffPermission {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_reg_no: string;
  user_department: string;
  permission: string;
  granted_by_name: string;
  granted_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function AdminOpportunitiesAccessPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [search, setSearch] = useState('');

  /* ── Fetch granted staff ── */
  const { data, isLoading, isError } = useQuery({
    queryKey: ['opp-permissions'],
    queryFn: () =>
      api.get('/admin/permissions/opportunities').then(r => r.data.data as StaffPermission[]),
  });

  /* ── Grant access mutation ── */
  const grantMutation = useMutation({
    mutationFn: (targetEmail: string) =>
      api.post('/admin/permissions/opportunities', {
        email: targetEmail,
        permission: 'post_opportunities',
      }),
    onSuccess: (_, targetEmail) => {
      queryClient.invalidateQueries({ queryKey: ['opp-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['opp-permission'] });
      toast.success(`Access granted to ${targetEmail}`);
      setEmail('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to grant access');
    },
  });

  /* ── Revoke access mutation ── */
  const revokeMutation = useMutation({
    mutationFn: (userId: number) =>
      api.delete(`/admin/permissions/opportunities/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opp-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['opp-permission'] });
      toast.success('Access revoked');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to revoke access');
    },
  });

  const permissions = data ?? [];
  const filtered = permissions.filter(p =>
    search === '' ||
    p.user_name.toLowerCase().includes(search.toLowerCase()) ||
    p.user_email.toLowerCase().includes(search.toLowerCase()) ||
    p.user_department.toLowerCase().includes(search.toLowerCase())
  );

  const handleGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    grantMutation.mutate(email.trim().toLowerCase());
  };

  return (
    <div className="oap-page">
      {/* Back button */}
      <button className="oap-back-btn" onClick={() => navigate('/admin')}>
        <ArrowLeft size={16} />
        Back to Admin Panel
      </button>

      {/* Header */}
      <div className="oap-header">
        <div className="oap-header-icon">
          <Shield size={28} />
        </div>
        <div>
          <h2 className="oap-title">Opportunities Access Control</h2>
          <p className="oap-subtitle">
            Grant or revoke staff members' ability to post opportunities, hackathons & events.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="oap-stats">
        <div className="oap-stat">
          <span className="oap-stat-value">{permissions.length}</span>
          <span className="oap-stat-label">Staff with Access</span>
        </div>
        <div className="oap-stat oap-stat-info">
          <ShieldCheck size={18} />
          <span className="oap-stat-desc">
            Only staff listed here can post, edit & delete opportunities.
            Admins always have full access.
          </span>
        </div>
      </div>

      {/* Grant Access Card */}
      <div className="oap-grant-card">
        <div className="oap-grant-header">
          <Plus size={16} />
          <h3 className="oap-grant-title">Grant Access to Staff</h3>
        </div>
        <p className="oap-grant-desc">
          Enter the staff member's registered email address to grant them opportunity posting access.
        </p>

        <form onSubmit={handleGrant} className="oap-grant-form">
          <div className="oap-email-input-wrap">
            <Mail size={16} className="oap-email-icon" />
            <input
              type="email"
              className="oap-email-input"
              placeholder="staff@campusphere.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={grantMutation.isPending}
              autoComplete="email"
            />
          </div>
          <button
            type="submit"
            className="btn oap-grant-btn"
            disabled={grantMutation.isPending || !email.trim()}
          >
            {grantMutation.isPending
              ? <Loader2 size={15} className="spin" />
              : <ShieldCheck size={15} />
            }
            {grantMutation.isPending ? 'Granting...' : 'Grant Access'}
          </button>
        </form>
      </div>

      {/* Staff List */}
      <div className="oap-list-card">
        <div className="oap-list-header">
          <div className="oap-list-header-left">
            <Users size={16} />
            <h3 className="oap-list-title">Staff with Access</h3>
            {permissions.length > 0 && (
              <span className="oap-count-pill">{permissions.length}</span>
            )}
          </div>
          {permissions.length > 0 && (
            <div className="oap-search-wrap">
              <Search size={14} className="oap-search-icon" />
              <input
                type="text"
                className="oap-search-input"
                placeholder="Search staff..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="wf-state">
            <Loader2 size={20} className="spin" />
            <span>Loading access list...</span>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="wf-state wf-error">
            <AlertCircle size={18} />
            <span>Failed to load access list</span>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && permissions.length === 0 && (
          <div className="oap-empty">
            <ShieldOff size={40} className="oap-empty-icon" />
            <p className="oap-empty-title">No staff have access yet</p>
            <p className="oap-empty-sub">
              Grant access above using a staff member's email address.
            </p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="table-wrapper">
            <table className="oap-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Staff Member</th>
                  <th>Department</th>
                  <th>Granted By</th>
                  <th>Granted On</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id}>
                    <td className="oap-td-num">{i + 1}</td>
                    <td>
                      <div className="oap-staff-name">{p.user_name}</div>
                      <div className="oap-staff-email">{p.user_email}</div>
                    </td>
                    <td>
                      <span className="oap-dept-badge">{p.user_department}</span>
                    </td>
                    <td className="oap-granted-by">{p.granted_by_name}</td>
                    <td>
                      <div className="oap-date-cell">
                        <Clock size={11} />
                        {formatDate(p.granted_at)}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn oap-revoke-btn"
                        onClick={() => revokeMutation.mutate(p.user_id)}
                        disabled={revokeMutation.isPending}
                        title="Revoke access"
                      >
                        {revokeMutation.isPending
                          ? <Loader2 size={12} className="spin" />
                          : <ShieldOff size={12} />
                        }
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* No search results */}
        {!isLoading && !isError && permissions.length > 0 && filtered.length === 0 && (
          <div className="oap-empty">
            <p className="oap-empty-sub">No staff match your search.</p>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="oap-info-box">
        <CheckCircle2 size={16} className="oap-info-icon" />
        <div>
          <p className="oap-info-title">How it works</p>
          <ul className="oap-info-list">
            <li>Admin has full access — no setup needed.</li>
            <li>Staff with access can post, edit and delete opportunities from the Opportunities page.</li>
            <li>Staff without access will see the list but <strong>cannot post</strong>.</li>
            <li>Revoking access takes effect immediately.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
