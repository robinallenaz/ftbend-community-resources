import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import TextSizeToggle from './TextSizeToggle';

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }: { isActive: boolean }) =>
        [
          'rounded-xl px-3 py-2 text-base font-semibold transition outline-none',
          'hover:bg-pitchBlack/70 hover:text-vanillaCustard',
          isActive ? 'bg-pitchBlack text-vanillaCustard shadow-soft border border-paleAmber/30' : 'text-vanillaCustard/95',
          'focus-visible:ring-2 focus-visible:ring-paleAmber focus-visible:ring-offset-2 focus-visible:ring-offset-graphite'
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [textScale, setTextScale] = useState(1);
  const previousOverflowRef = useRef('');

  // Memoize text scale check to prevent excessive re-computation
  const checkTextScale = useCallback(() => {
    try {
      // Check the CSS custom property set by TextSizeToggle
      const rootElement = document.documentElement;
      const computedStyle = window.getComputedStyle(rootElement);
      const scaleValue = computedStyle.getPropertyValue('--text-scale');
      const scale = parseFloat(scaleValue) || 1;
      
      if (import.meta.env.DEV) {
        console.log('Text scale detected:', scale, 'CSS property:', scaleValue);
      }
      setTextScale(scale);
    } catch (error) {
      console.error('Error checking text scale:', error);
      setTextScale(1); // Fallback to default
    }
  }, []);

  // Check text scale on mount and when it changes
  useEffect(() => {
    // Initial check
    checkTextScale();
    
    // Listen for text scale changes via custom event
    const handleTextScaleChange = (event: Event) => {
      try {
        const customEvent = event as CustomEvent<{ scale?: number }>;
        
        // Validate event structure
        if (!customEvent.detail || typeof customEvent.detail.scale !== 'number') {
          if (import.meta.env.DEV) {
            console.warn('Invalid text scale event structure:', customEvent.detail);
          }
          checkTextScale(); // Re-sync with CSS
          return;
        }
        
        const { scale } = customEvent.detail;
        
        // Validate scale value to match usage thresholds
        if (scale >= 0.8 && scale <= 1.4) {
          if (import.meta.env.DEV) {
          console.log('Text scale changed via event:', scale);
        }
          setTextScale(scale);
        } else {
          if (import.meta.env.DEV) {
          console.warn('Invalid scale value received:', scale);
        }
          checkTextScale(); // Re-sync with CSS
        }
      } catch (error) {
        console.error('Error handling text scale change:', error);
        checkTextScale(); // Re-sync with CSS on error
      }
    };

    window.addEventListener('textScaleChange', handleTextScaleChange);

    return () => {
      window.removeEventListener('textScaleChange', handleTextScaleChange);
    };
  }, [checkTextScale]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      // Store the current overflow value when menu opens
      previousOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      // Restore the stored overflow value when menu closes
      document.body.style.overflow = previousOverflowRef.current;
    }

    return () => {
      // Always restore the stored overflow value on cleanup
      document.body.style.overflow = previousOverflowRef.current;
    };
  }, [mobileMenuOpen]);

  const shouldShowIconOnly = textScale >= 1.15; // A+ and larger
