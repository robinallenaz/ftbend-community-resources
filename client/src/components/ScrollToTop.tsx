import { useState, useEffect } from 'react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className="
        fixed bottom-8 right-8 z-50
        w-12 h-12 md:w-14 md:h-14
        rounded-full
        bg-gradient-to-r from-paleAmber via-vanillaCustard to-powderBlush
        shadow-lg hover:shadow-xl
        transform transition-all duration-300
        hover:scale-110 active:scale-95
        flex items-center justify-center
        group
        border border-vanillaCustard/20
        backdrop-blur-sm
      "
      aria-label="Scroll to top"
    >
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
      
      {/* Hover effect - subtle glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-paleAmber via-vanillaCustard to-powderBlush opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-md" />
    </button>
  );
}
