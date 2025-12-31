import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './admin/AdminLayout';
import RequireAuth from './admin/RequireAuth';
import Layout from './components/Layout';
import AboutPage from './pages/AboutPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminEventEditorPage from './pages/AdminEventEditorPage';
import AdminEventsPage from './pages/AdminEventsPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminNewsletterPage from './pages/AdminNewsletterPage';
import AdminResourceEditorPage from './pages/AdminResourceEditorPage';
import AdminResourcesPage from './pages/AdminResourcesPage';
import AdminSubmissionsPage from './pages/AdminSubmissionsPage';
import EventsPage from './pages/EventsPage';
import HomePage from './pages/HomePage';
import NewsletterPage from './pages/NewsletterPage';
import ResourcesPage from './pages/ResourcesPage';
import SubmitResourcePage from './pages/SubmitResourcePage';

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="resources" element={<AdminResourcesPage />} />
          <Route path="resources/:id" element={<AdminResourceEditorPage />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="events/:id" element={<AdminEventEditorPage />} />
          <Route path="submissions" element={<AdminSubmissionsPage />} />
          <Route path="newsletter" element={<AdminNewsletterPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>

      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/submit" element={<SubmitResourcePage />} />
        <Route path="/newsletter" element={<NewsletterPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
