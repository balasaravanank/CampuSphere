import { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, FileText, Calendar, ClipboardList, UserCheck, Award, Gift,
  Loader2, CheckCircle2, Circle, Upload, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import './ModulePage.css';
import './WorkflowsPage.css';

const TYPE_CONFIG: Record<string, { label: string; icon: any }> = {
  general_letter: { label: 'General Letter', icon: FileText },
  event_application: { label: 'Event Application', icon: Calendar },
  leave_application: { label: 'Leave Application', icon: ClipboardList },
  manual_academic_attendance: { label: 'Manual Academic Attendance', icon: UserCheck },
  manual_event_attendance: { label: 'Manual Event Attendance', icon: UserCheck },
  reward_claim: { label: 'Reward Claim', icon: Award },
  reward_redeem: { label: 'Reward Redeem', icon: Gift },
};

interface Template {
  id: number;
  name: string;
  workflow_type: string;
  steps: { step_order: number; label: string; approver_role: string }[];
}

export default function WorkflowFormPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'form' | 'workflow'>('form');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, any>>({
    title: '',
    description: '',
    subject: '',
    content: '',
    from_date: '',
    to_date: '',
    reason: '',
    event_name: '',
    venue: '',
    date: '',
    attendance_date: '',
    attendance_subject: '',
  });

  const config = TYPE_CONFIG[type || ''] || { label: type, icon: FileText };
  const TypeIcon = config.icon;

  const { data: templates } = useQuery({
    queryKey: ['workflow-templates', type],
    queryFn: () =>
      api.get(`/workflows/templates?workflow_type=${type}`).then(
        r => r.data.data as Template[]
      ),
  });

  useEffect(() => {
    if (templates && templates.length > 0 && !selectedTemplate) {
      setSelectedTemplate(templates[0].id);
    }
  }, [templates, selectedTemplate]);

  const selectedTpl = templates?.find(t => t.id === selectedTemplate);

  const submitMutation = useMutation({
    mutationFn: (body: any) => api.post('/workflows/', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Request submitted successfully!');
      navigate('/workflows');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to submit request');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) {
      toast.error('Please select an approval workflow');
      return;
    }

    let title = '';
    let payload: Record<string, any> = {};

    switch (type) {
      case 'general_letter':
        title = form.subject || 'General Letter';
        payload = { subject: form.subject, content: form.content };
        if (!form.subject.trim()) { toast.error('Subject is required'); return; }
        break;
      case 'leave_application':
        title = form.reason || 'Leave Application';
        payload = { from_date: form.from_date, to_date: form.to_date, reason: form.reason };
        if (!form.from_date || !form.to_date) { toast.error('Date range is required'); return; }
        break;
      case 'event_application':
        title = form.event_name || 'Event Application';
        payload = { event_name: form.event_name, date: form.date, venue: form.venue, description: form.description };
        if (!form.event_name.trim()) { toast.error('Event name is required'); return; }
        break;
      case 'manual_academic_attendance':
        title = form.attendance_subject || 'Attendance Correction';
        payload = { date: form.attendance_date, subject: form.attendance_subject, reason: form.reason };
        if (!form.attendance_date) { toast.error('Date is required'); return; }
        break;
      case 'manual_event_attendance':
        title = form.event_name || 'Event Attendance';
        payload = { event_name: form.event_name, date: form.date, reason: form.reason };
        if (!form.event_name.trim()) { toast.error('Event name is required'); return; }
        break;
      case 'reward_claim':
      case 'reward_redeem':
        title = form.title || (type === 'reward_claim' ? 'Reward Claim' : 'Reward Redeem');
        payload = { title: form.title, description: form.description };
        if (!form.title.trim()) { toast.error('Title is required'); return; }
        break;
      default:
        title = form.title || 'Request';
        payload = { ...form };
    }

    submitMutation.mutate({
      type,
      template_id: selectedTemplate,
      title,
      description: form.description || null,
      payload,
    });
  };

  const updateField = (field: string, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="module-page">
      {/* Header */}
      <div className="wf-form-header">
        <div className="wf-form-header-left">
          <TypeIcon size={22} className="wf-form-icon" />
          <div>
            <h2>{config.label}</h2>
            <p className="wf-subtitle">Draft, submit, and track your approval workflow.</p>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/workflows')}>
          <ArrowLeft size={14} /> Back to Requests
        </button>
      </div>

      {/* Tabs */}
      <div className="wf-tabs">
        <button
          className={`wf-tab ${activeTab === 'form' ? 'wf-tab-active' : ''}`}
          onClick={() => setActiveTab('form')}
        >
          {config.label}
        </button>
        <button
          className={`wf-tab ${activeTab === 'workflow' ? 'wf-tab-active' : ''}`}
          onClick={() => setActiveTab('workflow')}
        >
          Approval Workflow
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Form Tab */}
        {activeTab === 'form' && (
          <div className="card wf-form-card">
            {type === 'general_letter' && (
              <>
                <div className="wf-form-row">
                  <div className="form-group wf-form-field-grow">
                    <label className="form-label">Subject <span className="wf-required">*</span></label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Enter subject of your letter"
                      value={form.subject}
                      onChange={e => updateField('subject', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Content <span className="wf-required">*</span></label>
                  <textarea
                    className="form-textarea wf-rich-textarea"
                    rows={10}
                    placeholder="Write your letter content here..."
                    value={form.content}
                    onChange={e => updateField('content', e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {type === 'leave_application' && (
              <>
                <div className="wf-form-row">
                  <div className="form-group">
                    <label className="form-label">From Date <span className="wf-required">*</span></label>
                    <input
                      className="form-input"
                      type="date"
                      value={form.from_date}
                      onChange={e => updateField('from_date', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">To Date <span className="wf-required">*</span></label>
                    <input
                      className="form-input"
                      type="date"
                      value={form.to_date}
                      onChange={e => updateField('to_date', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason <span className="wf-required">*</span></label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder="Explain the reason for your leave..."
                    value={form.reason}
                    onChange={e => updateField('reason', e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {type === 'event_application' && (
              <>
                <div className="wf-form-row">
                  <div className="form-group wf-form-field-grow">
                    <label className="form-label">Event Name <span className="wf-required">*</span></label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. 5G Hackathon at IIT Madras"
                      value={form.event_name}
                      onChange={e => updateField('event_name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      className="form-input"
                      type="date"
                      value={form.date}
                      onChange={e => updateField('date', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Venue</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Event venue"
                    value={form.venue}
                    onChange={e => updateField('venue', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder="Additional details about the event..."
                    value={form.description}
                    onChange={e => updateField('description', e.target.value)}
                  />
                </div>
              </>
            )}

            {(type === 'manual_academic_attendance') && (
              <>
                <div className="wf-form-row">
                  <div className="form-group">
                    <label className="form-label">Date <span className="wf-required">*</span></label>
                    <input
                      className="form-input"
                      type="date"
                      value={form.attendance_date}
                      onChange={e => updateField('attendance_date', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group wf-form-field-grow">
                    <label className="form-label">Subject <span className="wf-required">*</span></label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Subject name"
                      value={form.attendance_subject}
                      onChange={e => updateField('attendance_subject', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason <span className="wf-required">*</span></label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder="Explain why manual attendance is needed..."
                    value={form.reason}
                    onChange={e => updateField('reason', e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {type === 'manual_event_attendance' && (
              <>
                <div className="wf-form-row">
                  <div className="form-group wf-form-field-grow">
                    <label className="form-label">Event Name <span className="wf-required">*</span></label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Event name"
                      value={form.event_name}
                      onChange={e => updateField('event_name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date <span className="wf-required">*</span></label>
                    <input
                      className="form-input"
                      type="date"
                      value={form.date}
                      onChange={e => updateField('date', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder="Reason for manual event attendance..."
                    value={form.reason}
                    onChange={e => updateField('reason', e.target.value)}
                  />
                </div>
              </>
            )}

            {(type === 'reward_claim' || type === 'reward_redeem') && (
              <>
                <div className="form-group">
                  <label className="form-label">Title <span className="wf-required">*</span></label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder={type === 'reward_claim' ? 'What reward are you claiming?' : 'What reward to redeem?'}
                    value={form.title}
                    onChange={e => updateField('title', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder="Additional details..."
                    value={form.description}
                    onChange={e => updateField('description', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Attachments (shared) */}
            <div className="form-group wf-attachments">
              <label className="form-label">Attachments</label>
              <div className="wf-file-upload">
                <Upload size={18} />
                <span>Choose files or drag & drop</span>
                <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                  Attach supporting documents (optional)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Approval Workflow Tab */}
        {activeTab === 'workflow' && (
          <div className="card wf-form-card">
            <div className="form-group">
              <label className="form-label">Approval Workflow <span className="wf-required">*</span></label>
              <select
                className="form-select"
                value={selectedTemplate ?? ''}
                onChange={e => setSelectedTemplate(Number(e.target.value))}
              >
                <option value="">— Select workflow —</option>
                {templates?.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Approval Chain Preview */}
            {selectedTpl && (
              <div className="wf-chain-preview">
                <h4 className="wf-chain-title">Approval Chain</h4>
                <div className="wf-stepper">
                  {/* Student (submitter) */}
                  <div className="wf-step">
                    <div className="wf-step-dot wf-step-active">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="wf-step-info">
                      <span className="wf-step-label">Student</span>
                      <span className="wf-step-role">Submitter</span>
                    </div>
                  </div>
                  <div className="wf-step-line" />
                  {selectedTpl.steps.map((step, i) => (
                    <Fragment key={step.step_order}>
                      <div className="wf-step">
                        <div className="wf-step-dot wf-step-pending">
                          <Circle size={18} />
                        </div>
                        <div className="wf-step-info">
                          <span className="wf-step-label">{step.label}</span>
                          <span className="wf-step-role">{step.approver_role}</span>
                        </div>
                      </div>
                      {i < selectedTpl.steps.length - 1 && <div className="wf-step-line" />}
                    </Fragment>
                  ))}
                </div>
              </div>
            )}

            {(!templates || templates.length === 0) && (
              <div className="wf-no-templates">
                <p>No approval workflows configured for this type yet.</p>
                <p className="text-secondary">Ask your admin to create one.</p>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="wf-form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/workflows')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitMutation.isPending || !selectedTemplate}
          >
            {submitMutation.isPending ? (
              <><Loader2 size={14} className="spin" /> Submitting...</>
            ) : (
              'Submit Request'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
