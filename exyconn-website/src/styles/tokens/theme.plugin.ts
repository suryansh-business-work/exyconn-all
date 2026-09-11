import plugin from "tailwindcss/plugin";
import { themeSelector } from "../../lib/theme";
import { palette } from "./palette.tokens";
import { scale } from "./scale.tokens";
import { darkRoles, highContrastRoles, lightRoles, roleVar, roles } from "./semantic.tokens";

/**
 * Turns the TypeScript tokens into the site's CSS: every ramp, scale step and daylight
 * role on `:root`, the night roles under `[data-theme="dark"]`, and one Tailwind colour
 * per role. Loaded from `global.css` with `@plugin`, which is also where Tailwind's own
 * palette is switched off — so a raw `bg-gray-100` compiles to nothing.
 */
type Groups = Record<string, Record<string | number, string>>;

const flatten = (prefix: string, groups: Groups): Record<string, string> =>
  Object.fromEntries(
    Object.entries(groups).flatMap(([group, steps]) =>
      Object.entries(steps).map(([step, value]) => [`--${prefix}${group}-${step}`, value])
    )
  );

const roleVars = (answers: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(answers).map(([role, value]) => [`--color-${role}`, value]));

export default plugin(
  ({ addBase, addVariant }) => {
    /* For what a colour role cannot express — which icon the theme toggle shows. */
    addVariant("dark", `&:where(${themeSelector("dark")}, ${themeSelector("dark")} *)`);
    addBase({
      ":root": {
        "color-scheme": "light",
        ...flatten("palette-", palette),
        ...flatten("", scale),
        ...roleVars(lightRoles),
      },
      [themeSelector("dark")]: {
        "color-scheme": "dark",
        ...roleVars(darkRoles),
      },
      /* Tailwind's `ring-offset` gap is white unless told otherwise — wrong on a night page. */
      "*, ::before, ::after": {
        "--tw-ring-offset-color": roleVar("page"),
      },
      "@media (prefers-contrast: high)": {
        [`:root:not(${themeSelector("dark")})`]: roleVars(highContrastRoles),
      },
    });
  },
  {
    theme: {
      extend: {
        colors: {
          transparent: "transparent",
          current: "currentColor",
          inherit: "inherit",
          ...Object.fromEntries(Object.keys(roles).map((role) => [role, roleVar(role)])),
        },
      },
    },
  }
);
