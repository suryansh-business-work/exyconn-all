/**
 * Tool + tool-category seed fixtures.
 *
 * Content migrated verbatim from the Astro website (`exyconn-website/src/data/toolsData.ts`).
 * The source nested each tool inside its category (`ToolCategory.items`); here that nesting is
 * flattened into two collections — categories keyed by `slug`, and tools keyed by `toolCode`
 * with a `categorySlug` back-reference. `order` preserves the original authoring order.
 *
 * Tools that omit `isActive` in the source are seeded as `isActive: false`, because the website
 * filtered falsy `isActive` out (`items.filter((item) => item.isActive)`) — so those tools are not
 * visible on the live site today. Seeding them `false` preserves current site visibility.
 *
 * The records themselves are data: tool-categories.json and tools.json beside this module.
 */
import type { ToolCategoryInput, ToolInput } from '../../website.inputs';

import toolCategories from './tool-categories.json';
import tools from './tools.json';

export const toolCategoryFixtures: ToolCategoryInput[] = toolCategories;

export const toolFixtures: ToolInput[] = tools;
