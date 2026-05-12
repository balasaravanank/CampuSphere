import { Trophy, Clock, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import './ModulePage.css';

export default function RewardPointsPage() {
  const { data: rewardsData, isLoading } = useQuery({
    queryKey: ['my_rewards'],
    queryFn: () => api.get('/workshops/rewards/my-points').then(r => r.data.data),
  });

  return (
    <div className="module-page">
      <div className="module-header">
        <h2>My Reward Points</h2>
        <p className="text-secondary" style={{ marginTop: '8px' }}>
          Track your credits, debits, and balance from activities, workshops, and skills.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '60px', height: '60px', 
            borderRadius: '50%', 
            background: 'var(--accent-light)', 
            color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Trophy size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Current Balance</h3>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isLoading ? '...' : (rewardsData?.total_points || 0)} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>pts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Transaction History</h3>
        
        {isLoading ? (
          <div className="wf-state spin"><Clock /></div>
        ) : !rewardsData?.transactions || rewardsData.transactions.length === 0 ? (
          <div className="wf-state">No reward transactions yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Points</th>
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
                      <td style={{ maxWidth: '300px' }}>{tx.description}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: isCredit ? 'var(--success)' : 'var(--danger)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          {isCredit ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
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
