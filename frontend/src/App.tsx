import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import WelcomePage from './pages/WelcomePage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import EventManagementPage from './pages/EventManagementPage';
import CreateEditEventPage from './pages/CreateEditEventPage';
import BrowseEventsPage from './pages/BrowseEventsPage';
import EventDetailPage from './pages/EventDetailPage';
import MessagingPage from './pages/MessagingPage';
import AdminExportPage from './pages/AdminExportPage';
import EventBookingsPage from './pages/EventBookingsPage';

function ProtectedRoute({ children, roles }: { children: JSX.Element; roles?: string[] }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/home" />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/home" element={
        <ProtectedRoute><HomePage /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/export" element={
        <ProtectedRoute roles={['ADMIN']}><AdminExportPage /></ProtectedRoute>
      } />
      <Route path="/events" element={<BrowseEventsPage />} />
      <Route path="/events/:id" element={<EventDetailPage />} />
      <Route path="/my-events" element={
        <ProtectedRoute roles={['ORGANIZER', 'ADMIN']}><EventManagementPage /></ProtectedRoute>
      } />
      <Route path="/my-events/create" element={
        <ProtectedRoute roles={['ORGANIZER', 'ADMIN']}><CreateEditEventPage /></ProtectedRoute>
      } />
      <Route path="/my-events/edit/:id" element={
        <ProtectedRoute roles={['ORGANIZER', 'ADMIN']}><CreateEditEventPage /></ProtectedRoute>
      } />
      <Route path="/my-events/:id/bookings" element={
        <ProtectedRoute roles={['ORGANIZER', 'ADMIN']}><EventBookingsPage /></ProtectedRoute>
      } />
      <Route path="/messages" element={
        <ProtectedRoute><MessagingPage /></ProtectedRoute>
      } />
    </Routes>
  );
}