export default function Icon({ name, fill = false, className = '' }) {
  return (
    <span className={`msr ${className}`} style={{ fontVariationSettings: `'FILL' ${fill ? 1 : 0}` }} aria-hidden>
      {name}
    </span>
  );
}
