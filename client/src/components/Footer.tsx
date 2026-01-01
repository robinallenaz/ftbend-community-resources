import { Link } from 'react-router-dom';
import NewsletterSignup from './NewsletterSignup';

export default function Footer() {
  return (
    <footer className="border-t border-vanillaCustard/15 bg-graphite">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 text-base text-vanillaCustard/85 md:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="text-lg font-extrabold text-vanillaCustard">There is no community without unity 🏳️‍⚧️🏳️‍🌈</div>
              <div>We host monthly events in Fort Bend County and share resources across South Texas.</div>
            </div>
            <div className="space-y-2 md:text-left">
              <div>
                <a
                  className="underline underline-offset-4 hover:text-paleAmber"
                  href="https://instagram.com/ftbend_lgbtqia"
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
              </div>
              <div>
                <a
                  className="underline underline-offset-4 hover:text-paleAmber"
                  href="https://www.facebook.com/share/16a6rc4XjY/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noreferrer"
                >
                  Facebook
                </a>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-vanillaCustard">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/resources" className="hover:text-paleAmber underline-offset-4 hover:underline">LGBTQIA+ Resources</Link></li>
              <li><Link to="/events" className="hover:text-paleAmber underline-offset-4 hover:underline">Community Events</Link></li>
              <li><Link to="/about" className="hover:text-paleAmber underline-offset-4 hover:underline">About Us</Link></li>
              <li><Link to="/submit" className="hover:text-paleAmber underline-offset-4 hover:underline">Submit a Resource</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-vanillaCustard">Website Developer</h3>
            <div className="space-y-2">
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
          
          <NewsletterSignup />
        </div>
        <div className="mt-8 text-sm text-vanillaCustard/70">
          If you need support right now, call The LGBT National Hotline: (888) 843-4564 or Trans Lifeline: (877) 565-8860.
        </div>
      </div>
    </footer>
  );
}
