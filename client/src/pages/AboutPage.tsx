import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold text-vanillaCustard">About Fort Bend LGBTQIA+ Community Resources</h1>
        <p className="text-base text-vanillaCustard/85">A community-first resource hub for LGBTQIA+ folks in and around Fort Bend County, Texas.</p>
      </header>

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
            <p className="mt-2">
              This website was developed to serve the Fort Bend County LGBTQIA+ community. Connect with the developer:
            </p>
            <div className="mt-3 space-y-2">
              <div>
                <a
                  className="underline underline-offset-4 hover:text-paleAmber"
                  href="https://github.com/robinallenaz"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
              </div>
              <div>
                <a
                  className="underline underline-offset-4 hover:text-paleAmber"
                  href="https://www.linkedin.com/in/robin-allen-software-engineer/"
                  target="_blank"
                  rel="noreferrer"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
