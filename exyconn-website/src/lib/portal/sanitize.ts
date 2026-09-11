import sanitizeHtml from "sanitize-html";

/**
 * The class the detail pages wrap an article body in. The portal's live editor puts the
 * same class on its canvas body (exyconn-portal/apps/website `ARTICLE_CLASS`), so the
 * article rules in `styles/article.css` apply there exactly as they do here.
 */
export const ARTICLE_CLASS = "article-body";

/** A colour as the editors write it: hex, or the rgb / rgba function a browser normalises it to. */
const COLOR =
  /^(#[\da-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\))$/i;
const LENGTH = /^\d+(\.\d+)?(px|%|em|rem)$/;
const ALIGN = /^(left|right|center|justify)$/;

/**
 * Article bodies (blog posts, case studies) are authored as HTML in the portal and
 * rendered here with `set:html`, so they are sanitised first.
 *
 * The portal's editor screens are role-guarded, but "the author was authenticated" is not
 * the same as "the markup is safe to inject" — a stored `<script>` or an `onerror=`
 * attribute would execute on exyconn.com, under exyconn.com's origin. The allow-list is
 * what the portal's two editors produce: the rich-text editor (headings, lists, check
 * lists, tables, images, code, links, and alignment / colour / highlight as inline
 * styles) and the live editor (the same blocks, styled through id-keyed CSS rules).
 */
const ARTICLE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "h1",
    "h2",
    "img",
    "figure",
    "figcaption",
    "label",
    "input",
  ],
  allowedAttributes: {
    // `id` carries a live-editor design's CSS rules; `style` is filtered by allowedStyles.
    "*": ["class", "id", "style"],
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    th: ["colspan", "rowspan", "colwidth"],
    td: ["colspan", "rowspan", "colwidth"],
    ul: ["data-type"],
    li: ["data-type", "data-checked"],
    mark: ["data-color"],
    input: ["type", "checked", "disabled"],
  },
  allowedStyles: {
    "*": { "text-align": [ALIGN], color: [COLOR], "background-color": [COLOR] },
    table: { width: [LENGTH], "min-width": [LENGTH] },
    col: { width: [LENGTH], "min-width": [LENGTH] },
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    // A body may set target="_blank"; rel keeps such a link from reaching back at this page.
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    // The live editor's text toolbar writes <strike>; <s> is its current name.
    strike: "s",
    // The only input a body has is a check-list tick, and a reader cannot change it.
    input: (_tagName, attribs) => ({
      tagName: "input",
      attribs: {
        type: "checkbox",
        disabled: "",
        ...(attribs.checked === undefined ? {} : { checked: "" }),
      },
    }),
  },
};

/** The article body, stripped of anything that is not safe to inject into the page. */
export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, ARTICLE_OPTIONS);
}

/**
 * Whether every `{` in the rules is closed, and no `}` closes more than was opened.
 * Unbalanced braces are the one way a rule could step out of the article scope below.
 */
function hasBalancedBraces(css: string): boolean {
  let depth = 0;
  for (const char of css.replaceAll(/\/\*[\s\S]*?\*\//g, "")) {
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth < 0) {
        return false;
      }
    }
  }
  return depth === 0;
}

/**
 * A live-editor design's CSS, nested under the article (CSS nesting), so none of its
 * rules can reach the rest of the page. `<` is escaped so the rules cannot close the
 * `<style>` element they are printed into; rules with unbalanced braces are dropped.
 */
export function scopeArticleCss(css: string): string {
  const rules = css.trim();
  if (!rules || !hasBalancedBraces(rules)) {
    return "";
  }
  return `.${ARTICLE_CLASS}{${rules.replaceAll("<", String.raw`\3c `)}}`;
}
