import { Link } from 'react-router-dom';
import { sanitizeText } from '../utils/sanitize';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-vanillaCustard mb-4">Privacy Policy</h1>
          <p className="text-lg text-vanillaCustard/80">
            Last updated: February 2026
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-vanillaCustard">Our Commitment to Privacy</h2>
          <p className="text-vanillaCustard/80 leading-relaxed">
            The Fort Bend County LGBTQIA+ Community Resources project is committed to protecting your privacy 
            while providing valuable community services. We believe in transparency and data minimization, 
            especially for vulnerable community members.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-vanillaCustard">Website Analytics</h2>
          <p className="text-vanillaCustard/80 leading-relaxed">
            We partner with Microsoft Clarity to capture how you use and interact with our website through behavioral metrics, heatmaps, and session replay to improve our community services. Website usage data is captured using first and third-party cookies and other tracking technologies to determine the popularity of resources and online activity. Additionally, we use this information for site optimization and fraud/security purposes. For more information about how Microsoft collects and uses your data, visit the{' '}
            <a 
              href="https://privacy.microsoft.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-paleAmber"
            >
              Microsoft Privacy Statement
            </a>.
          </p>
          
          <div className="bg-paleAmber/10 border border-paleAmber/20 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-vanillaCustard">What we collect anonymously:</h3>
            <p className="text-vanillaCustard/80 leading-relaxed">
              We collect information about how people navigate to find resources, which resources are most helpful to our community, 
              and device types to ensure accessibility for everyone. This includes behavioral metrics, heatmaps, and session replays.
            </p>
          </div>

          <div className="bg-graphite/50 border border-vanillaCustard/20 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-vanillaCustard">What we NEVER collect:</h3>
            <p className="text-vanillaCustard/80 leading-relaxed">
              We never collect names, emails, phone numbers, or any contact information without your explicit consent. 
              We do not collect IP addresses or location data that could identify you, track individuals across visits, 
              or gather form inputs and search queries without your knowledge. We never collect any data that could 
              compromise your safety or privacy.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-vanillaCustard">Your Control & Choice</h2>
          <p className="text-vanillaCustard/80 leading-relaxed">
            No consent is required since all data is anonymous and aggregated. You can opt out by using 
            Do Not Track in your browser settings. All data is automatically deleted after 90 days, and we 
            do not use persistent tracking cookies. Our analytics are safe for private and incognito browsing.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-vanillaCustard">Community Resources & Submissions</h2>
          <p className="text-vanillaCustard/80 leading-relaxed">
            We only collect information you explicitly provide when submitting resources or contacting us. 
            Your contact information is used only for stated purposes, and resource submissions are reviewed 
            before publication. You can request removal of your information at any time.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-vanillaCustard">Safety & Access</h2>
          <p className="text-vanillaCustard/80 leading-relaxed">
            We do not engage in individual tracking or profiling of any kind. We never collect location 
            or identifying data, and all data is immediately anonymized. Our analytics are safe for private 
            and incognito browsing, and we never share data that could compromise your safety.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-vanillaCustard">Contact & Questions</h2>
          <div className="bg-paleAmber/10 border border-paleAmber/20 rounded-lg p-4">
            <p className="text-vanillaCustard/80">
              <strong>Email:</strong> {sanitizeText(import.meta.env.VITE_CONTACT_EMAIL || 'newsletter@ftbend-lgbtqia-community.org')}<br/>
              <strong>Response time:</strong> Within 48 hours<br/>
              <strong>Languages:</strong> English
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-vanillaCustard">Changes to This Policy</h2>
          <p className="text-vanillaCustard/80 leading-relaxed">
            We may update this privacy policy as our services evolve. Changes will be posted here 
            with an updated revision date.
          </p>
        </section>

        <div className="pt-8 border-t border-vanillaCustard/20">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-paleAmber hover:text-vanillaCustard underline-offset-4 hover:underline"
          >
            ← Back to Resources
          </Link>
        </div>
      </div>
    </div>
  );
}
