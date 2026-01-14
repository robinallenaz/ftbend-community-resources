import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './admin/AdminLayout';
import RequireAuth from './admin/RequireAuth';
import Layout from './components/Layout';
import AboutPage from './pages/AboutPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminEventEditorPage from './pages/AdminEventEditorPage';
import AdminEventsPage from './pages/AdminEventsPage';
import AdminGalleryPage from './pages/AdminGalleryPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminNewsletterPage from './pages/AdminNewsletterPage';
import AdminResourceEditorPage from './pages/AdminResourceEditorPage';
import AdminResourcesPage from './pages/AdminResourcesPage';
import AdminSubmissionsPage from './pages/AdminSubmissionsPage';
import AdminBlogPostsPage from './pages/AdminBlogPostsPage';
import AdminBlogPostEditorPage from './pages/AdminBlogPostEditorPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import EventsPage from './pages/EventsPage';
import HomePage from './pages/HomePage';
import NewsletterPage from './pages/NewsletterPage';
import NotFoundPage from './pages/NotFoundPage';
import ResourcesPage from './pages/ResourcesPage';
import SubmitResourcePage from './pages/SubmitResourcePage';
import SubmitBlogPostPage from './pages/SubmitBlogPostPage';

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
          <Route path="gallery" element={<AdminGalleryPage />} />
          <Route path="blog-posts" element={<AdminBlogPostsPage />} />
          <Route path="blog-posts/:id" element={<AdminBlogPostEditorPage />} />
          <Route path="submissions" element={<AdminSubmissionsPage />} />
          <Route path="newsletter" element={<AdminNewsletterPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>

      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/newsletter" element={<NewsletterPage />} />
        <Route path="/submit" element={<SubmitResourcePage />} />
        <Route path="/submit-blog-contribution" element={<SubmitBlogPostPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
