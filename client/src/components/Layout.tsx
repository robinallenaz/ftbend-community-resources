import { Outlet } from 'react-router-dom';
import Footer from './Footer';
import Header from './Header';
import Seo from './Seo';
import SkipLink from './SkipLink';
import ScrollToTop from './ScrollToTop';

export default function Layout() {
  return (
    <div className="min-h-dvh">
      <SkipLink />
      <Seo />
      <Header />
      <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 md:px-6">
        <Outlet />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
