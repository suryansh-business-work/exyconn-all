import type { Collection } from "tinacms";

/** Case studies: one markdown document each, the filename is the URL slug (/case-studies/<slug>). */
export const caseStudyCollection: Collection = {
  name: "caseStudy",
  label: "Case Studies",
  path: "src/content/case-studies",
  format: "md",
  fields: [
    { type: "string", name: "title", label: "Title", isTitle: true, required: true },
    {
      type: "string",
      name: "excerpt",
      label: "Excerpt",
      required: true,
      ui: { component: "textarea" },
    },
    { type: "string", name: "category", label: "Category", required: true },
    { type: "string", name: "author", label: "Author" },
    { type: "datetime", name: "publishedAt", label: "Published At", required: true },
    { type: "string", name: "tags", label: "Tags", list: true },
    { type: "image", name: "coverImage", label: "Cover Image", required: true },
    { type: "string", name: "pdfUrl", label: "PDF URL", description: "Optional download link" },
    { type: "boolean", name: "featured", label: "Featured" },
    { type: "rich-text", name: "body", label: "Body", isBody: true },
  ],
};
