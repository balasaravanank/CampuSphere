import { Check } from 'lucide-react';
import './ModulePage.css';

const notifications = [
  { id: 1, title: 'Attendance OTP Available', body: 'OTP generated for DSA class (CS-101). Enter now.', priority: 'critical', time: '2 min ago', read: false },
  { id: 2, title: 'Assignment Due Tomorrow', body: 'ER Diagram - Library System is due tomorrow at 11:59 PM.', priority: 'high', time: '1 hour ago', read: false },
  { id: 3, title: 'New Circular Posted', body: '5G Hackathon Registration Open — register by May 10.', priority: 'normal', time: '3 hours ago', read: false },
  { id: 4, title: 'Leave Request Approved', body: 'Your OD request for IIT Madras Hackathon has been approved.', priority: 'normal', time: '1 day ago', read: true },
  { id: 5, title: 'Grade Posted', body: 'SQL Joins Practice graded — 18/20.', priority: 'low', time: '2 days ago', read: true },
];

const priorityDot: Record<string, string> = {
  critical: 'var(--danger)',
  high: 'var(--warning)',
  normal: 'var(--accent)',
  low: 'var(--text-tertiary)',
};

export default function NotificationsPage() {
  return (
    <div className="module-page">
      <div className="module-header">
        <h2>Notifications</h2>
        <button className="btn btn-ghost btn-sm"><Check size={14} /> Mark all read</button>
      </div>

      <div className="notifications-list">
        {notifications.map((n) => (
          <div key={n.id} className={`card card-compact notification-card ${n.read ? 'notification-read' : ''}`}>
            <div className="notification-left">
              <div className="notification-dot" style={{ background: priorityDot[n.priority] }} />
              <div className="notification-content">
                <h4 className="notification-title">{n.title}</h4>
                <p className="notification-body">{n.body}</p>
                <span className="notification-time">{n.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
