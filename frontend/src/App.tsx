import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './lib/auth';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AttendancePage from './pages/AttendancePage';
import AssignmentsPage from './pages/AssignmentsPage';
import CircularsPage from './pages/CircularsPage';
import CircularDetailPage from './pages/CircularDetailPage';
import WorkflowsPage from './pages/WorkflowsPage';
import WorkflowFormPage from './pages/WorkflowFormPage';
import WorkflowDetailPage from './pages/WorkflowDetailPage';
import EventsPage from './pages/EventsPage';
import MentorshipPage from './pages/MentorshipPage';
import AcademicsPage from './pages/AcademicsPage';
import SubjectDetailPage from './pages/SubjectDetailPage';
import AdminAcademicsPage from './pages/AdminAcademicsPage';
import OpportunitiesHubPage from './pages/OpportunitiesHubPage';
import OpportunityCategoryPage from './pages/OpportunityCategoryPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminPage from './pages/AdminPage';
import AdminEventCreatePage from './pages/AdminEventCreatePage';
import OpportunityApplicantsPage from './pages/OpportunityApplicantsPage';
import AdminOpportunitiesAccessPage from './pages/AdminOpportunitiesAccessPage';
import AdminWorkflowTemplatesPage from './pages/AdminWorkflowTemplatesPage';
import AdminWorkshopsPage from './pages/AdminWorkshopsPage';
import RewardPointsPage from './pages/RewardPointsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function StaffAdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'admin' && user?.role !== 'staff') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/circulars" element={<CircularsPage />} />
            <Route path="/circulars/:id" element={<CircularDetailPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
            <Route path="/workflows/new/:type" element={<WorkflowFormPage />} />
            <Route path="/workflows/:id" element={<WorkflowDetailPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/mentorship" element={<MentorshipPage />} />
            <Route path="/academics" element={<AcademicsPage />} />
            <Route path="/academics/subject/:id" element={<SubjectDetailPage />} />
            <Route path="/opportunities" element={<OpportunitiesHubPage />} />
            <Route path="/opportunities/all" element={<OpportunityCategoryPage pageTitle="All Opportunities" />} />
            <Route path="/opportunities/hackathons" element={<OpportunityCategoryPage categoryType="hackathon" pageTitle="Hackathons" />} />
            <Route path="/opportunities/internships" element={<OpportunityCategoryPage categoryType="internship" pageTitle="Internships" />} />
            <Route path="/opportunities/events" element={<OpportunityCategoryPage categoryType="event" pageTitle="Events" />} />
            <Route path="/opportunities/competitions" element={<OpportunityCategoryPage categoryType="competition" pageTitle="Competitions" />} />
            <Route path="/opportunities/scholarships" element={<OpportunityCategoryPage categoryType="scholarship" pageTitle="Scholarships" />} />
            <Route path="/opportunities/workshops" element={<OpportunityCategoryPage categoryType="workshop" pageTitle="Workshops" />} />
            <Route
              path="/opportunities/:id/applicants"
              element={
                <StaffAdminRoute>
                  <OpportunityApplicantsPage />
                </StaffAdminRoute>
              }
            />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/rewards" element={<RewardPointsPage />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/events/new"
              element={
                <AdminRoute>
                  <AdminEventCreatePage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/opportunities-access"
              element={
                <AdminRoute>
                  <AdminOpportunitiesAccessPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/workflow-templates"
              element={
                <AdminRoute>
                  <AdminWorkflowTemplatesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/workshops"
              element={
                <AdminRoute>
                  <AdminWorkshopsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/academics"
              element={
                <AdminRoute>
                  <AdminAcademicsPage />
                </AdminRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-md)',
          },
        }}
      />
    </QueryClientProvider>
  );
}
