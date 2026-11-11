/** Icons come from the original SVG sprite in /public/static/regulus_oscar/svg/icons.svg */
export default function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <svg className={`icon icon-${name} ${className}`.trim()} role="presentation">
      <use href={`/static/regulus_oscar/svg/icons.svg#${name}`} />
    </svg>
  );
}
