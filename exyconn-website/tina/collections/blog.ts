import type { Collection } from "tinacms";

/** Blog posts: one markdown document per post, the filename is the URL slug (/blog/<slug>). */
export const blogCollection: Collection = {
  name: "blog",
  label: "Blog Posts",
  path: "src/content/blog",
  format: "md",
  fields: [
    { type: "string", name: "title", label: "Title", isTitle: true, required: true },
    {
      type: "string",
      name: "summary",
      label: "Summary",
      required: true,
      ui: { component: "textarea" },
    },
    {
      type: "object",
      name: "author",
      label: "Author",
      required: true,
      fields: [
        { type: "string", name: "name", label: "Name", required: true },
        { type: "string", name: "role", label: "Role" },
        { type: "string", name: "initials", label: "Initials" },
      ],
    },
    { type: "datetime", name: "publishedAt", label: "Published At", required: true },
    {
      type: "string",
      name: "readTime",
      label: "Read Time",
      description: 'For example "5 min read"',
    },
    { type: "string", name: "tags", label: "Tags", list: true },
    { type: "image", name: "coverImage", label: "Cover Image", required: true },
    { type: "boolean", name: "featured", label: "Featured" },
    { type: "rich-text", name: "body", label: "Body", isBody: true },
  ],
};
