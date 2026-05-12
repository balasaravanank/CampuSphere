import { Moon, Sun, LogOut, Bell, Menu } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { useNavigate } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  title: string;
  onMenuToggle: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Header({ title, onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const greeting = getGreeting();
  const firstName = user?.name.split(' ')[0] || '';

  return (
    <header className="app-header">
      <div className="header-left">
        {/* Hamburger — mobile only */}
        <button
          className="btn btn-icon btn-ghost header-hamburger"
          onClick={onMenuToggle}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div className="header-context">
          <span className="header-greeting">
            {greeting}, <strong>{firstName}</strong>
          </span>
          <span className="header-page-indicator">{title}</span>
        </div>
      </div>

      <div className="header-right">
        <button className="btn btn-icon btn-ghost" onClick={toggle} aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button
          className="btn btn-icon btn-ghost header-bell"
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="header-bell-dot" />
        </button>

        <div className="header-user-menu">
          <div className="header-avatar">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            <LogOut size={16} />
            <span className="header-logout-text">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
