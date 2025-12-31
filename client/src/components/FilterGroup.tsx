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
    <fieldset className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-4">
      <legend className="mb-3">
        <div className="text-lg font-extrabold text-vanillaCustard">{title}</div>
        {description ? <div className="text-sm text-vanillaCustard/75">{description}</div> : null}
      </legend>

      <div className="grid gap-2" role="group" aria-label={`${title} filters`}>
        {options.map((o) => {
          const id = `${title}-${o.value}`.replace(/\s+/g, '-').toLowerCase();
          const checked = selected.has(o.value);
          return (
            <label
              key={o.value}
              htmlFor={id}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-vanillaCustard/15 bg-graphite/60 px-3 py-2 hover:border-vanillaCustard/35 focus-within:ring-2 focus-within:ring-paleAmber focus-within:ring-offset-2 focus-within:ring-offset-pitchBlack transition"
            >
              <span className="text-base font-semibold text-vanillaCustard">{o.label}</span>
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(o.value)}
                className="h-5 w-5 accent-paleAmber focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-2 focus:ring-offset-graphite"
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
