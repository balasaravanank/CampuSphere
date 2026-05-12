import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import './ModulePage.css';
import './AssignmentsPage.css';

const COLUMNS = [
  { key: 'to_do', label: 'To Do', color: 'var(--text-secondary)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--accent)' },
  { key: 'submitted', label: 'Submitted', color: 'var(--success)' },
  { key: 'graded', label: 'Graded', color: 'var(--brand-primary)' },
];

// Status transitions that students are allowed to make
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  to_do: ['in_progress'],
  in_progress: ['to_do', 'submitted'],
  submitted: ['in_progress'],
  graded: [], // read-only
};

interface AssignmentItem {
  id: number;
  title: string;
  subject: string;
  due: string;
  max_marks: number;
  status: string;
  marks: string | null;
  submission_id: number | null;
}

export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const dragItemId = useRef<number | null>(null);
  const dragFromCol = useRef<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => api.get('/assignments/').then(r => r.data.data as AssignmentItem[]),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/assignments/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (err: any) => {
      // Roll back optimistic update by re-fetching
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.error(err.response?.data?.detail || 'Cannot move this card');
    },
  });

  const assignments = data ?? [];

  // ── Drag handlers ──────────────────────────────────────────────────
  const onDragStart = (e: React.DragEvent, id: number, fromCol: string) => {
    dragItemId.current = id;
    dragFromCol.current = fromCol;
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colKey);
  };

  const onDrop = (e: React.DragEvent, toCol: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const id = dragItemId.current;
    const fromCol = dragFromCol.current;
    if (!id || !fromCol || fromCol === toCol) return;

    const allowed = ALLOWED_TRANSITIONS[fromCol] ?? [];
    if (!allowed.includes(toCol)) {
      toast.error(`Cannot move from "${fromCol}" to "${toCol}"`);
      return;
    }

    // Optimistic: update local cache immediately
    queryClient.setQueryData(['assignments'], (old: AssignmentItem[] | undefined) =>
      old?.map(a => a.id === id ? { ...a, status: toCol } : a)
    );
    statusMutation.mutate({ id, status: toCol });
  };

  const onDragEnd = () => {
    setDragOverCol(null);
    dragItemId.current = null;
    dragFromCol.current = null;
  };

  if (isLoading) {
    return (
      <div className="module-page">
        <div className="module-header"><h2>Assignments</h2></div>
        <div className="wf-state"><Loader2 size={24} className="spin" /><span>Loading assignments...</span></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="module-page">
        <div className="module-header"><h2>Assignments</h2></div>
        <div className="wf-state wf-error"><AlertCircle size={20} /><span>Failed to load assignments</span></div>
      </div>
    );
  }

  return (
    <div className="module-page">
      <div className="module-header">
        <h2>Assignments</h2>
        <span className="badge badge-warning">
          {assignments.filter(a => a.status === 'to_do').length} to do
        </span>
      </div>

      <p className="assign-hint">Drag cards between columns to update status</p>

      <div className="kanban-board">
        {COLUMNS.map(col => {
          const items = assignments.filter(a => a.status === col.key);
          const isDropTarget = dragOverCol === col.key;
          return (
            <div
              key={col.key}
              className={`kanban-column ${isDropTarget ? 'kanban-drop-over' : ''}`}
              onDragOver={e => onDragOver(e, col.key)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={e => onDrop(e, col.key)}
            >
              <div className="kanban-column-header" style={{ borderTopColor: col.color }}>
                <span>{col.label}</span>
                <span className="kanban-count">{items.length}</span>
              </div>
              <div className="kanban-cards">
                {items.map(a => {
                  const canDrag = ALLOWED_TRANSITIONS[a.status]?.length > 0;
                  return (
                    <div
                      key={a.id}
                      className={`card card-compact kanban-card ${canDrag ? '' : 'kanban-card-locked'}`}
                      draggable={canDrag}
                      onDragStart={e => onDragStart(e, a.id, a.status)}
                      onDragEnd={onDragEnd}
                    >
                      <div className="kanban-card-top">
                        <span className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>{a.subject}</span>
                        {canDrag && <GripVertical size={14} className="kanban-drag-icon" />}
                      </div>
                      <h4 className="kanban-card-title">{a.title}</h4>
                      <div className="kanban-card-meta">
                        <span>📅 {a.due}</span>
                        {a.marks && <span className="badge badge-success">{a.marks}</span>}
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <div className={`kanban-empty ${isDropTarget ? 'kanban-empty-drop' : ''}`}>
                    {isDropTarget ? 'Drop here' : 'No items'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
