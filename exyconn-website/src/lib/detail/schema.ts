import { z } from "zod";
import { isShapeId } from "../../scripts/stage3d/shapes/registry";
import type { SceneConfig } from "../../scripts/stage3d/inner/config";
import { LOGO_KEYS } from "./logos";

/**
 * The shape of one capability or service detail page (src/lib/detail/<section>/<slug>.ts).
 * Every module runs its data through `defineDetailPage`, so a missing field or a bad icon
 * name fails the build instead of rendering an empty block.
 */
export const DETAIL_SECTIONS = ["ai", "services"] as const;
export type DetailSection = (typeof DETAIL_SECTIONS)[number];

const MAX_TITLE_WORDS = 8;
const text = z.string().trim().min(1);
/** A Font Awesome free solid icon name without its prefix, e.g. "chart-line". */
const iconName = z.string().regex(/^[a-z\d]+(?:-[a-z\d]+)*$/, "icon names are bare kebab-case");

const sceneSchema = z.custom<SceneConfig>(
  (value) =>
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as SceneConfig).shapes) &&
    (value as SceneConfig).shapes.length > 0 &&
    (value as SceneConfig).shapes.every(isShapeId),
  "scene needs one or more known shape ids"
);

const tabSchema = z.object({
  label: text,
  summary: text,
  text,
  points: z.array(text).min(1),
  logo: z.enum(LOGO_KEYS).optional(),
});

const demoSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("chat"),
    title: text,
    caption: text,
    messages: z.array(z.object({ from: z.enum(["user", "agent"]), text })).min(2),
  }),
  z.object({
    kind: z.literal("trace"),
    title: text,
    caption: text,
    steps: z.array(z.object({ label: text, detail: text.optional() })).min(2),
  }),
]);

export const detailPageSchema = z
  .object({
    section: z.enum(DETAIL_SECTIONS),
    slug: z.string().regex(/^[a-z\d]+(?:-[a-z\d]+)*$/),
    /** The one name used in the breadcrumb, related cards, FAQ heading and CTA. */
    name: text,
    meta: z.object({ title: text, description: text, keywords: text, image: z.url() }),
    hero: z.object({
      title: text.refine(
        (value) => value.split(/\s+/).length <= MAX_TITLE_WORDS,
        `hero titles are ${MAX_TITLE_WORDS} words or fewer`
      ),
      tagline: text,
      lede: text,
      action: z.object({ label: text, href: z.string().startsWith("/") }),
    }),
    intro: z.object({
      title: text,
      icon: iconName,
      term: text,
      definition: text,
    }),
    benefits: z.object({
      title: text,
      items: z
        .array(z.object({ icon: iconName, text }))
        .min(3)
        .max(6),
    }),
    offerings: z.object({
      title: text,
      items: z
        .array(z.object({ icon: iconName, title: text, text }))
        .min(2)
        .max(6),
    }),
    tabs: z.object({ title: text, items: z.array(tabSchema).min(2) }).optional(),
    architecture: z
      .object({
        title: text,
        layers: z
          .array(z.object({ label: text, nodes: z.array(z.string().min(1).max(18)).min(1) }))
          .min(2),
      })
      .optional(),
    demo: demoSchema.optional(),
    /** A chapter the page fills itself (the `live` slot), e.g. a product running on the page. */
    liveDemo: z.object({ title: text, lede: text }).optional(),
    faqs: z.array(z.object({ question: text, answer: text })).min(1),
    logos: z.object({ label: text, keys: z.array(z.enum(LOGO_KEYS)).min(1) }).optional(),
    scene: sceneSchema,
  })
  .refine(
    (page) => page.section !== "ai" || (page.architecture && page.demo),
    "AI capability pages need an architecture and a demo artefact"
  );

export type DetailPage = z.infer<typeof detailPageSchema>;
export type DetailTab = z.infer<typeof tabSchema>;
export type DetailDemo = z.infer<typeof demoSchema>;

/** Validates a page module's data; throws with every problem listed. */
export const defineDetailPage = (data: z.input<typeof detailPageSchema>): DetailPage =>
  detailPageSchema.parse(data);
