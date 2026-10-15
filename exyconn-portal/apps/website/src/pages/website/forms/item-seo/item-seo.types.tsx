import { z } from 'zod';
import type { ItemSeoFieldsFragment } from '@exyconn/shell/graphql/generated';

/** An item's own search and share meta; each blank field keeps the page template's. */
export const itemSeoSchema = z.object({
  title: z.string().trim().max(200, 'Keep the meta title under 200 characters'),
  description: z.string().trim().max(500, 'Keep the meta description under 500 characters'),
  keywords: z.string().trim().max(500, 'Keep the keywords under 500 characters'),
  ogImageUrl: z.string().trim().max(500, 'That image address is too long'),
  noindex: z.boolean(),
});

export type ItemSeoValues = z.infer<typeof itemSeoSchema>;

/** Items saved before meta existed have none, so every field starts blank. */
export const toItemSeoValues = (seo: ItemSeoFieldsFragment | null | undefined): ItemSeoValues => ({
  title: seo?.title ?? '',
  description: seo?.description ?? '',
  keywords: seo?.keywords ?? '',
  ogImageUrl: seo?.ogImageUrl ?? '',
  noindex: seo?.noindex ?? false,
});
