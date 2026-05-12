import { useAuth } from '../lib/auth';
import {
  CalendarCheck,
  ClipboardList,
  FileText,
  BookOpen,
  Trophy,
  Users,
} from 'lucide-react';
import './DashboardPage.css';

const studentQuickStats = [
  { label: 'Overall Attendance', value: '82%', icon: CalendarCheck, color: 'success' },
  { label: 'Pending Assignments', value: '3', icon: ClipboardList, color: 'warning' },
  { label: 'Unread Circulars', value: '5', icon: FileText, color: 'accent' },
  { label: 'Open Requests', value: '1', icon: BookOpen, color: 'primary' },
];

const adminQuickStats = [
  { label: 'Total Students', value: '4,820', icon: Users, color: 'accent' },
  { label: 'Pending Requests', value: '12', icon: BookOpen, color: 'warning' },
  { label: 'Active Circulars', value: '8', icon: FileText, color: 'success' },
  { label: 'Upcoming Events', value: '3', icon: Trophy, color: 'primary' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const stats = isAdmin ? adminQuickStats : studentQuickStats;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="dashboard">
      <div className="dashboard-greeting">
        <h2>{greeting()}, {user?.name.split(' ')[0]} 👋</h2>
        <p className="dashboard-greeting-sub">
          {isAdmin
            ? "Here's your campus overview for today."
            : "Here's what's happening in your campus today."}
        </p>
      </div>

      <div className="dashboard-stats">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat-card stat-${stat.color}`}>
            <div className="stat-icon">
              <stat.icon size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card dashboard-section">
          <div className="dashboard-section-header">
            <h3>📅 Today's Schedule</h3>
          </div>
          <div className="dashboard-schedule">
            {[
              { time: '09:00 - 10:00', subject: 'Data Structures & Algorithms', room: 'CS-101' },
              { time: '10:00 - 11:00', subject: 'Database Management Systems', room: 'CS-102' },
              { time: '11:00 - 12:00', subject: 'Operating Systems', room: 'CS-103' },
              { time: '14:00 - 15:00', subject: 'Artificial Intelligence', room: 'AI-LAB' },
            ].map((slot, i) => (
              <div key={i} className="schedule-item">
                <span className="schedule-time">{slot.time}</span>
                <div className="schedule-details">
                  <span className="schedule-subject">{slot.subject}</span>
                  <span className="schedule-room">{slot.room}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card dashboard-section">
          <div className="dashboard-section-header">
            <h3>⚡ Recent Activity</h3>
          </div>
          <div className="dashboard-activity">
            {[
              { text: 'Assignment "DBMS ER Diagrams" due in 2 days', type: 'warning' },
              { text: 'Circular: 5G Hackathon Registration Open', type: 'info' },
              { text: 'Attendance marked for OS class', type: 'success' },
              { text: 'Leave request approved by Dr. Lakshmi', type: 'success' },
              { text: 'New opportunity: Google Summer of Code', type: 'info' },
            ].map((item, i) => (
              <div key={i} className={`activity-item activity-${item.type}`}>
                <div className="activity-dot" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
