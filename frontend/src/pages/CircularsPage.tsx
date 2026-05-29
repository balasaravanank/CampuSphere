import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Filter, Pin, Clock, Loader2, AlertCircle, CheckCheck,
  LayoutGrid, List, Plus, X, Eye, Trash2, Edit3, Bell, BellOff,
  FileText, AlertTriangle, Info, ArrowDown, User, Calendar, Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import './ModulePage.css';
import './CircularsPage.css';

// ── Types ────────────────────────────────────────────────────

interface DeadlineInfo {
  text: string;
  days: number;
  hours: number;
  expired: boolean;
}

interface CircularItem {
  id: number;
  title: string;
  summary: string;
  content?: string;
  priority: string;
  pinned: boolean;
  date: string;
  date_formatted: string;
  created_at: string;
  deadline: DeadlineInfo | null;
  deadline_raw: string | null;
  read: boolean;
  author_name: string;
  read_count: number;
  role_targets: string[];
  department_targets: string[];
  attachment_urls: string[];
}

interface CircularsResponse {
  circulars: CircularItem[];
  stats: {
    total: number;
    unread: number;
    urgent: number;
    deadlines_today: number;
  };
  departments: string[];
}

// ── Constants ────────────────────────────────────────────────

const PRIORITIES = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'action_required', label: 'Action Required' },
  { value: 'informational', label: 'Info' },
  { value: 'low_priority', label: 'Low Priority' },
];

const PRIORITY_CONFIG: Record<string, { label: string; icon: any }> = {
  urgent: { label: 'URGENT', icon: AlertTriangle },
  action_required: { label: 'ACTION REQUIRED', icon: AlertCircle },
  informational: { label: 'INFO', icon: Info },
  low_priority: { label: 'LOW', icon: ArrowDown },
};

const READ_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

const DEPARTMENTS = [
  'AI & DS', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'MBA',
  'Biomedical', 'Chemical', 'Aeronautical',
];

const ROLES = ['student', 'staff', 'admin'];

// ── Skeleton Component ───────────────────────────────────────

