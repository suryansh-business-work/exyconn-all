import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const blogAuthorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, default: 'Exyconn' },
    role: { type: String, default: '', trim: true },
    initials: { type: String, default: '', trim: true },
  },
  { _id: false },
);

const blogPostSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String, default: '', trim: true },
    /** Article body as rendered HTML. */
    content: { type: String, default: '' },
    /**
     * CSS for a body designed in the portal's live editor: the rules behind its styled
     * components, keyed by their ids. Empty for a body written in the rich-text editor.
     * The website scopes it to the article before rendering.
     */
    contentCss: { type: String, default: '' },
    author: { type: blogAuthorSchema, required: true, default: () => ({}) },
    readTime: { type: String, default: '', trim: true },
    tags: { type: [String], default: [] },
    coverImage: { type: String, default: '', trim: true },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    publishedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

export type BlogPostDocument = InferSchemaType<typeof blogPostSchema>;
export const BlogPostModel: Model<BlogPostDocument> = model<BlogPostDocument>(
  'BlogPost',
  blogPostSchema,
);
