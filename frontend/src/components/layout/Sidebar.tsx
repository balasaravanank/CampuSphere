import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  ClipboardList,
  FileText,
  BookOpen,
  Users,
  Trophy,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  X,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import './Sidebar.css';

interface NavItem {
  path: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  roles: string[];
  badge?: number;
}

interface NavSection {
  id: string;
  label: string;
  collapsible?: boolean;
  items: NavItem[];
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

/*
 * ─── NAV STRUCTURE ────────────────────────────────────
 * To add a new feature: just push an item into the right section.
 * To add a new section: add a NavSection object below.
 */
const navSections: NavSection[] = [
  {
    id: 'core',
    label: 'Core',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['student', 'staff', 'admin'] },
      { path: '/attendance', icon: CalendarCheck, label: 'Schedule', roles: ['student', 'staff', 'admin'] },
      { path: '/assignments', icon: ClipboardList, label: 'Assignments', roles: ['student', 'staff', 'admin'] },
      { path: '/circulars', icon: FileText, label: 'Circulars', roles: ['student', 'staff', 'admin'] },
      { path: '/workflows', icon: BookOpen, label: 'Requests', roles: ['student', 'staff', 'admin'] },
    ],
  },
  {
    id: 'explore',
    label: 'Explore',
    collapsible: true,
    items: [
      { path: '/events', icon: Trophy, label: 'Events', roles: ['student', 'staff', 'admin'] },
      { path: '/mentorship', icon: Users, label: 'Mentorship', roles: ['student', 'staff', 'admin'] },
      { path: '/academics', icon: BookOpen, label: 'Academics', roles: ['student', 'staff', 'admin'] },
      { path: '/opportunities', icon: GraduationCap, label: 'Opportunities', roles: ['student', 'staff', 'admin'] },
      { path: '/rewards', icon: Trophy, label: 'Rewards', roles: ['student', 'staff', 'admin'] },
    ],
  },
  {
    id: 'manage',
    label: 'Manage',
    collapsible: true,
    items: [
      { path: '/admin', icon: Settings, label: 'Admin Panel', roles: ['admin'] },
    ],
  },
];

function filterByRole(items: NavItem[], role?: string) {
  return items.filter((item) => role && item.roles.includes(role));
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: filterByRole(section.items, user?.role),
    }))
    .filter((section) => section.items.length > 0);

  /* Close mobile drawer when a link is clicked */
  const handleLinkClick = () => {
    if (mobileOpen) onMobileClose();
  };

  return (
    <aside
      className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}
    >
      {/* ── Header ── */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-brand">
            <div className="sidebar-logo">CS</div>
            <span className="sidebar-title">CampuSphere</span>
          </div>
        )}

        {/* Desktop: collapse toggle | Mobile: close X */}
        <button
          className="btn-icon btn-ghost sidebar-toggle sidebar-toggle-desktop"
          onClick={onToggle}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        <button
          className="btn-icon btn-ghost sidebar-toggle sidebar-toggle-mobile"
          onClick={onMobileClose}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* ── Navigation Sections ── */}
      <nav className="sidebar-nav">
        {visibleSections.map((section) => {
          const isSectionCollapsed = collapsedSections.has(section.id);
          const hasActiveChild = section.items.some((item) =>
            location.pathname.startsWith(item.path)
          );
          const isOpen = hasActiveChild || !isSectionCollapsed;

          return (
            <div key={section.id} className="sidebar-group">
              {!collapsed ? (
                <button
                  className="sidebar-group-header"
                  onClick={() => section.collapsible && toggleSection(section.id)}
                  aria-expanded={isOpen}
                >
                  <span className="sidebar-group-label">{section.label}</span>
                  {section.collapsible && (
                    <ChevronDown
                      size={12}
                      className={`sidebar-group-chevron ${isOpen ? 'sidebar-group-chevron-open' : ''}`}
                    />
                  )}
                </button>
              ) : (
                <div className="sidebar-group-dot" />
              )}

              <div
                className={`sidebar-group-items ${
                  isOpen ? 'sidebar-group-items-open' : 'sidebar-group-items-closed'
                }`}
              >
                <div className="sidebar-group-items-inner">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={handleLinkClick}
                      className={({ isActive }) =>
                        `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon size={19} />
                      {!collapsed && (
                        <>
                          <span>{item.label}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="sidebar-badge">{item.badge}</span>
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      {!collapsed && user && (
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-role">{user.role}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
