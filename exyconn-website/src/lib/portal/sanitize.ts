import sanitizeHtml from "sanitize-html";

/**
 * Article bodies (blog posts, case studies) are authored as HTML in the portal and
 * rendered here with `set:html`, so they are sanitised first.
 *
 * The portal's editor screens are role-guarded, but "the author was authenticated" is not
 * the same as "the markup is safe to inject" — a stored `<script>` or an `onerror=`
 * attribute would execute on exyconn.com, under exyconn.com's origin. The allow-list below
 * is the union of the tags the migrated bodies actually use (headings, lists, emphasis,
 * blockquotes, links, images, code) plus `class`, which the `.prose .lead` rule styles.
 */
const ARTICLE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...sanitizeHtml.defaults.allowedTags, "h1", "h2", "img", "figure", "figcaption"],
  allowedAttributes: {
    "*": ["class"],
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  // A body may set target="_blank"; rel keeps such a link from reaching back at this page.
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
};

/** The article body, stripped of anything that is not safe to inject into the page. */
export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, ARTICLE_OPTIONS);
}
