import { useState } from 'react';
import { Users, Search, Plus, Clock, Globe, Lock, CheckCircle, MessageSquare } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import './ModulePage.css';

export default function StudyGroupsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'discover' | 'my-groups'>('discover');
  const [searchTerm, setSearchTerm] = useState('');
  const [createModal, setCreateModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject_tags: '',
    is_private: false,
  });

  const { data: publicGroups, isLoading: loadingPublic } = useQuery({
    queryKey: ['study-groups', searchTerm],
    queryFn: () => api.get(`/study-groups${searchTerm ? `?tags=${searchTerm}` : ''}`).then(r => r.data),
    enabled: activeTab === 'discover',
  });

  const { data: myGroups, isLoading: loadingMine } = useQuery({
    queryKey: ['my-study-groups'],
    queryFn: () => api.get(`/study-groups/my-groups`).then(r => r.data),
    enabled: activeTab === 'my-groups',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/study-groups', data),
    onSuccess: () => {
      toast.success('Study group created successfully!');
      setCreateModal(false);
      queryClient.invalidateQueries({ queryKey: ['study-groups'] });
      queryClient.invalidateQueries({ queryKey: ['my-study-groups'] });
      setActiveTab('my-groups');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to create group')
  });

  const joinMutation = useMutation({
    mutationFn: (groupId: number) => api.post(`/study-groups/${groupId}/join`),
    onSuccess: () => {
      toast.success('Joined study group!');
      queryClient.invalidateQueries({ queryKey: ['study-groups'] });
      queryClient.invalidateQueries({ queryKey: ['my-study-groups'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to join group')
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const tags = formData.subject_tags.split(',').map(t => t.trim()).filter(Boolean);

    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      subject_tags: tags,
      is_private: formData.is_private,
    });
  };

  const isMember = (groupId: number) => {
    if (!myGroups) return false;
    return myGroups.some((g: any) => g.id === groupId);
  };

  return (
    <div className="module-page">
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Peer Study Groups</h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`btn ${activeTab === 'discover' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('discover')}
          >
            <Globe size={16} /> Discover
          </button>
          <button 
            className={`btn ${activeTab === 'my-groups' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('my-groups')}
          >
            <Users size={16} /> My Groups
          </button>
          <button className="btn btn-primary" onClick={() => setCreateModal(true)} style={{ marginLeft: '10px' }}>
            <Plus size={16} /> Create Group
          </button>
        </div>
      </div>

      {activeTab === 'discover' && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <p className="text-secondary">Find and join peer-driven study groups to learn collaboratively.</p>
            <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
              <Search size={16} className="text-secondary" style={{ marginRight: '8px' }} />
              <input 
                type="text" 
                placeholder="Search by subject tag..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', width: '200px' }}
              />
            </div>
          </div>
          
          {loadingPublic ? (
            <div className="wf-state spin"><Clock /></div>
          ) : !publicGroups || publicGroups.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Users size={48} style={{ color: 'var(--border)', margin: '0 auto 16px' }} />
              <h3 style={{ margin: '0 0 8px 0' }}>No Groups Found</h3>
              <p className="text-secondary" style={{ margin: '0 0 20px 0' }}>Try a different search or create a new group.</p>
            </div>
          ) : (
            <div className="module-grid-2 fade-in">
              {publicGroups.map((group: any) => (
                <div key={group.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 className="card-title" style={{ margin: 0 }}>{group.name}</h3>
                    {group.is_private ? (
                      <span className="badge badge-warning"><Lock size={12} style={{ marginRight: '4px' }} /> Private</span>
                    ) : (
                      <span className="badge badge-success"><Globe size={12} style={{ marginRight: '4px' }} /> Public</span>
                    )}
                  </div>
                  
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px', flex: 1 }}>
                    {group.description || 'No description provided.'}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    {group.subject_tags?.map((tag: string, i: number) => (
                      <span key={i} className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{tag}</span>
                    ))}
                  </div>
                  
                  <div className="mentor-actions" style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                    {isMember(group.id) ? (
                      <button className="btn btn-secondary" style={{ flex: 1, pointerEvents: 'none', color: 'var(--success)', borderColor: 'var(--success)' }}>
                        <CheckCircle size={16} /> Joined
                      </button>
                    ) : (
                      <button 
                        className="btn btn-primary" 
                        style={{ flex: 1 }}
                        onClick={() => joinMutation.mutate(group.id)}
                        disabled={joinMutation.isPending}
                      >
                        <Plus size={16} /> Join Group
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'my-groups' && (
        <div className="fade-in">
          <p className="text-secondary" style={{ marginBottom: '20px' }}>Groups you are a member of.</p>
          
          {loadingMine ? (
            <div className="wf-state spin"><Clock /></div>
          ) : !myGroups || myGroups.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Users size={48} style={{ color: 'var(--border)', margin: '0 auto 16px' }} />
              <h3 style={{ margin: '0 0 8px 0' }}>You haven't joined any groups yet</h3>
              <p className="text-secondary" style={{ margin: '0 0 20px 0' }}>Go to the Discover tab to find peer groups.</p>
            </div>
          ) : (
            <div className="module-grid-2 fade-in">
              {myGroups.map((group: any) => (
                <div key={group.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 className="card-title" style={{ margin: 0 }}>{group.name}</h3>
                    {group.created_by === user?.id && <span className="badge badge-primary">Admin</span>}
                  </div>
                  
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px', flex: 1 }}>
                    {group.description || 'No description provided.'}
                  </p>
                  
                  <div className="mentor-actions" style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }}>
                      <MessageSquare size={16} /> Open Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Group Modal */}
      {createModal && (
        <div className="modal-backdrop fade-in">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create Study Group</h3>
              <button className="modal-close" onClick={() => setCreateModal(false)}>
                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="modal-body">
              <div className="form-group">
                <label>Group Name</label>
                <input required type="text" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Algorithms & Data Structures" />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea required className="input" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="What is this group about?" />
              </div>

              <div className="form-group">
                <label>Subject Tags (comma separated)</label>
                <input type="text" className="input" value={formData.subject_tags} onChange={e => setFormData({...formData, subject_tags: e.target.value})} placeholder="e.g. Python, Machine Learning, CS101" />
              </div>
              
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="is_private" checked={formData.is_private} onChange={e => setFormData({...formData, is_private: e.target.checked})} />
                <label htmlFor="is_private" style={{ margin: 0, fontWeight: 'normal' }}>Make this group private</label>
              </div>

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
