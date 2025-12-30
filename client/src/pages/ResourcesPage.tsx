import ResourceExplorer from '../components/ResourceExplorer';

export default function ResourcesPage() {
  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold text-vanillaCustard">Resources</h1>
        <p className="text-base text-vanillaCustard/85">
          Search by what you need. Narrow results by location, type, and audience.
        </p>
      </header>

      <ResourceExplorer />
    </div>
  );
}
