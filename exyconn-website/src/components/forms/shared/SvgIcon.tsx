import { iconPaths, type IconName } from "../../../lib/inner/icons";

interface SvgIconProps {
  name: IconName;
  className?: string;
}

/** The React twin of inner/Icon.astro: an inline, decorative SVG from the site icon set. */
export function SvgIcon({ name, className }: Readonly<SvgIconProps>) {
  return (
    <svg
      className={className ? `svg-icon ${className}` : "svg-icon"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {iconPaths(name).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
