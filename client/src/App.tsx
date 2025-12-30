import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import AboutPage from './pages/AboutPage';
import EventsPage from './pages/EventsPage';
import HomePage from './pages/HomePage';
import ResourcesPage from './pages/ResourcesPage';
import SubmitResourcePage from './pages/SubmitResourcePage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/submit" element={<SubmitResourcePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
