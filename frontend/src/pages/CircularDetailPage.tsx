import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Clock, User, Calendar, Eye, AlertTriangle, AlertCircle, Info, ArrowDown,
  Pin, CheckCheck, Bell, MessageSquare, CheckSquare, Send, Paperclip, CheckCircle2, Circle,
  Loader2, Trash2, Plus, X, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import './CircularsPage.css';

// Config
const PRIORITY_CONFIG: Record<string, { label: string; icon: any }> = {
  urgent: { label: 'URGENT', icon: AlertTriangle },
  action_required: { label: 'ACTION REQUIRED', icon: AlertCircle },
  informational: { label: 'INFO', icon: Info },
  low_priority: { label: 'LOW', icon: ArrowDown },
};

export default function CircularDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks'>('tasks');
  
  // Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isWsConnected, setIsWsConnected] = useState(false);

  // Task Admin State
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskUrl, setNewTaskUrl] = useState('');

  // ── Data Fetching ──

  const { data: circular, isLoading, isError } = useQuery({
    queryKey: ['circular-detail', id],
    queryFn: () => api.get(`/circulars/${id}`).then(r => r.data.data),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['circular-tasks', id],
    queryFn: () => api.get(`/circulars/${id}/tasks`).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: initialMessages = [] } = useQuery({
    queryKey: ['circular-chat', id],
    queryFn: () => api.get(`/circulars/${id}/chat`).then(r => r.data.data),
    enabled: !!id,
  });

  // Load initial messages
  useEffect(() => {
    if (initialMessages.length > 0 && messages.length === 0) {
      setMessages(initialMessages);
      scrollToBottom();
    }
  }, [initialMessages]);

  const markReadMutation = useMutation({
    mutationFn: (circId: number) => api.post(`/circulars/${circId}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['circular-detail', id] }),
  });

  useEffect(() => {
    if (circular && !circular.read) {
      markReadMutation.mutate(circular.id);
    }
  }, [circular]);

  // ── WebSockets for Chat ──

  useEffect(() => {
    if (!id || !user) return;

    const token = sessionStorage.getItem('access_token');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the backend host mapping
    const wsUrl = `${protocol}//${window.location.hostname}:8001/api/v1/ws/circulars/${id}/chat?token=${token}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => setIsWsConnected(true);
    
    ws.current.onmessage = (event) => {
      const newMsg = JSON.parse(event.data);
      setMessages(prev => [...prev, newMsg]);
      scrollToBottom();
    };

    ws.current.onclose = () => setIsWsConnected(false);

    return () => {
      ws.current?.close();
    };
  }, [id, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !ws.current || !isWsConnected) return;
    
    ws.current.send(chatMessage.trim());
    setChatMessage('');
  };

  // ── Tasks Mutations ──

  const toggleTaskMutation = useMutation({
    mutationFn: (taskId: number) => api.post(`/circulars/tasks/${taskId}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['circular-tasks', id] }),
  });

  const createTaskMutation = useMutation({
    mutationFn: (payload: any) => api.post(`/circulars/${id}/tasks`, payload),
    onSuccess: () => {
      toast.success('Task created successfully');
      setShowTaskForm(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskUrl('');
      queryClient.invalidateQueries({ queryKey: ['circular-tasks', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to create task')
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: number) => api.delete(`/circulars/tasks/${taskId}`),
    onSuccess: () => {
      toast.success('Task deleted');
      queryClient.invalidateQueries({ queryKey: ['circular-tasks', id] });
    }
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return toast.error('Title is required');
    createTaskMutation.mutate({
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || null,
      attachment_url: newTaskUrl.trim() || null,
    });
  };

  // ── Render Helpers ──

  if (isLoading) {
    return (
      <div className="module-page" style={{ height: 'calc(100vh - 64px)', padding: 0 }}>
        <div style={{ display: 'flex', height: '100%', width: '100%', padding: '24px', gap: '24px' }}>
          <div className="skeleton circ-skeleton-bar" style={{ flex: '6', height: '100%' }} />
          <div className="skeleton circ-skeleton-bar" style={{ flex: '4', height: '100%' }} />
        </div>
      </div>
    );
  }

  if (isError || !circular) {
    return (
      <div className="module-page">
        <button className="btn btn-ghost" onClick={() => navigate('/circulars')} style={{ alignSelf: 'flex-start' }}>
          <ArrowLeft size={16} /> Back to Circulars
        </button>
        <div className="wf-state wf-error">
          <AlertCircle size={20} />
          <span>Failed to load circular details.</span>
        </div>
      </div>
    );
  }

  const pc = PRIORITY_CONFIG[circular.priority];
  const isExpired = circular.deadline?.expired;
  const isUrgentDeadline = !isExpired && circular.deadline?.days === 0;

  return (
    <div className="module-page" style={{ 
      maxWidth: '100%', 
      height: 'calc(100vh - 64px)', 
      padding: '0', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--bg-secondary)'
    }}>
      {/* ── Top Bar ── */}
      <div style={{ padding: '16px 24px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px', zIndex: 10 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/circulars')} style={{ padding: '8px' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {pc && (
            <span className={`circ-priority-badge ${circular.priority}`}>
              <pc.icon size={11} /> {pc.label}
            </span>
          )}
          <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>{circular.title}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
           {circular.deadline && (
              <span className={`circ-deadline-tag ${isExpired ? 'expired' : ''} ${isUrgentDeadline ? 'urgent-deadline' : ''}`}>
                <Clock size={11} /> {circular.deadline.text}
              </span>
            )}
            {circular.read ? (
              <span className="badge badge-success"><CheckCheck size={14} /> Read</span>
            ) : (
              <span className="badge badge-warning"><Bell size={14} /> Unread</span>
            )}
        </div>
      </div>

      {/* ── Split Layout ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT PANE: Circular Document */}
        <div style={{ flex: '6', minWidth: '0', borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '32px 40px', background: 'var(--bg-primary)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '20px' }}>
                {circular.title}
              </h1>
              
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '24px', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {circular.author_name.charAt(0)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{circular.author_name}</span>
                    <span style={{ fontSize: '0.75rem' }}>Author</span>
                  </div>
                </span>
                <span className="circ-detail-meta-item">
                  <Calendar size={16} /> {circular.date_formatted}
                </span>
                <span className="circ-detail-meta-item">
                  <Eye size={16} /> {circular.read_count} views
                </span>
              </div>
            </div>

            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
              {circular.content || circular.summary}
            </div>

            {(circular.department_targets?.length > 0 || circular.role_targets?.length > 0) && (
              <div style={{ marginTop: '60px', padding: '24px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Audience</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                  {circular.department_targets?.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Departments:</span>
                      {circular.department_targets.map((d: string) => (
                        <span key={d} className="badge badge-secondary">{d}</span>
                      ))}
                    </div>
                  )}
                  {circular.role_targets?.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Roles:</span>
                      {circular.role_targets.map((r: string) => (
                        <span key={r} className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Tabs & Interaction */}
        <div style={{ flex: '4', minWidth: '400px', display: 'flex', flexDirection: 'column', background: 'var(--bg-elevated)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
            <button 
              onClick={() => setActiveTab('tasks')}
              style={{ 
                flex: 1, padding: '16px', background: 'none', border: 'none', 
                borderBottom: activeTab === 'tasks' ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === 'tasks' ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'tasks' ? 600 : 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <CheckSquare size={16} /> Tasks
              {tasks.filter((t: any) => !t.completed).length > 0 && (
                <span style={{ background: 'var(--danger)', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                  {tasks.filter((t: any) => !t.completed).length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('chat')}
              style={{ 
                flex: 1, padding: '16px', background: 'none', border: 'none', 
                borderBottom: activeTab === 'chat' ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === 'chat' ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'chat' ? 600 : 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <MessageSquare size={16} /> Live Discussion
              {isWsConnected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} title="Connected" />}
            </button>
          </div>

          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Action Items</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', margin: 0 }}>Check off tasks as you complete them.</p>
                </div>
                {isStaff && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowTaskForm(!showTaskForm)}>
                    {showTaskForm ? <X size={14} /> : <><Plus size={14} /> Add Task</>}
                  </button>
                )}
              </div>

              {/* Admin Create Task Form */}
              {isStaff && showTaskForm && (
                <form onSubmit={handleCreateTask} style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px', animation: 'circ-slide-up 0.2s ease-out' }}>
                  <div>
                    <label className="circ-form-label" style={{ fontSize: '0.75rem' }}>Task Title</label>
                    <input type="text" className="input" placeholder="e.g. Fill out the registration form" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} required style={{ padding: '8px 12px' }} />
                  </div>
                  <div>
                    <label className="circ-form-label" style={{ fontSize: '0.75rem' }}>Description (Optional)</label>
                    <textarea className="input" placeholder="Add more details..." value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} style={{ padding: '8px 12px', minHeight: '60px', resize: 'vertical' }} />
                  </div>
                  <div>
                    <label className="circ-form-label" style={{ fontSize: '0.75rem' }}>Attachment / Link (Optional)</label>
                    <div style={{ position: 'relative' }}>
                      <ImageIcon size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-tertiary)' }} />
                      <input type="url" className="input" placeholder="https://..." value={newTaskUrl} onChange={e => setNewTaskUrl(e.target.value)} style={{ padding: '8px 12px 8px 32px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowTaskForm(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={createTaskMutation.isPending}>
                      {createTaskMutation.isPending ? <Loader2 size={14} className="spin" /> : 'Create Task'}
                    </button>
                  </div>
                </form>
              )}
              
              {/* Task List */}
              {tasks.length === 0 && !showTaskForm && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
                  <CheckSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p>No tasks assigned for this circular.</p>
                </div>
              )}

              {tasks.map((task: any) => (
                <div 
                  key={task.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '16px', 
                    padding: '16px', 
                    background: task.completed ? 'var(--success-light)' : 'var(--bg-primary)', 
                    border: `1px solid ${task.completed ? 'rgba(5, 150, 105, 0.2)' : 'var(--border)'}`,
                    borderRadius: '12px',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <button 
                    onClick={() => toggleTaskMutation.mutate(task.id)}
                    disabled={toggleTaskMutation.isPending}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '2px', flexShrink: 0 }}
                  >
                    {task.completed ? (
                      <CheckCircle2 size={22} style={{ color: 'var(--success)' }} />
                    ) : (
                      <Circle size={22} style={{ color: 'var(--text-tertiary)' }} />
                    )}
                  </button>
                  
                  <div style={{ flex: 1 }}>
                    <span style={{ 
                      display: 'block',
                      fontSize: '0.9375rem', 
                      fontWeight: 600, 
                      color: task.completed ? 'var(--success)' : 'var(--text-primary)',
                      textDecoration: task.completed ? 'line-through' : 'none',
                      marginBottom: task.description ? '4px' : '0'
                    }}>
                      {task.title}
                    </span>
                    {task.description && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>{task.description}</p>
                    )}
                    {task.attachment_url && (
                      <a href={task.attachment_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--accent)', background: 'var(--accent-light)', padding: '4px 10px', borderRadius: '20px', textDecoration: 'none', fontWeight: 600 }}>
                        <Paperclip size={12} /> View Attachment
                      </a>
                    )}
                  </div>

                  {isStaff && (
                    <button 
                      onClick={() => { if(confirm('Delete this task globally?')) deleteTaskMutation.mutate(task.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}
                      title="Delete Task"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Chat Messages */}
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-tertiary)' }}>
                    <MessageSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                {messages.map((msg, idx) => {
                  const isMe = msg.user === user?.name;
                  return (
                    <div key={msg.id || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{msg.user}</span>
                        <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{msg.role}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                          {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ 
                        padding: '12px 16px', 
                        background: isMe ? 'var(--accent)' : 'var(--bg-primary)', 
                        color: isMe ? 'white' : 'var(--text-primary)',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        boxShadow: 'var(--shadow-sm)',
                        border: isMe ? 'none' : '1px solid var(--border)',
                        maxWidth: '85%',
                        fontSize: '0.9375rem',
                        lineHeight: 1.5
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  )
                })}
                <div ref={chatEndRef} />
              </div>
              
              {/* Chat Input */}
              <form onSubmit={handleSendMessage} style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  className="input" 
                  placeholder={isWsConnected ? "Type a message..." : "Connecting to live chat..."} 
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  disabled={!isWsConnected}
                  style={{ flex: 1, borderRadius: '24px', padding: '12px 20px' }}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ borderRadius: '24px', padding: '10px 24px' }}
                  disabled={!chatMessage.trim() || !isWsConnected}
                >
                  <Send size={16} /> Send
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
