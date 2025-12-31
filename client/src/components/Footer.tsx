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
              <a className="underline underline-offset-4 hover:text-paleAmber" href="https://instagram.com/ftbend_lgbtqia" target="_blank" rel="noreferrer">
                Instagram
              </a>
            </div>
            <div>
              <a className="underline underline-offset-4 hover:text-paleAmber" href="https://www.facebook.com/share/16a6rc4XjY/?mibextid=wwXIfr" target="_blank" rel="noreferrer">
                Facebook
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
