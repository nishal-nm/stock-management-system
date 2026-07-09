/**
 * SubVariantLabel — reusable component that renders a sub-variant's options
 * as "VariantName: Value" pairs.
 *
 * Props:
 *   options  — array of { id, variant_name, value } from the API
 *   mode     — "pills" (default) | "inline"
 *              pills  → each pair is a small badge, wraps naturally
 *              inline → pairs joined with " • " in a single span
 *   fallback — plain string shown when options is empty (e.g. sv.name)
 */
export default function SubVariantLabel({ options = [], mode = 'pills', fallback = '—' }) {
  if (!options || options.length === 0) {
    return <span className="text-slate-500 text-xs italic">{fallback}</span>;
  }

  if (mode === 'inline') {
    const parts = options.map(o =>
      o.variant_name ? `${o.variant_name}: ${o.value}` : o.value
    );
    return (
      <span className="text-xs text-slate-700 font-medium">
        {parts.join(' • ')}
      </span>
    );
  }

  // Default: pill mode
  return (
    <span className="flex flex-wrap gap-1">
      {options.map(o => (
        <span
          key={o.id}
          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 border border-slate-200 text-slate-700 whitespace-nowrap"
        >
          {o.variant_name ? (
            <>
              <span className="text-slate-400 mr-0.5">{o.variant_name}:</span>
              {o.value}
            </>
          ) : (
            o.value
          )}
        </span>
      ))}
    </span>
  );
}
