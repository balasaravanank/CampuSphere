import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pin, Clock, Loader2, AlertCircle, CheckCheck } from 'lucide-react';
import api from '../lib/api';
import './ModulePage.css';

const PRIORITIES = ['all', 'urgent', 'action_required', 'informational', 'low_priority'];
const PRIORITY_LABELS: Record<string, { label: string; badge: string }> = {
  urgent: { label: 'URGENT', badge: 'badge-danger' },
  action_required: { label: 'ACTION REQUIRED', badge: 'badge-warning' },
  informational: { label: 'INFO', badge: 'badge-primary' },
  low_priority: { label: 'LOW', badge: 'badge-success' },
};
const FILTER_DISPLAY: Record<string, string> = {
  all: 'All',
  urgent: 'Urgent',
  action_required: 'Action Required',
  informational: 'Info',
  low_priority: 'Low Priority',
};

interface CircularItem {
  id: number;
  title: string;
  summary: string;
  priority: string;
  pinned: boolean;
  date: string;
  deadline: string | null;
  read: boolean;
}

export default function CircularsPage() {
  const queryClient = useQueryClient();
  const [priority, setPriority] = useState('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['circulars', priority],
    queryFn: () =>
      api.get('/circulars/', { params: priority !== 'all' ? { priority } : {} })
         .then(r => r.data.data as CircularItem[]),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.post(`/circulars/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circulars'] });
    },
  });

  const circulars = data ?? [];

  return (
    <div className="module-page">
      <div className="module-header">
        <h2>Circulars &amp; Announcements</h2>
        <span className="badge badge-primary">
          {circulars.filter(c => !c.read).length} unread
        </span>
      </div>

      {/* Priority filter tabs */}
      <div className="workflow-types">
        {PRIORITIES.map(p => (
          <button
            key={p}
            className={`btn btn-sm ${priority === p ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPriority(p)}
          >
            {FILTER_DISPLAY[p]}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="wf-state"><Loader2 size={24} className="spin" /><span>Loading circulars...</span></div>
      )}
      {isError && (
        <div className="wf-state wf-error"><AlertCircle size={20} /><span>Failed to load circulars</span></div>
      )}

      {!isLoading && !isError && (
        <div className="circulars-list">
          {circulars.length === 0 && (
            <div className="wf-state"><span>No circulars found for this filter.</span></div>
          )}
          {circulars.map(c => {
            const pl = PRIORITY_LABELS[c.priority];
            return (
              <div
                key={c.id}
                className={`card card-compact circular-card ${c.pinned ? 'circular-pinned' : ''} ${c.read ? 'circular-read' : ''}`}
                onClick={() => { if (!c.read) markReadMutation.mutate(c.id); }}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' && !c.read) markReadMutation.mutate(c.id); }}
              >
                <div className="circular-top">
                  <div className="circular-meta">
                    {c.pinned && <Pin size={14} className="circular-pin-icon" />}
                    {pl && (
                      <span className={`badge ${pl.badge}`}>{pl.label}</span>
                    )}
                    {c.deadline && (
                      <span className="badge badge-warning"><Clock size={12} /> {c.deadline}</span>
                    )}
                    {c.read && <CheckCheck size={14} className="circular-read-icon" />}
                  </div>
                  <span className="circular-date">{c.date}</span>
                </div>
                <h4 className={`circular-title ${!c.read ? 'circular-unread-title' : ''}`}>{c.title}</h4>
                <p className="circular-summary">{c.summary}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
