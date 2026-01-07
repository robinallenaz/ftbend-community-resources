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

  function nextImage() {
    setCurrentImageIndex((prev) => (prev + 1) % gallery.length);
  }

  function previousImage() {
    setCurrentImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  }

  useEffect(() => {
    fetch('/api/public/gallery')
      .then(r => r.json())
      .then((data: { items: GalleryItem[] }) => setGallery(data.items))
      .catch(console.error);
  }, []);

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-vanillaCustard/10 bg-gradient-to-br from-pitchBlack/60 via-pitchBlack/40 to-pitchBlack/30 backdrop-blur-sm p-8 shadow-soft">
        <div className="grid gap-3">
          <h1 className="text-3xl font-extrabold text-vanillaCustard">About Fort Bend LGBTQIA+ Community Resources</h1>
          <p className="text-base text-vanillaCustard/90">A community-first resource hub for LGBTQIA+ folks in and around Fort Bend County, Texas.</p>
        </div>
      </header>

      {gallery.length > 0 && (
        <section className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 shadow-soft">
          <h2 className="text-xl font-extrabold text-vanillaCustard mb-6">Community Moments</h2>
          <div className="relative group">
            <div className="aspect-video overflow-hidden rounded-xl bg-graphite shadow-inner">
              <img
                src={gallery[currentImageIndex].filename.startsWith('http') ? gallery[currentImageIndex].filename : `https://res.cloudinary.com/df9jxmd8j/image/upload/w_800,h_600,c_fill,q_auto,f_auto/ftbend-community-gallery/${gallery[currentImageIndex].filename}`}
                alt={gallery[currentImageIndex].caption || 'Gallery image'}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            
            {/* Navigation buttons */}
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={previousImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-pitchBlack/90 backdrop-blur-sm p-3 text-vanillaCustard transition-all hover:bg-pitchBlack hover:scale-110 opacity-0 group-hover:opacity-100"
                  aria-label="Previous image"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-pitchBlack/90 backdrop-blur-sm p-3 text-vanillaCustard transition-all hover:bg-pitchBlack hover:scale-110 opacity-0 group-hover:opacity-100"
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

            {/* Image indicators */}
            {gallery.length > 1 && (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                {gallery.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      index === currentImageIndex ? 'bg-paleAmber w-8' : 'bg-vanillaCustard/40 hover:bg-vanillaCustard/60'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 text-base text-vanillaCustard/90 shadow-soft">
        <div className="grid gap-4">
          <h2 className="text-2xl font-extrabold text-vanillaCustard">Our Mission</h2>
          <p>
            This site exists to make LGBTQIA+ resources easier to find—especially when you're tired, stressed, or just need a clear answer. We connect community members with healthcare providers, legal services, support groups, and inclusive events throughout Fort Bend County and across Texas.
          </p>
          
          <h2 className="text-2xl font-extrabold text-vanillaCustard">What You'll Find</h2>
          <ul className="grid gap-2 list-disc list-inside">
            <li><Link to="/resources" className="text-paleAmber hover:underline">LGBTQIA+ Resources</Link> - Healthcare providers, legal services, and support organizations</li>
            <li><Link to="/events" className="text-paleAmber hover:underline">Community Events</Link> - Monthly meetups and inclusive gatherings</li>
            <li><Link to="/submit" className="text-paleAmber hover:underline">Resource Submissions</Link> - Share helpful services with our community</li>
          </ul>

          <h2 className="text-2xl font-extrabold text-vanillaCustard">Community Safety</h2>
          <p>
            If something listed here feels unsafe, outdated, or harmful, please reach out so we can review it. Your feedback helps keep this resource directory trustworthy and helpful for everyone.
          </p>
          
          <div className="rounded-2xl bg-graphite/70 p-4">
            <h3 className="text-lg font-extrabold text-vanillaCustard">Accessibility</h3>
            <p className="mt-2">
              You can increase text size in the top right. Everything should work with keyboard navigation and screen readers for full accessibility.
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

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-pitchBlack/95 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage.filename.startsWith('http') ? selectedImage.filename : `https://res.cloudinary.com/df9jxmd8j/image/upload/w_1200,h_800,c_fit,q_auto,f_auto/ftbend-community-gallery/${selectedImage.filename}`}
            alt={selectedImage.caption || 'Gallery image'}
            className="max-h-full max-w-full rounded-xl object-contain"
          />
          {selectedImage.caption && (
            <p className="absolute bottom-4 left-4 right-4 text-center text-vanillaCustard/90">
              {selectedImage.caption}
            </p>
          )}
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 rounded-lg bg-graphite/80 p-2 text-vanillaCustard hover:bg-graphite"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