function CircularSkeleton() {
  return (
    <div className="circ-skeleton-grid">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="circ-skeleton-card">
          <div className="skeleton circ-skeleton-bar" style={{ width: '40%', height: 14 }} />
          <div className="skeleton circ-skeleton-bar" style={{ width: '90%', height: 18 }} />
          <div className="skeleton circ-skeleton-bar" style={{ width: '100%', height: 14 }} />
          <div className="skeleton circ-skeleton-bar" style={{ width: '75%', height: 14 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <div className="skeleton circ-skeleton-bar" style={{ width: '30%', height: 12 }} />
            <div className="skeleton circ-skeleton-bar" style={{ width: '20%', height: 12 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Detail Modal (Removed) ─────────────────────────

// ── Create/Edit Modal ────────────────────────────────────────

function CircularFormModal({
  editing,
  onClose,
  onSuccess,
}: {
  editing: CircularItem | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(editing?.title || '');
  const [content, setContent] = useState(editing?.content || editing?.summary || '');
  const [priority, setPriority] = useState(editing?.priority || 'informational');
  const [deadline, setDeadline] = useState(editing?.deadline_raw?.split('T')[0] || '');
  const [pinned, setPinned] = useState(editing?.pinned || false);
  const [deptTargets, setDeptTargets] = useState<string[]>(editing?.department_targets || []);
  const [roleTargets, setRoleTargets] = useState<string[]>(editing?.role_targets || []);

  const mutation = useMutation({
    mutationFn: (payload: any) =>
      editing
        ? api.put(`/circulars/${editing.id}`, payload)
        : api.post('/circulars/', payload),
    onSuccess: () => {
      toast.success(editing ? 'Circular updated' : 'Circular created');
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to save circular');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    mutation.mutate({
      title: title.trim(),
      content: content.trim(),
      priority,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      pinned,
      department_targets: deptTargets.length > 0 ? deptTargets : null,
      role_targets: roleTargets.length > 0 ? roleTargets : null,
    });
  };

  const toggleDept = (d: string) =>
    setDeptTargets(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  const toggleRole = (r: string) =>
    setRoleTargets(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="circ-create-overlay" onClick={onClose}>
      <div className="circ-create-modal" onClick={e => e.stopPropagation()}>
        <div className="circ-create-header">
          <h3>{editing ? 'Edit Circular' : 'New Circular'}</h3>
          <button className="circ-detail-close" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="circ-create-body">
            {/* Title */}
            <div className="circ-form-group">
              <label className="circ-form-label">Title</label>
              <input
                className="input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter circular title..."
                required
              />
            </div>

            {/* Content */}
            <div className="circ-form-group">
              <label className="circ-form-label">Content</label>
              <textarea
                className="input circ-form-textarea"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write the circular content..."
                required
              />
            </div>

            {/* Priority */}
            <div className="circ-form-group">
              <label className="circ-form-label">Priority</label>
              <div className="circ-priority-pills">
                {['urgent', 'action_required', 'informational', 'low_priority'].map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`circ-priority-pill ${p} ${priority === p ? 'selected' : ''}`}
                    onClick={() => setPriority(p)}
                  >
                    {PRIORITY_CONFIG[p].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Deadline */}
            <div className="circ-form-group">
              <label className="circ-form-label">Deadline (optional)</label>
              <input
                type="date"
                className="input"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
            </div>

            {/* Department Targets */}
            <div className="circ-form-group">
              <label className="circ-form-label">Target Departments (leave empty for all)</label>
              <div className="circ-multi-select">
                {DEPARTMENTS.map(d => (
                  <button
                    key={d}
                    type="button"
                    className={`circ-chip-toggle ${deptTargets.includes(d) ? 'selected' : ''}`}
                    onClick={() => toggleDept(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Role Targets */}
            <div className="circ-form-group">
              <label className="circ-form-label">Target Roles (leave empty for all)</label>
              <div className="circ-multi-select">
                {ROLES.map(r => (
                  <button
                    key={r}
                    type="button"
                    className={`circ-chip-toggle ${roleTargets.includes(r) ? 'selected' : ''}`}
                    onClick={() => toggleRole(r)}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Pinned Toggle */}
            <div className="circ-pin-toggle" onClick={() => setPinned(!pinned)}>
              <div className={`circ-pin-switch ${pinned ? 'active' : ''}`} />
              <span className="circ-form-label" style={{ margin: 0 }}>
                <Pin size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Pin to top
              </span>
            </div>
          </div>

          <div className="circ-create-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="circ-submit-btn"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? <Loader2 size={16} className="spin" />
                : editing ? 'Update Circular' : 'Publish Circular'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────

export default function CircularsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStaff = user?.role === 'staff' || user?.role === 'admin';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [priority, setPriority] = useState('all');
  const [readStatus, setReadStatus] = useState('all');
  const [department, setDepartment] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCircular, setEditingCircular] = useState<CircularItem | null>(null);

  // Query
  const { data, isLoading, isError } = useQuery({
    queryKey: ['circulars', priority, searchQuery, department, fromDate, toDate, readStatus],
    queryFn: () => {
      const params = new URLSearchParams();
      if (priority !== 'all') params.set('priority', priority);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (department !== 'all') params.set('department', department);
      if (fromDate) params.set('from_date', fromDate);
      if (toDate) params.set('to_date', toDate);
      if (readStatus !== 'all') params.set('read_status', readStatus);
      return api.get(`/circulars/?${params}`).then(r => r.data.data as CircularsResponse);
    },
  });

  const circulars = data?.circulars ?? [];
  const stats = data?.stats ?? { total: 0, unread: 0, urgent: 0, deadlines_today: 0 };
  const availableDepartments = data?.departments ?? [];

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.post(`/circulars/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['circulars'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post('/circulars/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circulars'] });
      toast.success('All circulars marked as read');
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: (id: number) => api.post(`/circulars/${id}/toggle-pin`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circulars'] });
      toast.success('Pin status updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/circulars/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circulars'] });
      toast.success('Circular deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to delete');
    },
  });

  const handleMarkRead = useCallback((id: number) => {
    markReadMutation.mutate(id);
  }, [markReadMutation]);

  const handleDelete = useCallback((id: number) => {
    if (confirm('Are you sure you want to delete this circular?')) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const handleEdit = useCallback((circular: CircularItem) => {
    setEditingCircular(circular);
  }, []);

  const hasActiveFilters = priority !== 'all' || searchQuery.trim() !== '' ||
    department !== 'all' || fromDate !== '' || toDate !== '' || readStatus !== 'all';

  const resetFilters = () => {
    setPriority('all');
    setSearchQuery('');
    setDepartment('all');
    setFromDate('');
    setToDate('');
    setReadStatus('all');
  };

  // Active filter chips
  const activeFilterChips = useMemo(() => {
    const chips: { label: string; onRemove: () => void }[] = [];
    if (priority !== 'all') {
      chips.push({ label: `Priority: ${PRIORITIES.find(p => p.value === priority)?.label}`, onRemove: () => setPriority('all') });
    }
    if (searchQuery.trim()) {
      chips.push({ label: `Search: "${searchQuery}"`, onRemove: () => setSearchQuery('') });
    }
    if (department !== 'all') {
      chips.push({ label: `Dept: ${department}`, onRemove: () => setDepartment('all') });
    }
    if (readStatus !== 'all') {
      chips.push({ label: `Status: ${readStatus}`, onRemove: () => setReadStatus('all') });
    }
    if (fromDate) {
      chips.push({ label: `From: ${fromDate}`, onRemove: () => setFromDate('') });
    }
    if (toDate) {
      chips.push({ label: `To: ${toDate}`, onRemove: () => setToDate('') });
    }
    return chips;
  }, [priority, searchQuery, department, readStatus, fromDate, toDate]);

  return (
    <div className="module-page">
      {/* ── Header ───────────────────────────────── */}
      <div className="circulars-header">
        <div className="circulars-header-left">
          <h2>Circulars & Announcements</h2>
          <p>Stay updated with campus notices, deadlines, and announcements</p>
        </div>
        <div className="circulars-header-actions">
          {stats.unread > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              {markAllReadMutation.isPending
                ? <Loader2 size={14} className="spin" />
                : <><BellOff size={14} /> Mark All Read</>}
            </button>
          )}
          {isStaff && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowCreateModal(true)}
              style={{
                background: 'linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                border: 'none',
              }}
            >
              <Plus size={15} /> New Circular
            </button>
          )}
        </div>
      </div>

      {/* ── Stats ────────────────────────────────── */}
      <div className="circulars-stats">
        <div className="circ-stat-card stat-total">
          <div className="circ-stat-icon"><FileText size={20} /></div>
          <div className="circ-stat-content">
            <span className="circ-stat-value">{stats.total}</span>
            <span className="circ-stat-label">Total Circulars</span>
          </div>
        </div>
        <div className="circ-stat-card stat-unread">
          <div className="circ-stat-icon"><Bell size={20} /></div>
          <div className="circ-stat-content">
            <span className="circ-stat-value">{stats.unread}</span>
            <span className="circ-stat-label">Unread</span>
          </div>
        </div>
        <div className="circ-stat-card stat-urgent">
          <div className="circ-stat-icon"><AlertTriangle size={20} /></div>
          <div className="circ-stat-content">
            <span className="circ-stat-value">{stats.urgent}</span>
            <span className="circ-stat-label">Urgent</span>
          </div>
        </div>
        <div className="circ-stat-card stat-deadline">
          <div className="circ-stat-icon"><Clock size={20} /></div>
          <div className="circ-stat-content">
            <span className="circ-stat-value">{stats.deadlines_today}</span>
            <span className="circ-stat-label">Deadlines Today</span>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ───────────────────────────── */}
      <div className="circulars-filter-bar">
        {/* Search */}
        <div className="circ-filter-group search-group">
          <span className="circ-filter-label">Search</span>
          <div className="circ-search-wrapper">
            <Search size={15} />
            <input
              type="text"
              className="input"
              placeholder="Search by title or content..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Priority */}
        <div className="circ-filter-group">
          <span className="circ-filter-label">Priority</span>
          <select
            className="circ-filter-select"
            value={priority}
            onChange={e => setPriority(e.target.value)}
          >
            {PRIORITIES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Read Status */}
        <div className="circ-filter-group">
          <span className="circ-filter-label">Status</span>
          <select
            className="circ-filter-select"
            value={readStatus}
            onChange={e => setReadStatus(e.target.value)}
          >
            {READ_STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Department */}
        <div className="circ-filter-group">
          <span className="circ-filter-label">Department</span>
          <select
            className="circ-filter-select"
            value={department}
            onChange={e => setDepartment(e.target.value)}
          >
            <option value="all">All Departments</option>
            {[...new Set([...availableDepartments, ...DEPARTMENTS])].sort().map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="circ-filter-group">
          <span className="circ-filter-label">From Date</span>
          <input
            type="date"
            className="input"
            style={{ fontSize: '0.8125rem', padding: '9px 12px' }}
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
        </div>

        <div className="circ-filter-group">
          <span className="circ-filter-label">To Date</span>
          <input
            type="date"
            className="input"
            style={{ fontSize: '0.8125rem', padding: '9px 12px' }}
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
        </div>

        {/* Active chips + reset */}
        {hasActiveFilters && (
          <div className="circ-filter-reset-row">
            <div className="circ-filter-chips">
              {activeFilterChips.map((chip, i) => (
                <button
                  key={i}
                  className="circ-filter-chip"
                  onClick={chip.onRemove}
                >
                  {chip.label} <X size={10} />
                </button>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={resetFilters}>
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* ── Toolbar ──────────────────────────────── */}
      <div className="circ-toolbar">
        <span className="circ-results-count">
          {circulars.length} circular{circulars.length !== 1 ? 's' : ''}
          {hasActiveFilters && ' (filtered)'}
        </span>
        <div className="circ-view-toggle">
          <button
            className={`circ-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            className={`circ-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* ── Content ──────────────────────────────── */}

      {isLoading && <CircularSkeleton />}

      {isError && (
        <div className="wf-state wf-error">
          <AlertCircle size={20} />
          <span>Failed to load circulars. Please try again.</span>
        </div>
      )}

      {!isLoading && !isError && circulars.length === 0 && (
        <div className="circ-empty-state">
          <div className="circ-empty-icon">
            <FileText size={32} />
          </div>
          <h3>{hasActiveFilters ? 'No circulars match your filters' : 'All caught up! 🎉'}</h3>
          <p>
            {hasActiveFilters
              ? 'Try adjusting your filters or search query to find what you\'re looking for.'
              : 'There are no circulars to display right now. Check back later!'}
          </p>
          {hasActiveFilters && (
            <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Grid View */}
      {!isLoading && !isError && circulars.length > 0 && viewMode === 'grid' && (
        <div className="circulars-grid">
          {circulars.map(c => {
            const pc = PRIORITY_CONFIG[c.priority];
            return (
              <div
                key={c.id}
                className={`circ-card priority-${c.priority} ${c.pinned ? 'is-pinned' : ''} ${c.read ? 'is-read' : ''}`}
                onClick={() => navigate(`/circulars/${c.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') navigate(`/circulars/${c.id}`); }}
              >
                {/* Header */}
                <div className="circ-card-header">
                  <div className="circ-card-badges">
                    {pc && (
                      <span className={`circ-priority-badge ${c.priority}`}>
                        <pc.icon size={10} /> {pc.label}
                      </span>
                    )}
                    {c.pinned && (
                      <span className="circ-pin-badge"><Pin size={11} /></span>
                    )}
                  </div>
                  <span className="circ-card-date">{c.date}</span>
                </div>

                {/* Title */}
                <h4 className={`circ-card-title ${!c.read ? 'unread' : ''}`}>
                  {c.title}
                </h4>

                {/* Summary */}
                <p className="circ-card-summary">{c.summary}</p>

                {/* Deadline */}
                {c.deadline && (
                  <div>
                    <span className={`circ-deadline-tag ${c.deadline.expired ? 'expired' : ''} ${!c.deadline.expired && c.deadline.days === 0 ? 'urgent-deadline' : ''}`}>
                      <Clock size={11} /> {c.deadline.text}
                    </span>
                  </div>
                )}

                {/* Footer */}
                <div className="circ-card-footer">
                  <span className="circ-card-author">
                    <User size={12} /> {c.author_name}
                  </span>
                  <div className="circ-card-meta">
                    {c.read && (
                      <span className="circ-card-read-indicator">
                        <CheckCheck size={14} />
                      </span>
                    )}
                    <span className="circ-card-date">{c.date_formatted}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {!isLoading && !isError && circulars.length > 0 && viewMode === 'list' && (
        <div className="circulars-list-view">
          {circulars.map(c => {
            const pc = PRIORITY_CONFIG[c.priority];
            return (
              <div
                key={c.id}
                className={`circ-list-item priority-${c.priority} ${c.read ? 'is-read' : ''}`}
                onClick={() => navigate(`/circulars/${c.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') navigate(`/circulars/${c.id}`); }}
              >
                {pc && (
                  <span className={`circ-priority-badge ${c.priority}`}>
                    <pc.icon size={10} />
                  </span>
                )}

                <div className="circ-list-content">
                  <div className="circ-list-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {c.pinned && <Pin size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                    <span className={!c.read ? 'unread' : ''}>{c.title}</span>
                  </div>
                  <div className="circ-list-sub">
                    <span>{c.author_name}</span>
                    <span>•</span>
                    <span>{c.date}</span>
                    {c.deadline && !c.deadline.expired && (
                      <>
                        <span>•</span>
                        <span style={{ color: c.deadline.days === 0 ? 'var(--danger)' : 'var(--warning)', fontWeight: 600 }}>
                          <Clock size={10} style={{ verticalAlign: 'middle' }} /> {c.deadline.text}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="circ-list-right">
                  {c.read ? (
                    <CheckCheck size={14} style={{ color: 'var(--success)' }} />
                  ) : (
                    <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>New</span>
                  )}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{c.date_formatted}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create/Edit Modal ────────────────────── */}
      {(showCreateModal || editingCircular) && (
        <CircularFormModal
          editing={editingCircular}
          onClose={() => { setShowCreateModal(false); setEditingCircular(null); }}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['circulars'] })}
        />
      )}
    </div>
  );
}
