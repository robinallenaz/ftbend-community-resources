export default function Footer() {
  return (
    <footer className="border-t border-vanillaCustard/15 bg-graphite">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 text-base text-vanillaCustard/85 md:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-lg font-extrabold text-vanillaCustard">There is no community without unity 🏳️‍⚧️🏳️‍🌈</div>
            <div>We host monthly events in Fort Bend County and share resources across South Texas.</div>
          </div>
          <div className="space-y-2 md:text-right">
            <div>
              <a
                className="inline-flex items-center gap-2 underline underline-offset-4 hover:text-paleAmber"
                href="https://instagram.com/ftbend_lgbtqia"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
                </svg>
                <span>Instagram</span>
              </a>
            </div>
            <div>
              <a
                className="inline-flex items-center gap-2 underline underline-offset-4 hover:text-paleAmber"
                href="https://www.facebook.com/share/16a6rc4XjY/?mibextid=wwXIfr"
                target="_blank"
                rel="noreferrer"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M13.5 22v-7.5h2.5l.5-3H13.5V9.2c0-.9.4-1.5 1.6-1.5h1.6V5.1c-.3 0-1.3-.1-2.5-.1-2.6 0-4.2 1.6-4.2 4.6v1.9H7.5v3H10V22h3.5z" />
                </svg>
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 text-sm text-vanillaCustard/70">
          If you need support right now, call The LGBT National Hotline: (888) 843-4564 or Trans Lifeline: (877) 565-8860.
        </div>
      </div>
    </footer>
  );
}
