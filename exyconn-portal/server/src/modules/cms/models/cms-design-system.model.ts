import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A site's design system: its colour roles (light and dark), type, radii, shadows and spacing,
 * rendered by the website as the CSS custom properties its styles already use (--color-<role>,
 * --radius-<k>…), plus any extra CSS. Every site has its own.
 */
const cmsDesignSystemSchema = new Schema(
  {
    siteId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    /**
     * { colors: { light: { role: value }, dark: { role: value } }, fonts: { key: value },
     *   radii: { key: value }, shadows: { key: value }, spacing: { key: value } }
     */
    tokens: { type: Schema.Types.Mixed, required: true, default: () => ({}) },
    extraCss: { type: String, default: '' },
  },
  { timestamps: true, minimize: false },
);

export type CmsDesignSystemDocument = InferSchemaType<typeof cmsDesignSystemSchema>;

export const CmsDesignSystemModel: Model<CmsDesignSystemDocument> = model<CmsDesignSystemDocument>(
  'CmsDesignSystem',
  cmsDesignSystemSchema,
);
