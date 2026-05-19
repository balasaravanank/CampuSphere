import { Trophy, Clock, ArrowDownRight, ArrowUpRight, Award, Zap, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import './ModulePage.css';

export default function RewardPointsPage() {
  const { data: rewardsData, isLoading } = useQuery({
    queryKey: ['my_rewards'],
    queryFn: () => api.get('/workshops/rewards/my-points').then(r => r.data.data),
  });

  const totalPoints = rewardsData?.total_points || 0;
  
  // Calculate mock stats based on total
  const level = Math.floor(totalPoints / 100) + 1;
  const nextLevel = level * 100;
  const progress = (totalPoints % 100);

  return (
    <div className="module-page fade-in">
      <div className="module-header">
        <h2>Reward Program</h2>
        <p className="text-secondary" style={{ marginTop: '8px' }}>
          Track your credits, debits, and balance from activities, workshops, and skills.
        </p>
      </div>

      <div className="module-grid-3" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'linear-gradient(135deg, var(--bg-card), var(--bg-secondary))' }}>
          <div style={{ 
            width: '64px', height: '64px', 
            borderRadius: '50%', 
            background: 'var(--accent-light)', 
            color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Trophy size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500, margin: '0 0 4px 0' }}>Current Balance</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {isLoading ? '...' : totalPoints} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>pts</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Award size={20} className="text-secondary" />
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Current Level: {level}</h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 500 }}>
            <span>{totalPoints} pts</span>
            <span className="text-secondary">{nextLevel} pts needed</span>
          </div>
          <div style={{ background: 'var(--border)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, background: 'var(--accent)', height: '100%', transition: 'width 1s ease-in-out' }} />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '12px', margin: '12px 0 0 0' }}>
            Earn {100 - progress} more points to reach Level {level + 1}
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Zap size={20} className="text-secondary" />
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Recent Activity</h3>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Workshops Attended</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rewardsData?.transactions?.filter((t:any) => t.type === 'attendee_reward').length || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Workshops Hosted</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rewardsData?.transactions?.filter((t:any) => t.type === 'host_reward').length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 className="card-title" style={{ margin: 0 }}><Star size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Transaction Ledger</h3>
        </div>
        
        {isLoading ? (
          <div className="wf-state spin" style={{ padding: '40px' }}><Clock /></div>
        ) : !rewardsData?.transactions || rewardsData.transactions.length === 0 ? (
          <div className="wf-state" style={{ padding: '40px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <Trophy size={32} style={{ color: 'var(--border)', marginBottom: '12px' }} />
            <div style={{ fontWeight: 500 }}>No reward transactions yet.</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Attend or host a workshop to start earning points!</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Transaction Type</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {rewardsData.transactions.map((tx: any) => {
                  const isCredit = tx.points > 0;
                  return (
                    <tr key={tx.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{new Date(tx.created_at).toLocaleDateString()}</div>
                        <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                          {new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${tx.type.includes('reward') ? 'badge-success' : 'badge-primary'}`}>
                          {tx.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ maxWidth: '400px' }}>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{tx.workshop_title || 'Campus Activity'}</div>
                        <div className="text-secondary" style={{ fontSize: '0.8125rem' }}>{tx.description}</div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: isCredit ? 'var(--success)' : 'var(--danger)', fontSize: '1.1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          {isCredit ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                          {isCredit ? '+' : ''}{tx.points}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
