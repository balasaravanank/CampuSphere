import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './AppLayout.css';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/attendance': 'Attendance',
  '/assignments': 'Assignments',
  '/circulars': 'Circulars',
  '/workflows': 'Workflow Requests',
  '/events': 'Events & Booking',
  '/mentorship': 'Mentorship',
  '/opportunities': 'Opportunities',
  '/notifications': 'Notifications',
  '/admin': 'Admin Panel',
};

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const currentTitle = pageTitles[location.pathname] || 'CampuSphere';

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      {/* Mobile overlay backdrop */}
      <div
        className={`sidebar-overlay ${mobileMenuOpen ? 'sidebar-overlay-visible' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="app-main">
        <Header
          title={currentTitle}
          onMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
        />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
