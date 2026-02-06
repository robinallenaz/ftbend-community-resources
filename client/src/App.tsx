import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './admin/AdminLayout';
import RequireAuth from './admin/RequireAuth';
import Layout from './components/Layout';
import { lazy, Suspense } from 'react';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminEventEditorPage from './pages/AdminEventEditorPage';
import AdminEventsPage from './pages/AdminEventsPage';
import AdminGalleryPage from './pages/AdminGalleryPage';
import AdminResourcesPage from './pages/AdminResourcesPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import EventsPage from './pages/EventsPage';
import HomePage from './pages/HomePage';
import NewsletterPage from './pages/NewsletterPage';
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPage from './pages/PrivacyPage';
import ResourcesPage from './pages/ResourcesPage';
import SubmitResourcePage from './pages/SubmitResourcePage';
import SubmitBlogPostPage from './pages/SubmitBlogPostPage';

// Lazy load heavy components
const AboutPage = lazy(() => import('./pages/AboutPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminResourceEditorPage = lazy(() => import('./pages/AdminResourceEditorPage'));
const AdminBlogPostsPage = lazy(() => import('./pages/AdminBlogPostsPage'));
const AdminBlogPostEditorPage = lazy(() => import('./pages/AdminBlogPostEditorPage'));
const AdminSubmissionsPage = lazy(() => import('./pages/AdminSubmissionsPage'));
const AdminNewsletterPage = lazy(() => import('./pages/AdminNewsletterPage'));
const AdminTaxonomyPage = lazy(() => import('./pages/AdminTaxonomyPage'));

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={
        <Suspense fallback={<div>Loading...</div>}>
          <AdminLoginPage />
        </Suspense>
      } />
      <Route element={<RequireAuth />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="resources" element={<AdminResourcesPage />} />
          <Route path="resources/:id" element={
            <Suspense fallback={<div>Loading...</div>}>
              <AdminResourceEditorPage />
            </Suspense>
          } />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="events/:id" element={<AdminEventEditorPage />} />
          <Route path="gallery" element={<AdminGalleryPage />} />
          <Route path="blog-posts" element={
            <Suspense fallback={<div>Loading...</div>}>
              <AdminBlogPostsPage />
            </Suspense>
          } />
          <Route path="blog-posts/:id" element={
            <Suspense fallback={<div>Loading...</div>}>
              <AdminBlogPostEditorPage />
            </Suspense>
          } />
          <Route path="submissions" element={
            <Suspense fallback={<div>Loading...</div>}>
              <AdminSubmissionsPage />
            </Suspense>
          } />
          <Route path="newsletter" element={
            <Suspense fallback={<div>Loading...</div>}>
              <AdminNewsletterPage />
            </Suspense>
          } />
          <Route path="categories" element={
            <Suspense fallback={<div>Loading...</div>}>
              <AdminTaxonomyPage />
            </Suspense>
          } />
          <Route path="taxonomy" element={
            <Suspense fallback={<div>Loading...</div>}>
              <AdminTaxonomyPage />
            </Suspense>
          } />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>

      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/about" element={
          <Suspense fallback={<div>Loading...</div>}>
            <AboutPage />
          </Suspense>
        } />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/newsletter" element={<NewsletterPage />} />
        <Route path="/submit" element={<SubmitResourcePage />} />
        <Route path="/submit-blog-contribution" element={<SubmitBlogPostPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
