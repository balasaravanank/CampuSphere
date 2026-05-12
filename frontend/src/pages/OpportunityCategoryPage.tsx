import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Trophy, Briefcase, Zap, BookOpen, GraduationCap,
  ExternalLink, Clock, Building2, Loader2, AlertCircle,
  CheckCircle2, Plus, X, Users, Trash2, Calendar,
  ChevronRight, Award, Target, ArrowLeft, Globe, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import './OpportunitiesPage.css';
import './OpportunityCategoryPage.css';

/* ─── Type config ───────────────────────────────────────── */
const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; stripe: string }> = {
  hackathon:   { label: 'Hackathon',   icon: Zap,          color: 'opp-type-hackathon',   stripe: '#DC2626' },
  event:       { label: 'Event',       icon: Calendar,     color: 'opp-type-event',       stripe: '#2563EB' },
  internship:  { label: 'Internship',  icon: Briefcase,    color: 'opp-type-internship',  stripe: '#059669' },
  competition: { label: 'Competition', icon: Trophy,       color: 'opp-type-competition', stripe: '#D97706' },
  scholarship: { label: 'Scholarship', icon: Award,        color: 'opp-type-scholarship', stripe: '#0891B2' },
  workshop:    { label: 'Workshop',    icon: BookOpen,     color: 'opp-type-workshop',    stripe: '#7C3AED' },
};

const TYPE_FILTERS = ['All', 'Hackathon', 'Event', 'Internship', 'Competition', 'Scholarship', 'Workshop'];
const SOURCE_FILTERS = ['All', 'College', 'Unstop', 'Devfolio'];

const SOURCE_MAP: Record<string, string> = {
  'All': 'all',
  'College': 'manual',
  'Unstop': 'unstop',
  'Devfolio': 'devfolio',
};

const DEPT_OPTIONS = ['All', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'CSD', 'MBA', 'MCA'];

/* ─── Interfaces ────────────────────────────────────────── */
interface OpportunityItem {
  id: number;
  type: string;
  title: string;
  organization: string;
  description: string | null;
  link: string | null;
  deadline: string | null;
  deadline_iso: string | null;
  departments: string[];
  eligibility: string | null;
  applied: boolean;
  application_count: number;
  source: string;
  source_id: string | null;
  logo_url: string | null;
  poster_name?: string;
  created_at: string;
}

interface CreateForm {
  title: string;
  type: string;
  organization: string;
  description: string;
  link: string;
  deadline: string;
  departments: string[];
  eligibility: string;
}

const EMPTY_FORM: CreateForm = {
  title: '', type: 'hackathon', organization: '',
  description: '', link: '', deadline: '',
  departments: [], eligibility: '',
};

/* ─── Props ─────────────────────────────────────────────── */
interface OpportunityCategoryPageProps {
  /** If set, locks the type filter to this category */
  categoryType?: string;
  /** Page title override */
  pageTitle?: string;
}

/* ─── Helpers ───────────────────────────────────────────── */
function getDeadlineUrgency(iso: string | null): 'danger' | 'warning' | 'normal' | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  const days = diff / (1000 * 60 * 60 * 24);
  if (days < 0) return null;
  if (days <= 7) return 'danger';
  if (days <= 14) return 'warning';
  return 'normal';
}

function getDaysLeft(iso: string | null): string | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Expired';
  if (days === 0) return 'Today!';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

function getSourceBadge(source: string) {
  switch (source) {
    case 'unstop':
      return { label: 'Unstop', className: 'source-badge-unstop' };
    case 'devfolio':
      return { label: 'Devfolio', className: 'source-badge-devfolio' };
    case 'manual':
    default:
      return { label: 'College', className: 'source-badge-college' };
  }
}