const shouldHideNewsletter = textScale >= 1.25; // A++ and larger

  return (
    <>
      {/* Skip to content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-powderBlush text-pitchBlack px-4 py-2 rounded-xl font-bold z-50"
      >
        Skip to main content
      </a>
      
      <header className="sticky top-0 z-50 border-b border-vanillaCustard/15 bg-graphite/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-2 py-3 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-pitchBlack/60 outline-none transition focus-visible:ring-2 focus-visible:ring-paleAmber focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
            aria-label="Go to homepage"
          >
            <img
              src="https://res.cloudinary.com/dpus8jzix/image/upload/q_auto,f_auto,w_64,h_64,c_fill/ftbend-lgbtqia-logo_erkzpu.jpg"
              alt="Fort Bend County LGBTQIA+ Community logo"
              className="h-10 w-10 rounded-xl object-cover flex-shrink-0"
            />
            <div className="hidden sm:block">
              <div className="text-base font-extrabold leading-tight text-vanillaCustard">
                Fort Bend County LGBTQIA+ Community
              </div>
            </div>
          </button>

          <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
            <NavItem to="/" label="Home" />
            <NavItem to="/resources" label="Resources" />
            <NavItem to="/events" label="Events" />
            <NavItem to="/blog" label="Blog" />
            <NavItem to="/about" label="About" />
            <NavItem to="/submit" label="Submit a Resource" />
          </nav>

          <div className="flex items-center gap-3 flex-shrink-0 pr-4 md:pr-4 lg:pr-6">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-xl border border-vanillaCustard/20 bg-graphite p-3 text-vanillaCustard/90 min-w-[44px] min-h-[44px] outline-none focus-visible:ring-2 focus-visible:ring-paleAmber focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            
            <div className="hidden sm:flex items-center gap-1 rounded-xl border border-vanillaCustard/15 bg-graphite/50 p-1">
              <TextSizeToggle />
            </div>
            
            {!shouldHideNewsletter && (
            <button
              type="button"
              className="rounded-xl bg-powderBlush px-3 py-2 text-base font-bold text-pitchBlack shadow-soft transition hover:brightness-95 outline-none focus-visible:ring-2 focus-visible:ring-paleAmber focus-visible:ring-offset-2 focus-visible:ring-offset-graphite flex-shrink-0 min-w-[44px] min-h-[44px] group relative"
              onClick={() => navigate('/newsletter')}
              aria-label="Subscribe to newsletter"
            >
              {shouldShowIconOnly ? (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-semibold text-vanillaCustard bg-pitchBlack/90 backdrop-blur-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none border border-vanillaCustard/20 shadow-soft">
                    Newsletter
                  </span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Newsletter</span>
                  <svg className="h-5 w-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </>
              )}
            </button>
          )}
          </div>
        </div>
      </header>

      {/* Mobile site name below header */}
      <div className="md:hidden px-4 py-2 bg-pitchBlack/50 border-b border-vanillaCustard/10">
        <div className="text-center text-xs font-extrabold leading-tight text-vanillaCustard">
          Fort Bend County LGBTQIA+ Community
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-pitchBlack/95 backdrop-blur-sm animate-slide-in-right">
          <div className="flex flex-col h-full transform transition-transform duration-300 ease-out overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-vanillaCustard/15 flex-shrink-0">
              <h2 className="text-lg font-extrabold text-vanillaCustard">Menu</h2>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl border border-vanillaCustard/20 bg-graphite p-2 text-vanillaCustard/90 transform transition-transform duration-150 active:scale-95 hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-paleAmber focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
                aria-label="Close menu"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4" aria-label="Mobile navigation">
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-base font-semibold transition-all duration-200 transform active:scale-95 hover:translate-x-1 ${
                    location.pathname === '/' 
                      ? 'border-paleAmber bg-paleAmber/20 text-paleAmber shadow-soft' 
                      : 'border-vanillaCustard/20 bg-graphite text-vanillaCustard hover:bg-pitchBlack/60'
                  }`}
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/resources');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-base font-semibold transition-all duration-200 transform active:scale-95 hover:translate-x-1 ${
                    location.pathname === '/resources' 
                      ? 'border-paleAmber bg-paleAmber/20 text-paleAmber shadow-soft' 
                      : 'border-vanillaCustard/20 bg-graphite text-vanillaCustard hover:bg-pitchBlack/60'
                  }`}
                >
                  Resources
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/events');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-base font-semibold transition-all duration-200 transform active:scale-95 hover:translate-x-1 ${
                    location.pathname === '/events' 
                      ? 'border-paleAmber bg-paleAmber/20 text-paleAmber shadow-soft' 
                      : 'border-vanillaCustard/20 bg-graphite text-vanillaCustard hover:bg-pitchBlack/60'
                  }`}
                >
                  Events
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/blog');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-base font-semibold transition-all duration-200 transform active:scale-95 hover:translate-x-1 ${
                    location.pathname === '/blog' 
                      ? 'border-paleAmber bg-paleAmber/20 text-paleAmber shadow-soft' 
                      : 'border-vanillaCustard/20 bg-graphite text-vanillaCustard hover:bg-pitchBlack/60'
                  }`}
                >
                  Blog
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/about');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-base font-semibold transition-all duration-200 transform active:scale-95 hover:translate-x-1 ${
                    location.pathname === '/about' 
                      ? 'border-paleAmber bg-paleAmber/20 text-paleAmber shadow-soft' 
                      : 'border-vanillaCustard/20 bg-graphite text-vanillaCustard hover:bg-pitchBlack/60'
                  }`}
                >
                  About
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/submit');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-base font-semibold transition-all duration-200 transform active:scale-95 hover:translate-x-1 ${
                    location.pathname === '/submit' 
                      ? 'border-paleAmber bg-paleAmber/20 text-paleAmber shadow-soft' 
                      : 'border-vanillaCustard/20 bg-graphite text-vanillaCustard hover:bg-pitchBlack/60'
                  }`}
                >
                  Submit a Resource
                </button>
              </div>
              
              {/* Accessibility Section */}
              <div className="mt-6 pt-6 border-t border-vanillaCustard/15">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="h-5 w-5 text-vanillaCustard/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-base font-extrabold text-vanillaCustard">Accessibility</h3>
                </div>
                <div className="rounded-xl border border-vanillaCustard/15 bg-graphite/50 p-3">
                  <div className="text-sm font-semibold text-vanillaCustard/90 mb-2">Text Size</div>
                  <TextSizeToggle />
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
