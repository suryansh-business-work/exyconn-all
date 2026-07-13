import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * SEO metadata is stored as a free-form document (it carries an arbitrary
 * `jsonLd` block) and exposed over the JSON scalar rather than a typed shape.
 */
const seoField = { type: Schema.Types.Mixed, default: {} };

const toolCategorySchema = new Schema(
  {
    /** URL segment from the website data, e.g. "business-utility-tools". */
    slug: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    icon: { type: String, default: '', trim: true },
    color: { type: String, default: '', trim: true },
    seo: seoField,
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type ToolCategoryDocument = InferSchemaType<typeof toolCategorySchema>;
export const ToolCategoryModel: Model<ToolCategoryDocument> = model<ToolCategoryDocument>(
  'ToolCategory',
  toolCategorySchema,
);

const toolPricingSchema = new Schema(
  {
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'USD', trim: true },
    features: { type: [String], default: [] },
    alterationNote: { type: String, default: '', trim: true },
  },
  { _id: false },
);

const toolSchema = new Schema(
  {
    /** Stable business key from the website data. */
    toolCode: { type: String, required: true, unique: true, trim: true },
    /** Slug of the owning ToolCategory. */
    categorySlug: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    longDescription: { type: String, default: '' },
    url: { type: String, default: '', trim: true },
    icon: { type: String, default: '', trim: true },
    color: { type: String, default: '', trim: true },
    features: { type: [String], default: [] },
    useCases: { type: [String], default: [] },
    keywords: { type: [String], default: [] },
    pricing: { type: toolPricingSchema, default: null },
    seo: seoField,
    isActive: { type: Boolean, default: true },
    isMVP: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type ToolDocument = InferSchemaType<typeof toolSchema>;
export const ToolModel: Model<ToolDocument> = model<ToolDocument>('Tool', toolSchema);
