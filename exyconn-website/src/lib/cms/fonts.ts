import type { CmsDesignTokens, CmsFontFile, CmsFontSource } from "./types";

/**
 * The fonts a site's design system loads: Google Fonts families through one stylesheet link,
 * uploaded families as @font-face rules. A site with no font sources (exyconn.com loads its own
 * fonts as before) gets neither.
 */
const GOOGLE_CSS = "https://fonts.googleapis.com/css2";
/** The same shapes the server accepts; checked again because they are written into the page. */
const FAMILY = /^[\p{L}\d][\p{L}\d .'&-]{0,79}$/u;
const VARIANT = /^[1-9]00i?$/;
const WEIGHT = /^[1-9]00$/;
const URL_SAFE = /^https:\/\/[^\s"'()<>]+$/;

type GoogleSource = Extract<CmsFontSource, { provider: "GOOGLE" }>;
type CustomSource = Extract<CmsFontSource, { provider: "CUSTOM" }>;

const isGoogle = (source: CmsFontSource): source is GoogleSource =>
  source.provider === "GOOGLE" && FAMILY.test(source.family);
const isCustom = (source: CmsFontSource): source is CustomSource =>
  source.provider === "CUSTOM" && FAMILY.test(source.family);

/** `Inter Tight` + [400, 700, 400i] → `Inter+Tight:ital,wght@0,400;0,700;1,400`. */
function familyQuery(source: GoogleSource): string {
  const styles = source.variants
    .filter((variant) => VARIANT.test(variant))
    .map((variant) => {
      const italic = variant.endsWith("i") ? 1 : 0;
      return { italic, weight: Number.parseInt(variant, 10) };
    })
    .sort((a, b) => a.italic - b.italic || a.weight - b.weight)
    .map(({ italic, weight }) => `${italic},${weight}`);
  const name = source.family.trim().replaceAll(" ", "+");
  return styles.length > 0 ? `${name}:ital,wght@${styles.join(";")}` : name;
}

/** The one Google Fonts stylesheet for every Google family, or "" when there is none. */
export function googleFontsHref(tokens: CmsDesignTokens | undefined): string {
  const families = (tokens?.fontSources ?? []).filter(isGoogle).map(familyQuery);
  if (families.length === 0) {
    return "";
  }
  const query = families.map((family) => `family=${encodeURI(family)}`).join("&");
  return `${GOOGLE_CSS}?${query}&display=swap`;
}

function fontFace(family: string, file: CmsFontFile): string {
  if (!URL_SAFE.test(file.url) || !WEIGHT.test(file.weight)) {
    return "";
  }
  const style = file.style === "italic" ? "italic" : "normal";
  const name = family.replaceAll('"', "");
  return `@font-face{font-family:"${name}";src:url("${file.url}") format("${file.format}");font-weight:${file.weight};font-style:${style};font-display:swap;}`;
}

/** @font-face rules for every uploaded family. */
export function customFontCss(tokens: CmsDesignTokens | undefined): string {
  return (tokens?.fontSources ?? [])
    .filter(isCustom)
    .flatMap((source) => source.files.map((file) => fontFace(source.family, file)))
    .filter(Boolean)
    .join("\n");
}
