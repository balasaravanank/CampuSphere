import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Trash2, GripVertical, Loader2, X, Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import './ModulePage.css';
import './WorkflowsPage.css';

const WORKFLOW_TYPES = [
  { value: 'general_letter', label: 'General Letter' },
  { value: 'event_application', label: 'Event Application' },
  { value: 'leave_application', label: 'Leave Application' },
  { value: 'manual_academic_attendance', label: 'Manual Academic Attendance' },
  { value: 'manual_event_attendance', label: 'Manual Event Attendance' },
  { value: 'reward_claim', label: 'Reward Claim' },
  { value: 'reward_redeem', label: 'Reward Redeem' },
];

const ROLE_OPTIONS = [
  { value: 'staff', label: 'Staff (Mentor / HOD)' },
  { value: 'admin', label: 'Admin (SCOFT / Director)' },
];

interface TemplateStep {
  step_order: number;
  label: string;
  approver_role: string;
}

interface Template {
  id: number;
  name: string;
  workflow_type: string;
  description: string | null;
  steps: TemplateStep[];
  applicable_roles: string[];
  is_active: boolean;
}

export default function AdminWorkflowTemplatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    workflow_type: 'general_letter',
    description: '',
    applicable_roles: ['student'] as string[],
    steps: [
      { step_order: 1, label: 'Mentor', approver_role: 'staff' },
    ] as TemplateStep[],
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['admin-workflow-templates'],
    queryFn: () => api.get('/workflows/templates').then(r => r.data.data as Template[]),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/workflows/templates', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workflow-templates'] });
      toast.success('Template created!');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) =>
      api.patch(`/workflows/templates/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workflow-templates'] });
      toast.success('Template updated!');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/workflows/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workflow-templates'] });
      toast.success('Template deactivated');
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({
      name: '',
      workflow_type: 'general_letter',
      description: '',
      applicable_roles: ['student'],
      steps: [{ step_order: 1, label: 'Mentor', approver_role: 'staff' }],
    });
  };

  const openEdit = (t: Template) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      workflow_type: t.workflow_type,
      description: t.description || '',
      applicable_roles: t.applicable_roles,
      steps: t.steps.length > 0 ? t.steps : [{ step_order: 1, label: 'Mentor', approver_role: 'staff' }],
    });
    setShowModal(true);
  };

  const addStep = () => {
    setForm(f => ({
      ...f,
      steps: [
        ...f.steps,
        { step_order: f.steps.length + 1, label: '', approver_role: 'staff' },
      ],
    }));
  };

  const removeStep = (idx: number) => {
    setForm(f => ({
      ...f,
      steps: f.steps
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, step_order: i + 1 })),
    }));
  };

  const updateStep = (idx: number, field: string, value: string) => {
    setForm(f => ({
      ...f,
      steps: f.steps.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
  };

  const toggleRole = (role: string) => {
    setForm(f => ({
      ...f,
      applicable_roles: f.applicable_roles.includes(role)
        ? f.applicable_roles.filter(r => r !== role)
        : [...f.applicable_roles, role],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (form.steps.some(s => !s.label.trim())) { toast.error('All step labels are required'); return; }

    const body = {
      name: form.name,
      workflow_type: form.workflow_type,
      description: form.description || null,
      applicable_roles: form.applicable_roles,
      steps: form.steps,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, body });
    } else {
      createMutation.mutate(body);
    }
  };

  const groupedTemplates = (templates || []).reduce<Record<string, Template[]>>((acc, t) => {
    if (!acc[t.workflow_type]) acc[t.workflow_type] = [];
    acc[t.workflow_type].push(t);
    return acc;
  }, {});

  return (
    <div className="module-page">
      <div className="module-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2>Workflow Templates</h2>
            <p className="wf-subtitle">Configure approval chains for each request type.</p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <Plus size={14} /> New Template
        </button>
      </div>

      {isLoading && (
        <div className="wf-state"><Loader2 size={24} className="spin" /> Loading...</div>
      )}

      {!isLoading && (!templates || templates.length === 0) && (
        <div className="wf-empty-state card">
          <h3>No templates configured</h3>
          <p>Create your first approval workflow template to get started.</p>
        </div>
      )}

      {!isLoading && templates && templates.length > 0 && (
        <div className="wf-categories">
          {Object.entries(groupedTemplates).map(([type, tpls]) => {
            const typeLabel = WORKFLOW_TYPES.find(w => w.value === type)?.label || type;
            return (
              <div key={type} className="wf-category">
                <h3 className="wf-category-title">{typeLabel}</h3>
                <div className="wf-template-list">
                  {tpls.map(t => (
                    <div key={t.id} className="card wf-template-card">
                      <div className="wf-template-card-header">
                        <div>
                          <h4 className="wf-template-card-name">{t.name}</h4>
                          {t.description && (
                            <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: 2 }}>
                              {t.description}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => openEdit(t)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => deleteMutation.mutate(t.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="wf-template-chain">
                        <span className="wf-template-chain-badge">Student</span>
                        {t.steps.map((s, i) => (
                          <span key={i}>
                            <span className="wf-template-chain-arrow">→</span>
                            <span className="wf-template-chain-badge">{s.label}</span>
                          </span>
                        ))}
                      </div>
                      <div className="wf-template-meta">
                        <span>Applies to: {t.applicable_roles.join(', ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal wf-template-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Template' : 'New Workflow Template'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            <form className="modal-body" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Template Name <span className="wf-required">*</span></label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. General Letter Students"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="wf-form-row">
                <div className="form-group">
                  <label className="form-label">Request Type</label>
                  <select
                    className="form-select"
                    value={form.workflow_type}
                    onChange={e => setForm(f => ({ ...f, workflow_type: e.target.value }))}
                  >
                    {WORKFLOW_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Applicable to</label>
                  <div className="wf-role-checks">
                    {['student', 'staff'].map(r => (
                      <label key={r} className="wf-checkbox-label">
                        <input
                          type="checkbox"
                          checked={form.applicable_roles.includes(r)}
                          onChange={() => toggleRole(r)}
                        />
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Brief description (optional)"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              {/* Steps Builder */}
              <div className="wf-steps-builder">
                <div className="wf-steps-header">
                  <label className="form-label">Approval Steps</label>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addStep}>
                    <Plus size={14} /> Add Step
                  </button>
                </div>
                {form.steps.map((step, idx) => (
                  <div key={idx} className="wf-step-builder-row">
                    <span className="wf-step-order">
                      <GripVertical size={14} /> {idx + 1}
                    </span>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Mentor, HOD, SCOFT Admin"
                      value={step.label}
                      onChange={e => updateStep(idx, 'label', e.target.value)}
                      required
                    />
                    <select
                      className="form-select"
                      value={step.approver_role}
                      onChange={e => updateStep(idx, 'approver_role', e.target.value)}
                    >
                      {ROLE_OPTIONS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    {form.steps.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => removeStep(idx)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div className="wf-template-preview">
                <span className="form-label">Preview</span>
                <div className="wf-template-chain" style={{ marginTop: 6 }}>
                  <span className="wf-template-chain-badge">Student</span>
                  {form.steps.map((s, i) => (
                    <span key={i}>
                      <span className="wf-template-chain-arrow">→</span>
                      <span className="wf-template-chain-badge">
                        {s.label || `Step ${i + 1}`}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending)
                    ? <><Loader2 size={14} className="spin" /> Saving...</>
                    : (editingId ? 'Update Template' : 'Create Template')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
