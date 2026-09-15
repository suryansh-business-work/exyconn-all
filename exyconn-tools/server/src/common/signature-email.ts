import sanitizeHtml from "sanitize-html";
import { z } from "zod";

export const SIGNATURE_EMAIL_SUBJECT = "Your email signature preview";

export const signatureTestSchema = z.object({
  to: z.email("Enter a single valid email address").max(254),
  signatureHtml: z
    .string()
    .min(1, "The signature is empty")
    .max(100_000, "The signature is too large to send"),
  senderName: z.string().trim().max(100).optional(),
});

// Inline style values: no url(), expression() or script schemes — colours, sizes,
// fonts and gradients only.
const SAFE_STYLE_VALUE =
  /^(?!.*(?:url|expression|javascript|image-set)\s*[(:])[\w\s#%.,()'"/+-]*$/i;

const STYLE_PROPERTIES = [
  "color",
  "background",
  "background-color",
  "font-size",
  "font-family",
  "font-weight",
  "font-style",
  "line-height",
  "letter-spacing",
  "text-decoration",
  "text-align",
  "vertical-align",
  "white-space",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "border",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "border-radius",
  "width",
  "height",
  "max-width",
  "max-height",
  "object-fit",
  "display",
];

const allowedStyle = Object.fromEntries(
  STYLE_PROPERTIES.map((property) => [property, [SAFE_STYLE_VALUE]]),
);

const TABLE_CELL_ATTRIBUTES = [
  "style",
  "width",
  "height",
  "align",
  "valign",
  "colspan",
  "rowspan",
];

/** The markup the signature generator produces: layout tables, links, images, icons. */
const SIGNATURE_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "table",
    "tbody",
    "thead",
    "tr",
    "td",
    "th",
    "div",
    "p",
    "span",
    "br",
    "hr",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "small",
    "a",
    "img",
    "svg",
    "path",
  ],
  allowedAttributes: {
    table: [
      "style",
      "width",
      "border",
      "cellpadding",
      "cellspacing",
      "align",
      "role",
    ],
    td: TABLE_CELL_ATTRIBUTES,
    th: TABLE_CELL_ATTRIBUTES,
    tr: ["style"],
    tbody: ["style"],
    thead: ["style"],
    div: ["style"],
    p: ["style"],
    span: ["style"],
    strong: ["style"],
    a: ["href", "target", "title", "rel", "style"],
    img: ["src", "alt", "width", "height", "style"],
    svg: ["width", "height", "viewbox", "viewBox", "fill"],
    path: ["d", "fill"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["https"] },
  allowProtocolRelative: false,
  allowedStyles: { "*": allowedStyle },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
};

export function sanitizeSignature(html: string): string {
  return sanitizeHtml(html, SIGNATURE_SANITIZE_OPTIONS);
}

export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** The whole test email: fixed wording around the sanitized signature. */
export function buildSignatureEmail(
  signatureHtml: string,
  senderName?: string,
): string {
  const greeting = senderName
    ? `Here is how the email signature for ${escapeHtml(senderName)} looks:`
    : "Here is how your new email signature looks:";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <p>Hi there,</p>
  <p>This is a test email sent from Exyconn Tools. ${greeting}</p>
  <br/>
  <p>Best regards,</p>
  <br/>
  ${sanitizeSignature(signatureHtml)}
</body>
</html>`;
}
