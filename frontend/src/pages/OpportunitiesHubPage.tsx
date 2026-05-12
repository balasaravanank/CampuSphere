import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Briefcase, Calendar, Trophy, Award, BookOpen,
  Loader2, AlertCircle, Plus, ArrowRight, TrendingUp,
  Globe, Building2,
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import './OpportunitiesHubPage.css';

interface HubStats {
  total: number;
  by_type: Record<string, number>;
  by_source: Record<string, number>;
}

const CATEGORY_CARDS = [
  {
    key: 'hackathon',
    label: 'Hackathons',
    description: 'Build, compete, and showcase your skills at top hackathons',
    icon: Zap,
    route: '/opportunities/hackathons',
    gradient: 'linear-gradient(135deg, #DC2626 0%, #F97316 100%)',
    glow: 'rgba(220, 38, 38, 0.25)',
  },
  {
    key: 'internship',
    label: 'Internships',
    description: 'Gain real-world experience with industry internship opportunities',
    icon: Briefcase,
    route: '/opportunities/internships',
    gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
    glow: 'rgba(5, 150, 105, 0.25)',
  },
  {
    key: 'event',
    label: 'Events',
    description: 'Campus events, workshops, tech talks, and cultural programs',
    icon: Calendar,
    route: '/opportunities/events',
    gradient: 'linear-gradient(135deg, #2563EB 0%, #6366F1 100%)',
    glow: 'rgba(37, 99, 235, 0.25)',
  },
  {
    key: 'competition',
    label: 'Competitions',
    description: 'Coding contests, quizzes, paper presentations, and more',
    icon: Trophy,
    route: '/opportunities/competitions',
    gradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
    glow: 'rgba(217, 119, 6, 0.25)',
  },
  {
    key: 'scholarship',
    label: 'Scholarships',
    description: 'Financial aid and merit-based scholarship opportunities',
    icon: Award,
    route: '/opportunities/scholarships',
    gradient: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
    glow: 'rgba(8, 145, 178, 0.25)',
  },
  {
    key: 'workshop',
    label: 'Workshops',
    description: 'Hands-on learning sessions and skill development workshops',
    icon: BookOpen,
    route: '/opportunities/workshops',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
    glow: 'rgba(124, 58, 237, 0.25)',
  },
];

function AnimatedCounter({ value }: { value: number }) {
  return <span className="hub-counter-value">{value}</span>;
}

export default function OpportunitiesHubPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['opportunities-stats'],
    queryFn: () =>
      api.get('/opportunities/stats').then(r => r.data.data as HubStats),
  });

  const totalCount = stats?.total ?? 0;
  const manualCount = stats?.by_source?.manual ?? 0;
  const externalCount = totalCount - manualCount;

  return (
    <div className="hub-page">
      {/* Hero Section */}
      <div className="hub-hero">
        <div className="hub-hero-content">
          <div className="hub-hero-text">
            <h1 className="hub-hero-title">
              Opportunities Hub
            </h1>
            <p className="hub-hero-subtitle">
              Discover hackathons, internships, events, and more — all in one place.
              College-posted items are prioritized at the top.
            </p>
          </div>
          {isStaffOrAdmin && (
            <button
              className="btn hub-post-btn"
              onClick={() => navigate('/opportunities/all')}
            >
              <Plus size={16} />
              Post Opportunity
            </button>
          )}
        </div>

        {/* Stats Row */}
        {!isLoading && !isError && stats && (
          <div className="hub-stats-row">
            <div className="hub-stat-item">
              <div className="hub-stat-icon" style={{ background: 'linear-gradient(135deg, #2563EB, #6366F1)' }}>
                <TrendingUp size={16} />
              </div>
              <div>
                <AnimatedCounter value={totalCount} />
                <span className="hub-stat-label">Total Opportunities</span>
              </div>
            </div>
            <div className="hub-stat-item">
              <div className="hub-stat-icon" style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>
                <Building2 size={16} />
              </div>
              <div>
                <AnimatedCounter value={manualCount} />
                <span className="hub-stat-label">College Posted</span>
              </div>
            </div>
            <div className="hub-stat-item">
              <div className="hub-stat-icon" style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
                <Globe size={16} />
              </div>
              <div>
                <AnimatedCounter value={externalCount} />
                <span className="hub-stat-label">External Sources</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="wf-state">
          <Loader2 size={24} className="spin" />
          <span>Loading hub...</span>
        </div>
      )}
      {isError && (
        <div className="wf-state wf-error">
          <AlertCircle size={20} />
          <span>Failed to load stats</span>
        </div>
      )}

      {/* Category Grid */}
      <div className="hub-grid">
        {CATEGORY_CARDS.map((cat, idx) => {
          const count = stats?.by_type?.[cat.key] ?? 0;
          const Icon = cat.icon;
          return (
            <button
              key={cat.key}
              className="hub-category-card"
              onClick={() => navigate(cat.route)}
              style={{
                '--card-gradient': cat.gradient,
                '--card-glow': cat.glow,
                '--anim-delay': `${idx * 80}ms`,
              } as React.CSSProperties}
            >
              <div className="hub-card-icon-wrap">
                <Icon size={28} />
              </div>
              <div className="hub-card-body">
                <h3 className="hub-card-title">{cat.label}</h3>
                <p className="hub-card-desc">{cat.description}</p>
              </div>
              <div className="hub-card-footer">
                <span className="hub-card-count">{count} active</span>
                <span className="hub-card-arrow">
                  View All <ArrowRight size={14} />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Browse All Link */}
      <div className="hub-browse-all">
        <button className="btn hub-browse-all-btn" onClick={() => navigate('/opportunities/all')}>
          Browse All Opportunities
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
