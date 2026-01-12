import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 1200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToSearch = () => {
    const searchInput = document.getElementById('resource-search');
    if (searchInput) {
      searchInput.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center' // Puts search bar in middle of viewport
      });
      // Optional: Focus the input for better UX
      setTimeout(() => searchInput.focus(), 500);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToSearch}
      className="
        fixed bottom-8 right-8 z-50
        w-12 h-12 md:w-14 md:h-14
        rounded-full
        bg-gradient-to-r from-paleAmber via-vanillaCustard to-powderBlush
        shadow-lg hover:shadow-xl
        transform transition-all duration-300 ease-out
        hover:scale-110 active:scale-95
        flex items-center justify-center
        group
        border border-vanillaCustard/20
        backdrop-blur-sm
      "
      aria-label="Back to Search"
      style={{
        animation: 'fadeInSlideUp 0.4s ease-out'
      }}
    >
      {/* Text Label */}
      <span className="sr-only">Back to Search</span>
      
      {/* Arrow Icon */}
      <svg
        className="w-5 h-5 md:w-6 md:h-6 text-pitchBlack"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
      
      {/* Visible text label for better accessibility */}
      <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-pitchBlack bg-vanillaCustard/90 px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Back to Search
      </span>
      
      {/* Hover effect - subtle glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-paleAmber via-vanillaCustard to-powderBlush opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-md" />
    </button>
  );
}
