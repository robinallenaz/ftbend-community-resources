export default function AboutPage() {
  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold text-vanillaCustard">About</h1>
        <p className="text-base text-vanillaCustard/85">A community-first resource hub for LGBTQIA+ folks in and around Fort Bend County.</p>
      </header>

      <section className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 text-base text-vanillaCustard/90 shadow-soft">
        <div className="grid gap-4">
          <p>
            This site exists to make resources easier to find—especially when you’re tired, stressed, or just need a clear answer.
          </p>
          <p>
            If something listed here feels unsafe, outdated, or harmful, please reach out so we can review it.
          </p>
          <div className="rounded-2xl bg-graphite/70 p-4">
            <div className="text-lg font-extrabold text-vanillaCustard">Accessibility</div>
            <div className="mt-2">
              You can increase text size in the top right. Everything should work with keyboard navigation.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