/* ─── Main Component ────────────────────────────────────── */
export default function OpportunityCategoryPage({
  categoryType,
  pageTitle,
}: OpportunityCategoryPageProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';

  const { data: permData } = useQuery({
    queryKey: ['opp-permission', user?.id],
    queryFn: () =>
      api.get(`/admin/permissions/check/${user?.id}?permission=post_opportunities`)
         .then(r => r.data.data.has_access as boolean),
    enabled: user?.role === 'staff',
  });

  const canPost = user?.role === 'admin' || (user?.role === 'staff' && permData === true);

  const [filter, setFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);

  // Determine the effective type filter
  const effectiveType = categoryType || (filter === 'All' ? 'all' : filter.toLowerCase());
  const effectiveSource = SOURCE_MAP[sourceFilter] || 'all';

  /* ── Queries ── */
  const { data, isLoading, isError } = useQuery({
    queryKey: ['opportunities', effectiveType, effectiveSource],
    queryFn: () =>
      api.get('/opportunities/', {
        params: { type: effectiveType, source: effectiveSource }
      }).then(r => r.data.data as OpportunityItem[]),
  });

  /* ── Mutations ── */
  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/opportunities/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities-stats'] });
      toast.success('Opportunity posted!');
      setShowCreate(false);
      setForm(EMPTY_FORM);
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to create'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/opportunities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities-stats'] });
      toast.success('Opportunity removed');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to delete'),
  });

  const applyMutation = useMutation({
    mutationFn: (id: number) => api.post(`/opportunities/${id}/apply`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success('Applied successfully!');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to apply'),
  });

  const withdrawMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/opportunities/${id}/apply`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success('Application withdrawn');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to withdraw'),
  });

  /* ── Form handlers ── */
  const handleDeptToggle = (dept: string) => {
    if (dept === 'All') {
      setForm(f => ({ ...f, departments: [] }));
      return;
    }
    setForm(f => ({
      ...f,
      departments: f.departments.includes(dept)
        ? f.departments.filter(d => d !== dept)
        : [...f.departments, dept],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      type: categoryType || form.type,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      departments: form.departments.length ? form.departments : ['All'],
      link: form.link || null,
      description: form.description || null,
      eligibility: form.eligibility || null,
    };
    createMutation.mutate(payload);
  };

  const opportunities = data ?? [];
  const resolvedTitle = pageTitle || 'All Opportunities';

  /* ── Render ── */
  return (
    <div className="opp-page">
      {/* Breadcrumb */}
      <div className="opp-breadcrumb">
        <button className="opp-breadcrumb-link" onClick={() => navigate('/opportunities')}>
          <ArrowLeft size={14} />
          Opportunities Hub
        </button>
        <ChevronRight size={12} />
        <span>{resolvedTitle}</span>
      </div>

      {/* Header */}
      <div className="opp-header">
        <div className="opp-header-left">
          <h2 className="opp-title">{resolvedTitle}</h2>
          <span className="opp-count-badge">{opportunities.length} active</span>
        </div>
        {canPost && (
          <button className="btn opp-post-btn" onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Post Opportunity
          </button>
        )}
      </div>

      {/* Source Filter Chips */}
      <div className="opp-source-filters">
        <span className="opp-filter-section-label">
          <Globe size={13} />
          Source
        </span>
        {SOURCE_FILTERS.map(sf => (
          <button
            key={sf}
            className={`opp-filter-chip ${sourceFilter === sf ? 'active' : ''}`}
            onClick={() => setSourceFilter(sf)}
            style={sourceFilter === sf ? {
              borderColor: sf === 'College' ? '#059669' : sf === 'Unstop' ? '#DC2626' : sf === 'Devfolio' ? '#2563EB' : undefined,
              color: sf === 'College' ? '#059669' : sf === 'Unstop' ? '#DC2626' : sf === 'Devfolio' ? '#2563EB' : undefined,
            } : undefined}
          >
            {sf === 'College' && <Building2 size={12} />}
            {sf}
          </button>
        ))}
      </div>

      {/* Type Filter Chips (only when not locked to a category) */}
      {!categoryType && (
        <div className="opp-filters">
          {TYPE_FILTERS.map(f => {
            const cfg = TYPE_CONFIG[f.toLowerCase()];
            return (
              <button
                key={f}
                className={`opp-filter-chip ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
                style={filter === f && cfg ? { borderColor: cfg.stripe, color: cfg.stripe } : undefined}
              >
                {cfg && <cfg.icon size={13} />}
                {f}
              </button>
            );
          })}
        </div>
      )}

      {/* States */}
      {isLoading && (
        <div className="wf-state">
          <Loader2 size={24} className="spin" />
          <span>Loading opportunities...</span>
        </div>
      )}
      {isError && (
        <div className="wf-state wf-error">
          <AlertCircle size={20} />
          <span>Failed to load opportunities</span>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && opportunities.length === 0 && (
        <div className="opp-empty">
          <Target size={48} className="opp-empty-icon" />
          <p className="opp-empty-title">No opportunities yet</p>
          <p className="opp-empty-sub">
            {isStaffOrAdmin
              ? 'Post the first opportunity using the button above.'
              : 'Check back soon for new hackathons, events & more.'}
          </p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && !isError && opportunities.length > 0 && (
        <div className="opp-grid">
          {opportunities.map((o, idx) => {
            const cfg = TYPE_CONFIG[o.type] ?? TYPE_CONFIG.hackathon;
            const Icon = cfg.icon;
            const urgency = getDeadlineUrgency(o.deadline_iso);
            const daysLeft = getDaysLeft(o.deadline_iso);
            const srcBadge = getSourceBadge(o.source);
            const isCollege = o.source === 'manual';

            return (
              <div
                key={o.id}
                className={`opp-card ${cfg.color} ${o.applied ? 'opp-card-applied' : ''} ${isCollege ? 'opp-card-college' : ''}`}
                style={{ '--stripe-color': cfg.stripe, '--anim-delay': `${idx * 60}ms` } as React.CSSProperties}
              >
                {/* Stripe */}
                <div className="opp-card-stripe" />

                {/* College priority highlight */}
                {isCollege && (
                  <div className="opp-college-highlight">
                    <Building2 size={10} /> College Posted
                  </div>
                )}

                {/* Top row */}
                <div className="opp-card-top">
                  <div className="opp-card-top-badges">
                    <span className="opp-type-badge">
                      <Icon size={12} />
                      {cfg.label}
                    </span>
                    <span className={`opp-source-badge ${srcBadge.className}`}>
                      {srcBadge.label}
                    </span>
                  </div>
                  <div className="opp-card-top-actions">
                    {o.applied && (
                      <span className="opp-applied-pill">
                        <CheckCircle2 size={11} /> Applied
                      </span>
                    )}
                    {isStaffOrAdmin && o.source === 'manual' && (
                      <button
                        className="opp-icon-btn opp-delete-btn"
                        onClick={() => deleteMutation.mutate(o.id)}
                        disabled={deleteMutation.isPending}
                        title="Remove opportunity"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Logo + Title */}
                <div className="opp-card-title-row">
                  {o.logo_url && (
                    <img
                      src={o.logo_url}
                      alt=""
                      className="opp-card-logo"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <div>
                    <h3 className="opp-card-title">{o.title}</h3>
                    <p className="opp-card-org">
                      <Building2 size={12} />
                      {o.organization}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {o.description && (
                  <p className="opp-card-desc">{o.description}</p>
                )}

                {/* Meta chips */}
                <div className="opp-card-meta">
                  {o.deadline && (
                    <span
                      className={`opp-meta-chip opp-deadline-chip ${
                        urgency === 'danger' ? 'opp-chip-danger' :
                        urgency === 'warning' ? 'opp-chip-warning' : ''
                      }`}
                    >
                      <Clock size={11} />
                      {o.deadline}
                      {daysLeft && daysLeft !== 'Expired' && (
                        <span className="opp-days-left">· {daysLeft}</span>
                      )}
                    </span>
                  )}
                  <span className="opp-meta-chip">
                    <Eye size={11} />
                    {o.departments.join(', ')}
                  </span>
                  {o.application_count > 0 && (
                    <span className="opp-meta-chip opp-applicants-chip">
                      <Users size={11} />
                      {o.application_count} enrolled
                    </span>
                  )}
                </div>

                {/* Eligibility */}
                {o.eligibility && (
                  <p className="opp-eligibility">{o.eligibility}</p>
                )}

                {/* Actions */}
                <div className="opp-card-actions">
                  {/* Tracking Actions */}
                  {isStaffOrAdmin ? (
                    <button
                      className="btn opp-view-applicants-btn"
                      onClick={() => navigate(`/opportunities/${o.id}/applicants`)}
                    >
                      <Users size={13} />
                      Enrolled Students
                      <ChevronRight size={13} />
                    </button>
                  ) : o.applied ? (
                    <button
                      className="btn opp-withdraw-btn"
                      onClick={() => withdrawMutation.mutate(o.id)}
                      disabled={withdrawMutation.isPending || applyMutation.isPending}
                    >
                      {withdrawMutation.isPending ? <Loader2 size={13} className="spin" /> : 'Withdraw'}
                    </button>
                  ) : (
                    <button
                      className="btn opp-apply-btn"
                      onClick={() => applyMutation.mutate(o.id)}
                      disabled={applyMutation.isPending || withdrawMutation.isPending}
                    >
                      {applyMutation.isPending ? <Loader2 size={13} className="spin" /> : 'Enroll'}
                    </button>
                  )}

                  {/* External Link Action */}
                  {o.link && o.link !== '#' && (
                    <a
                      href={o.link.startsWith('http') ? o.link : `https://${o.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`btn ${o.source === 'manual' ? 'opp-link-btn' : 'opp-apply-btn'}`}
                      title={o.source === 'manual' ? "Open external link" : `View on ${srcBadge.label}`}
                      style={{ textDecoration: 'none', display: 'flex', gap: '6px' }}
                    >
                      <ExternalLink size={13} />
                      {o.source !== 'manual' && `View on ${srcBadge.label}`}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Opportunity Modal ── */}
      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="opp-create-modal" onClick={e => e.stopPropagation()}>
            <div className="opp-create-header">
              <div>
                <h3 className="opp-create-title">Post New Opportunity</h3>
                <p className="opp-create-sub">Hackathons, events, internships & more</p>
              </div>
              <button className="btn-icon" onClick={() => setShowCreate(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="opp-create-form">
              {/* Type selector (hidden when category is locked) */}
              {!categoryType && (
                <div className="opp-form-group">
                  <label className="opp-form-label">Type</label>
                  <div className="opp-type-picker">
                    {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                      <button
                        key={key}
                        type="button"
                        className={`opp-type-option ${form.type === key ? 'selected' : ''}`}
                        style={form.type === key ? { borderColor: cfg.stripe, color: cfg.stripe } : undefined}
                        onClick={() => setForm(f => ({ ...f, type: key }))}
                      >
                        <cfg.icon size={14} />
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="opp-form-row">
                <div className="opp-form-group">
                  <label className="opp-form-label">Title *</label>
                  <input
                    required
                    className="input"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. HackHustle 2026 National Hackathon"
                  />
                </div>
                <div className="opp-form-group">
                  <label className="opp-form-label">Organization *</label>
                  <input
                    required
                    className="input"
                    value={form.organization}
                    onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                    placeholder="e.g. Google, Infosys, College Name"
                  />
                </div>
              </div>

              <div className="opp-form-group">
                <label className="opp-form-label">Description</label>
                <textarea
                  className="input opp-textarea"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of the opportunity..."
                  rows={3}
                />
              </div>

              <div className="opp-form-row">
                <div className="opp-form-group">
                  <label className="opp-form-label">Registration Link</label>
                  <input
                    className="input"
                    type="url"
                    value={form.link}
                    onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="opp-form-group">
                  <label className="opp-form-label">Deadline</label>
                  <input
                    className="input"
                    type="datetime-local"
                    value={form.deadline}
                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  />
                </div>
              </div>

              <div className="opp-form-group">
                <label className="opp-form-label">Eligibility / Requirements</label>
                <input
                  className="input"
                  value={form.eligibility}
                  onChange={e => setForm(f => ({ ...f, eligibility: e.target.value }))}
                  placeholder="e.g. 2nd & 3rd year CSE/IT students, CGPA ≥ 7.5"
                />
              </div>

              <div className="opp-form-group">
                <label className="opp-form-label">Target Departments</label>
                <div className="opp-dept-grid">
                  {DEPT_OPTIONS.map(dept => (
                    <button
                      key={dept}
                      type="button"
                      className={`opp-dept-chip ${
                        dept === 'All' && form.departments.length === 0 ? 'selected' :
                        form.departments.includes(dept) ? 'selected' : ''
                      }`}
                      onClick={() => handleDeptToggle(dept)}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>

              <div className="opp-create-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn opp-submit-btn" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 size={15} className="spin" /> : <Plus size={15} />}
                  {createMutation.isPending ? 'Posting...' : 'Post Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
