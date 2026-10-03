import { roleVar } from "../../styles/tokens/semantic.tokens";

/**
 * The home scene's colours, read from the site's colour roles at runtime — the stage carries
 * `data-theme="dark"`, so these are always the night answers. The browser resolves each role
 * (oklch, color-mix) to a computed colour, and a 1×1 canvas turns that into sRGB channels.
 */
export type Rgb = [number, number, number];

const ROLES = {
  deep: "inverse",
  mid: "indigo-night",
  violet: "violet",
  fuchsia: "fuchsia",
  cyan: "cyan-bright",
  sky: "sky-bright",
  amber: "amber-bright",
  orange: "orange",
  line: "fg",
} as const;

export type SceneColor = keyof typeof ROLES;
export type ScenePalette = Record<SceneColor, Rgb>;

const toRgb = (context: CanvasRenderingContext2D, color: string): Rgb => {
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
};

/**
 * Resolves any set of colour roles to sRGB channels as `element` paints them — so a stage
 * with `data-theme="dark"` gets the night answers. Used for the home palette and for an
 * inner page's accent pair.
 */
export const readRoles = <K extends string>(
  element: HTMLElement,
  roles: Readonly<Record<K, string>>
): Record<K, Rgb> => {
  const probe = document.createElement("span");
  probe.hidden = true;
  element.append(probe);
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const entries = Object.entries<string>(roles).map(([name, role]) => {
    probe.style.color = roleVar(role);
    const computed = getComputedStyle(probe).color;
    return [name, context ? toRgb(context, computed) : [0, 0, 0]];
  });
  probe.remove();
  return Object.fromEntries(entries) as Record<K, Rgb>;
};

export const readPalette = (stage: HTMLElement): ScenePalette => readRoles(stage, ROLES);
