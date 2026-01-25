import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

type GalleryItem = {
  _id: string;
  filename: string;
  caption: string;
  order: number;
};

export default function AboutPage() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  function nextImage() {
    if (gallery.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev + 1) % gallery.length);
      setIsTransitioning(false);
    }, 150);
  }

  function previousImage() {
    if (gallery.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
      setIsTransitioning(false);
    }, 150);
  }

  function goToImage(index: number) {
    if (index === currentImageIndex || gallery.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex(index);
      setIsTransitioning(false);
    }, 150);
  }

  function toggleAutoplay() {
    setIsPlaying(!isPlaying);
  }

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || gallery.length <= 1) return;
    
    const interval = setInterval(() => {
      nextImage();
    }, 4000);
    
    return () => clearInterval(interval);
  }, [isPlaying, gallery.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        previousImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === ' ') {
        e.preventDefault();
        toggleAutoplay();
      } else if (e.key === 'Escape' && selectedImage) {
        setSelectedImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  useEffect(() => {
    // Load gallery when component mounts
    fetch('/api/public/gallery')
      .then(r => r.json())
      .then((data: { items: GalleryItem[] }) => {
        // Filter out images that don't actually exist in Cloudinary
        const validImages = data.items.filter(item => {
          // Test if the image exists by trying to load it
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            // Fix the URL before testing
            const fixedUrl = item.filename.replace(/\.jpg\.jpg$/, '.jpg').replace(/\.jpeg\.jpeg$/, '.jpeg').replace(/ftbend-community-gallery\//, '');
            img.src = fixedUrl;
          });
        });
        
        // For now, just use all images and handle 404s gracefully
        setGallery(data.items);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="grid gap-4">
      <header className="rounded-2xl border border-vanillaCustard/10 bg-gradient-to-br from-pitchBlack/60 via-pitchBlack/40 to-pitchBlack/30 backdrop-blur-sm p-8 shadow-soft">
        <div className="grid gap-3">
          <h1 className="text-3xl font-extrabold text-vanillaCustard">About Fort Bend LGBTQIA+ Community Resources</h1>
          <p className="text-base text-vanillaCustard/90">A community-first resource hub for LGBTQIA+ folks in and around Fort Bend County, Texas.</p>
        </div>
      </header>

      {gallery.length > 0 && (
        <section data-gallery-container className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 pb-4 shadow-soft">
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-xl font-extrabold text-vanillaCustard mb-4">Community Moments</h2>
            {gallery.length > 1 && (
              <button
                onClick={toggleAutoplay}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-vanillaCustard/20 text-sm text-vanillaCustard/80 hover:border-vanillaCustard/40 hover:text-vanillaCustard transition-all"
                aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
              >
                {isPlaying ? (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pause
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Play
                  </>
                )}
              </button>
            )}
          </div>
          
          <div className="relative group" tabIndex={0} aria-label="Image carousel">
            <div className="aspect-video overflow-hidden rounded-lg bg-graphite shadow-inner max-w-4xl mx-auto relative">
              <img
                src={gallery[currentImageIndex].filename.includes('cloudinary') 
                  ? gallery[currentImageIndex].filename
                  : gallery[currentImageIndex].filename}
                alt={gallery[currentImageIndex].caption || 'Gallery image'}
                className={`h-full w-full object-cover transition-opacity duration-300 cursor-pointer ${
                  isTransitioning ? 'opacity-50' : 'opacity-100'
                }`}
                onClick={() => setSelectedImage(gallery[currentImageIndex])}
                role="button"
                tabIndex={0}
                aria-label={`Open ${gallery[currentImageIndex].caption || 'Gallery image'} in lightbox`}
                onError={(e) => {
                  // Handle 404 errors gracefully
                  e.currentTarget.style.display = 'none';
                  console.warn('Gallery image failed to load:', e.currentTarget.src);
                }}
              />
            </div>
            
            {/* Navigation buttons */}
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={previousImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-pitchBlack/90 backdrop-blur-sm p-3 text-vanillaCustard transition-all hover:bg-pitchBlack hover:scale-110 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-paleAmber/50"
                  aria-label="Previous image"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-pitchBlack/90 backdrop-blur-sm p-3 text-vanillaCustard transition-all hover:bg-pitchBlack hover:scale-110 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-paleAmber/50"
                  aria-label="Next image"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Caption */}
            {gallery[currentImageIndex].caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-pitchBlack via-pitchBlack/95 to-transparent p-6">
                <p className="text-base font-medium text-vanillaCustard drop-shadow-lg leading-relaxed">{gallery[currentImageIndex].caption}</p>
              </div>
            )}

            {/* Image counter */}
            {gallery.length > 1 && (
              <div className="absolute top-4 right-4 rounded-full bg-pitchBlack/90 backdrop-blur-sm px-3 py-1 text-sm text-vanillaCustard/80">
                {currentImageIndex + 1} / {gallery.length}
              </div>
            )}

            {/* Image indicators */}
            {gallery.length > 1 && (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                {gallery.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => goToImage(index)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      index === currentImageIndex 
                        ? 'bg-paleAmber w-8 shadow-lg shadow-paleAmber/30' 
                        : 'bg-vanillaCustard/40 hover:bg-vanillaCustard/60 hover:scale-125'
                    } focus:outline-none focus:ring-2 focus:ring-paleAmber/50`}
                    aria-label={`Go to image ${index + 1}`}
                    aria-current={index === currentImageIndex}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Keyboard hints */}
          {gallery.length > 1 && (
            <div className="mt-4 text-center text-xs text-vanillaCustard/60">
              Use arrow keys to navigate • Space to {isPlaying ? 'pause' : 'play'} • Click image to expand
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 text-base text-vanillaCustard/90 shadow-soft">
        <div className="grid gap-4">
          <h2 className="text-2xl font-extrabold text-vanillaCustard">Our Mission</h2>
          <p>
            This site exists to make LGBTQIA+ resources easier to find—especially when you're tired, stressed, or just need a clear answer. We connect community members with healthcare providers, legal services, support groups, and inclusive events throughout Fort Bend County and across Texas.
          </p>
          
          <h2 className="text-2xl font-extrabold text-vanillaCustard">Community Safety</h2>
          <p>
            If something listed here feels unsafe, outdated, or harmful, please{' '}
            <a 
              href="mailto:robin@transvoices.us?subject=Community Safety Feedback - FTBend Resources"
              className="text-paleAmber hover:text-vanillaCustard underline transition-colors"
            >
              reach out via email
            </a>
            {' '}so we can review it. Your feedback helps keep this resource directory trustworthy and helpful for everyone.
          </p>
          
          <div className="rounded-2xl bg-graphite/70 p-4">
            <div className="flex items-center gap-3">
              <svg className="h-6 w-6 text-vanillaCustard" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <h3 className="text-lg font-extrabold text-vanillaCustard">Accessibility</h3>
            </div>
            <p className="mt-2">
              You can increase text size in the top right. This site supports keyboard navigation and screen readers for full accessibility.
            </p>
          </div>

          <div className="rounded-2xl bg-graphite/70 p-4">
            <h3 className="text-lg font-extrabold text-vanillaCustard">Website Developer</h3>
            <div className="mt-3 space-y-2">
              <div>
                <a
                  className="inline-flex items-center gap-2 underline underline-offset-4 hover:text-paleAmber"
                  href="https://github.com/robinallenaz"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="currentColor"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
              </div>
              <div>
                <a
                  className="inline-flex items-center gap-2 underline underline-offset-4 hover:text-paleAmber"
                  href="https://www.linkedin.com/in/robin-allen-software-engineer/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="currentColor"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-pitchBlack/95 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedImage(null);
            }
          }}
        >
          <div className="relative max-w-7xl max-h-full">
            <img
              src={selectedImage.filename.includes('cloudinary') 
                ? selectedImage.filename
                : selectedImage.filename}
              alt={selectedImage.caption || 'Gallery image'}
              className="max-h-[80vh] max-w-full rounded-xl object-contain"
              onError={(e) => {
                // Handle 404 errors gracefully
                e.currentTarget.style.display = 'none';
                console.warn('Lightbox image failed to load:', e.currentTarget.src);
                setSelectedImage(null); // Close lightbox if image fails
              }}
            />
            
            {/* Lightbox navigation */}
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = gallery.findIndex(img => img._id === selectedImage._id);
                    const prevIndex = (currentIndex - 1 + gallery.length) % gallery.length;
                    setSelectedImage(gallery[prevIndex]);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-pitchBlack/90 backdrop-blur-sm p-3 text-vanillaCustard transition-all hover:bg-pitchBlack hover:scale-110"
                  aria-label="Previous image in lightbox"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = gallery.findIndex(img => img._id === selectedImage._id);
                    const nextIndex = (currentIndex + 1) % gallery.length;
                    setSelectedImage(gallery[nextIndex]);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-pitchBlack/90 backdrop-blur-sm p-3 text-vanillaCustard transition-all hover:bg-pitchBlack hover:scale-110"
                  aria-label="Next image in lightbox"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Lightbox caption */}
            {selectedImage.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-pitchBlack via-pitchBlack/95 to-transparent p-6">
                <p className="text-center text-vanillaCustard/90 text-lg drop-shadow-lg">{selectedImage.caption}</p>
              </div>
            )}
            
            {/* Lightbox image counter */}
            {gallery.length > 1 && (
              <div className="absolute top-4 right-4 rounded-full bg-pitchBlack/90 backdrop-blur-sm px-3 py-1 text-sm text-vanillaCustard/80">
                {gallery.findIndex(img => img._id === selectedImage._id) + 1} / {gallery.length}
              </div>
            )}
            
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 left-4 rounded-full bg-pitchBlack/90 backdrop-blur-sm p-3 text-vanillaCustard hover:bg-pitchBlack transition-all"
              aria-label="Close lightbox"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
