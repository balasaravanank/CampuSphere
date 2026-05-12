import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft, Users, Download, Loader2, AlertCircle,
  CheckCircle2, Clock, Building2
} from 'lucide-react';
import api from '../lib/api';
import './OpportunitiesPage.css';
import './ModulePage.css';

interface Applicant {
  id: number;
  student_id: number;
  student_name: string;
  student_reg_no: string;
  student_department: string;
  student_email: string;
  status: string;
  applied_at: string;
}

interface ApplicantsData {
  opportunity: {
    id: number;
    title: string;
    organization: string;
    type: string;
  };
  applicants: Applicant[];
  total: number;
}

const STATUS_CLASS: Record<string, string> = {
  applied: 'opp-status-applied',
  pending: 'opp-status-pending',
  rejected: 'opp-status-rejected',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function exportCSV(applicants: Applicant[], title: string) {
  const headers = ['Name', 'Reg No', 'Department', 'Email', 'Status', 'Applied At'];
  const rows = applicants.map(a => [
    a.student_name, a.student_reg_no, a.student_department,
    a.student_email, a.status, formatDate(a.applied_at),
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_applicants.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Component ─────────────────────────────────────────── */
export default function OpportunityApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['opp-applicants', id],
    queryFn: () =>
      api.get(`/opportunities/${id}/applicants`).then(r => r.data.data as ApplicantsData),
    enabled: !!id,
  });

  const applicants = data?.applicants ?? [];
  const opp = data?.opportunity;

  const filtered = applicants.filter(a =>
    search === '' ||
    a.student_name.toLowerCase().includes(search.toLowerCase()) ||
    a.student_reg_no.toLowerCase().includes(search.toLowerCase()) ||
    a.student_department.toLowerCase().includes(search.toLowerCase())
  );

  /* Dept breakdown for stats */
  const deptMap = applicants.reduce<Record<string, number>>((acc, a) => {
    acc[a.student_department] = (acc[a.student_department] || 0) + 1;
    return acc;
  }, {});
  const topDept = Object.entries(deptMap).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="opp-applicants-page">
      {/* Breadcrumb & Header */}
      <div className="opp-applicants-header">
        <div className="opp-applicants-header-left">
          <div className="opp-breadcrumb">
            <button className="opp-breadcrumb-link" onClick={() => navigate('/opportunities')}>
              Opportunities
            </button>
            <ChevronLeft size={14} style={{ transform: 'rotate(180deg)' }} />
            <span>Enrolled Students</span>
          </div>

          {isLoading && <div className="wf-state"><Loader2 size={20} className="spin" /><span>Loading...</span></div>}

          {opp && (
            <>
              <h2 className="opp-applicants-title">{opp.title}</h2>
              <div className="opp-applicants-meta">
                <Building2 size={13} />
                <span>{opp.organization}</span>
                <span>·</span>
                <span style={{ textTransform: 'capitalize' }}>{opp.type}</span>
              </div>
            </>
          )}
        </div>

        {applicants.length > 0 && opp && (
          <button
            className="btn opp-export-btn"
            onClick={() => exportCSV(applicants, opp.title)}
          >
            <Download size={14} />
            Export CSV
          </button>
        )}
      </div>

      {/* Error state */}
      {isError && (
        <div className="wf-state wf-error">
          <AlertCircle size={20} />
          <span>Failed to load applicants. You may not have access.</span>
        </div>
      )}

      {/* Stats cards */}
      {!isLoading && !isError && data && (
        <>
          <div className="opp-applicants-stats">
            <div className="opp-stat-card">
              <span className="opp-stat-value">{data.total}</span>
              <span className="opp-stat-label">Total Enrolled</span>
            </div>
            <div className="opp-stat-card">
              <span className="opp-stat-value">
                {applicants.filter(a => a.status === 'applied').length}
              </span>
              <span className="opp-stat-label">Applied</span>
            </div>
            <div className="opp-stat-card">
              <span className="opp-stat-value">
                {Object.keys(deptMap).length}
              </span>
              <span className="opp-stat-label">Departments</span>
            </div>
            {topDept && (
              <div className="opp-stat-card">
                <span className="opp-stat-value" style={{ fontSize: '1.125rem' }}>
                  {topDept[0]}
                </span>
                <span className="opp-stat-label">Top Department ({topDept[1]})</span>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="opp-applicants-table-card">
            <div className="opp-table-header">
              <h3 className="opp-table-title">
                <Users size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                Enrolled Students
                {filtered.length !== applicants.length && (
                  <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, fontSize: '0.875rem', marginLeft: 8 }}>
                    ({filtered.length} of {applicants.length})
                  </span>
                )}
              </h3>
              <input
                type="text"
                className="opp-search-input"
                placeholder="Search by name, reg no..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {filtered.length === 0 ? (
              <div className="opp-empty-table">
                {applicants.length === 0
                  ? 'No students have enrolled yet.'
                  : 'No results match your search.'}
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="opp-applicants-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Reg No</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Applied At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a, i) => (
                      <tr key={a.id}>
                        <td style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>{i + 1}</td>
                        <td>
                          <div className="opp-student-name">{a.student_name}</div>
                          <div className="opp-student-email">{a.student_email}</div>
                        </td>
                        <td>
                          <span className="opp-reg-badge">{a.student_reg_no}</span>
                        </td>
                        <td>{a.student_department}</td>
                        <td>
                          <span className={`opp-status-badge ${STATUS_CLASS[a.status] ?? 'opp-status-applied'}`}>
                            <CheckCircle2 size={10} />
                            {a.status}
                          </span>
                        </td>
                        <td className="opp-date-cell">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Clock size={11} />
                            {formatDate(a.applied_at)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
