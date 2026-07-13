import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { NAV_CATEGORIES } from '../website.constants';

const navLinkSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    /** Site-relative path; unique because it identifies the page. */
    href: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '', trim: true },
    category: { type: String, required: true, enum: NAV_CATEGORIES },
    /** Comma-separated keywords used to fuzz-match the site search index. */
    keywords: { type: String, default: '', trim: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type NavLinkDocument = InferSchemaType<typeof navLinkSchema>;
export const NavLinkModel: Model<NavLinkDocument> = model<NavLinkDocument>(
  'NavLink',
  navLinkSchema,
);
