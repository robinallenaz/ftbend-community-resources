type Option = { label: string; value: string };

export default function FilterGroup(args: {
  title: string;
  description?: string;
  options: Option[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}) {
  const { title, description, options, selected, onToggle } = args;

  return (
    <section className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-4">
      <div className="mb-3">
        <div className="text-lg font-extrabold text-vanillaCustard">{title}</div>
        {description ? <div className="text-sm text-vanillaCustard/75">{description}</div> : null}
      </div>

      <div className="grid gap-2">
        {options.map((o) => {
          const id = `${title}-${o.value}`.replace(/\s+/g, '-').toLowerCase();
          const checked = selected.has(o.value);
          return (
            <label
              key={o.value}
              htmlFor={id}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-vanillaCustard/15 bg-graphite/60 px-3 py-2 hover:border-vanillaCustard/35"
            >
              <span className="text-base font-semibold text-vanillaCustard">{o.label}</span>
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(o.value)}
                className="h-5 w-5 accent-paleAmber"
              />
            </label>
          );
        })}
      </div>
    </section>
  );
}
