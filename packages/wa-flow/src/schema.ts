/**
 * The stored shape of a demo and its workflows, as Zod schemas. The server parses every
 * draft and every publish with these; the editor's inspector forms and the engine read the
 * inferred types. A workflow graph is React Flow's own shape — `{ id, type, position, data }`
 * nodes and `{ id, source, sourceHandle, target }` edges — so the editor uses it directly.
 */
import { z } from 'zod';
import { ACCENT_KEYS, ICON_KEYS } from './visuals';

/** Limits WhatsApp itself enforces on interactive messages. */
export const LIMITS = {
  buttons: 3,
  buttonTitle: 20,
  listRows: 10,
  listSections: 10,
  rowTitle: 24,
  rowDescription: 72,
  ctaActions: 2,
  carouselCards: 10,
  text: 1024,
  header: 60,
  footer: 60,
} as const;

const id = z.string().trim().min(1).max(64);
/**
 * `@exyconn/regex`'s SLUG, restated: the server loads this package compiled, and the regex
 * package ships TypeScript source only, so it cannot be a runtime dependency here.
 */
const SLUG = /^[a-z\d-]+$/;
const slug = z.string().trim().regex(SLUG).max(64);
const text = z.string().trim().min(1).max(LIMITS.text);
const optionalShort = z.string().trim().max(LIMITS.header).optional();
const vars = z.record(z.string(), z.string().max(500));
/** A number, or a `{{var}}` template that resolves to one. */
const amount = z.union([z.number(), z.string().trim().min(1).max(120)]);

export const iconSchema = z.enum(ICON_KEYS);
export const accentSchema = z.enum(ACCENT_KEYS);

export const illustrationSchema = z.object({
  icon: iconSchema,
  accent: accentSchema,
  title: optionalShort,
  subtitle: optionalShort,
});

export const buttonSchema = z.object({
  id,
  title: z.string().trim().min(1).max(LIMITS.buttonTitle),
  set: vars.optional(),
});

export const rowSchema = z.object({
  id,
  title: z.string().trim().min(1).max(LIMITS.rowTitle),
  description: z.string().trim().max(LIMITS.rowDescription).optional(),
  set: vars.optional(),
});

export const sectionSchema = z.object({
  id,
  title: z.string().trim().min(1).max(LIMITS.rowTitle),
  rows: z.array(rowSchema).min(1),
});

/** Rows generated at run time: the next N days, or free slots on a chosen day. */
export const dynamicRowsSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('days'),
    count: z.number().int().min(1).max(LIMITS.listRows),
    skipSundays: z.boolean().optional(),
    /** Gets the day (epoch ms); `<var>Label` gets it formatted. */
    var: id,
  }),
  z.object({
    kind: z.literal('slots'),
    /** Variable holding the chosen day (epoch ms). */
    dayVar: id,
    from: z.number().int().min(0).max(23),
    to: z.number().int().min(1).max(24),
    stepMin: z.number().int().min(5).max(240),
    take: z.number().int().min(1).max(LIMITS.listRows),
    var: id,
  }),
]);

export const ctaActionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('url'),
    title: z.string().trim().min(1).max(25),
    url: z.string().trim().min(1).max(500),
  }),
  z.object({
    kind: z.literal('call'),
    title: z.string().trim().min(1).max(25),
    phone: z.string().trim().min(3).max(40),
  }),
  z.object({
    kind: z.literal('calendar'),
    title: z.string().trim().min(1).max(25),
    event: z.object({
      title: z.string().trim().min(1).max(120),
      /** Epoch ms, or a `{{var}}` holding one. */
      start: z.string().trim().min(1).max(120),
      durationMin: z
        .number()
        .int()
        .min(5)
        .max(24 * 60),
      location: z.string().trim().max(200).optional(),
    }),
  }),
]);

export const productSchema = z.object({
  id,
  title: z.string().trim().min(1).max(80),
  subtitle: z.string().trim().max(120).optional(),
  price: amount,
  mrp: amount.optional(),
  badge: z.string().trim().max(24).optional(),
  image: illustrationSchema,
  /** The card's button title; its edge leaves from the card's id. */
  buttonTitle: z.string().trim().max(LIMITS.buttonTitle).optional(),
  set: vars.optional(),
});

const docSectionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('fields'),
    heading: z.string().max(80).optional(),
    fields: z.array(z.object({ label: z.string().max(60), value: z.string().max(200) })),
  }),
  z.object({
    kind: z.literal('table'),
    heading: z.string().max(80).optional(),
    columns: z.array(z.string().max(40)).min(1).max(6),
    rows: z.array(
      z.object({
        id,
        cells: z.array(z.string().max(80)),
        flag: z.enum(['high', 'low']).optional(),
      }),
    ),
  }),
  z.object({
    kind: z.literal('text'),
    heading: z.string().max(80).optional(),
    text: z.string().max(2000),
  }),
]);

export const documentSchema = z.object({
  fileName: z.string().trim().min(1).max(120),
  fileType: z.enum(['PDF', 'XLSX', 'DOCX']),
  pages: z.number().int().min(1).max(500),
  sizeKb: z.number().int().min(1).max(100_000),
  preview: z.object({
    title: z.string().trim().min(1).max(120),
    subtitle: z.string().max(200).optional(),
    sections: z.array(docSectionSchema),
    footer: z.string().max(300).optional(),
  }),
});

export const locationSchema = z.object({
  name: z.string().trim().min(1).max(80),
  address: z.string().trim().min(1).max(200),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(3).max(40),
  role: z.string().max(80).optional(),
  organisation: z.string().max(80).optional(),
});

export const ticketSchema = z.object({
  ticketId: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(80),
  subtitle: z.string().max(120).optional(),
  fields: z.array(z.object({ label: z.string().max(40), value: z.string().max(120) })).max(8),
  qrData: z.string().trim().min(1).max(300),
});

export const orderSchema = z.object({
  orderId: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(80),
  items: z
    .array(
      z.object({
        id,
        name: z.string().trim().min(1).max(80),
        qty: z.number().int().min(1),
        price: amount,
      }),
    )
    .min(1),
  adjustments: z
    .array(z.object({ id, label: z.string().trim().min(1).max(60), amount }))
    .optional(),
  status: z.enum(['pending', 'paid']),
  /** Title of the pay button while pending; its edge leaves from handle `pay`. */
  payTitle: z.string().trim().max(LIMITS.buttonTitle).optional(),
});

export const INPUT_KINDS = ['name', 'phone', 'email', 'date', 'pincode', 'number', 'text'] as const;
export const ENTITY_KINDS = [
  'name',
  'phone',
  'email',
  'date',
  'time',
  'datetime',
  'location',
  'number',
  'text',
] as const;
export const CONDITION_OPS = ['eq', 'neq', 'contains', 'empty', 'notEmpty', 'gt', 'lt'] as const;

/** Fields every node may carry. */
const common = {
  /** Variables set when the node is entered; values may use `{{var}}` and `$fn` helpers. */
  set: vars.optional(),
  /** Reaching this node completes its workflow (analytics). */
  complete: z.boolean().optional(),
  /** Editor-only note. */
  note: z.string().max(300).optional(),
};

const node = <T extends string, D extends z.ZodRawShape>(type: T, data: D) =>
  z.object({
    id,
    type: z.literal(type),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z.object({ ...common, ...data }),
  });

export const NODE_SCHEMAS = {
  text: node('text', { text }),
  buttons: node('buttons', {
    header: optionalShort,
    text,
    footer: optionalShort,
    buttons: z.array(buttonSchema).min(1).max(LIMITS.buttons),
  }),
  list: node('list', {
    header: optionalShort,
    text,
    footer: optionalShort,
    button: z.string().trim().min(1).max(LIMITS.buttonTitle),
    sections: z.array(sectionSchema).max(LIMITS.listSections),
    dynamic: dynamicRowsSchema.optional(),
  }),
  cta: node('cta', {
    header: optionalShort,
    text,
    footer: optionalShort,
    actions: z.array(ctaActionSchema).min(1).max(LIMITS.ctaActions),
  }),
  image: node('image', {
    image: illustrationSchema,
    caption: z.string().max(LIMITS.text).optional(),
  }),
  document: node('document', {
    document: documentSchema,
    caption: z.string().max(LIMITS.text).optional(),
  }),
  location: node('location', {
    location: locationSchema,
    caption: z.string().max(LIMITS.text).optional(),
  }),
  contact: node('contact', { contact: contactSchema }),
  product: node('product', { product: productSchema }),
  carousel: node('carousel', {
    text: z.string().max(LIMITS.text).optional(),
    cards: z.array(productSchema).min(1).max(LIMITS.carouselCards),
  }),
  ticket: node('ticket', { ticket: ticketSchema, caption: z.string().max(LIMITS.text).optional() }),
  order: node('order', { order: orderSchema }),
  notice: node('notice', { text }),
  input: node('input', {
    prompt: z.string().max(LIMITS.text).optional(),
    var: id,
    kind: z.enum(INPUT_KINDS),
    error: z.string().max(300).optional(),
    /** `date` only: the date must not be in the future (a date of birth). */
    past: z.boolean().optional(),
  }),
  ai: node('ai', {
    prompt: z.string().max(LIMITS.text).optional(),
    /** What the customer may want; each intent is an outgoing handle. */
    intents: z.array(z.object({ id, description: z.string().trim().min(1).max(200) })).max(10),
    /** Values to pull out of the text into variables. */
    entities: z
      .array(
        z.object({
          name: id,
          kind: z.enum(ENTITY_KINDS),
          description: z.string().trim().min(1).max(200),
        }),
      )
      .max(10),
    /** Said before re-asking when the text was not understood. */
    retry: z.string().max(300).optional(),
  }),
  condition: node('condition', {
    cases: z
      .array(
        z.object({ id, var: id, op: z.enum(CONDITION_OPS), value: z.string().max(200).optional() }),
      )
      .min(1)
      .max(6),
  }),
  delay: node('delay', { ms: z.number().int().min(100).max(60_000) }),
  reminder: node('reminder', {
    afterMs: z
      .number()
      .int()
      .min(1_000)
      .max(24 * 60 * 60 * 1000),
    label: z.string().max(80).optional(),
  }),
  handoff: node('handoff', { text, agentName: z.string().trim().min(1).max(60) }),
  jump: node('jump', { workflowKey: id }),
  end: node('end', { text: z.string().max(LIMITS.text).optional(), showMenu: z.boolean() }),
} as const;

export type NodeType = keyof typeof NODE_SCHEMAS;
export const NODE_TYPES = Object.keys(NODE_SCHEMAS) as NodeType[];

export const nodeSchema = z.discriminatedUnion('type', [
  NODE_SCHEMAS.text,
  NODE_SCHEMAS.buttons,
  NODE_SCHEMAS.list,
  NODE_SCHEMAS.cta,
  NODE_SCHEMAS.image,
  NODE_SCHEMAS.document,
  NODE_SCHEMAS.location,
  NODE_SCHEMAS.contact,
  NODE_SCHEMAS.product,
  NODE_SCHEMAS.carousel,
  NODE_SCHEMAS.ticket,
  NODE_SCHEMAS.order,
  NODE_SCHEMAS.notice,
  NODE_SCHEMAS.input,
  NODE_SCHEMAS.ai,
  NODE_SCHEMAS.condition,
  NODE_SCHEMAS.delay,
  NODE_SCHEMAS.reminder,
  NODE_SCHEMAS.handoff,
  NODE_SCHEMAS.jump,
  NODE_SCHEMAS.end,
]);

export const edgeSchema = z.object({
  id,
  source: id,
  /** Which output: a button/row/card/case/intent id, or `next`, `later`, `pay`, `else`, `fallback`. */
  sourceHandle: id,
  target: id,
});

export const graphSchema = z.object({
  start: id,
  nodes: z.array(nodeSchema).min(1).max(300),
  edges: z.array(edgeSchema).max(1000),
});

export const workflowSchema = z.object({
  /** Stable slug within its demo, used by `jump` nodes and analytics. */
  key: slug,
  name: z.string().trim().min(1).max(LIMITS.rowTitle),
  description: z.string().trim().max(LIMITS.rowDescription),
  keywords: z.array(z.string().trim().min(1).max(40)).max(20),
  order: z.number().int().min(0),
  graph: graphSchema,
});

export const businessSchema = z.object({
  name: z.string().trim().min(1).max(80),
  tagline: z.string().trim().max(120),
  category: z.string().trim().min(1).max(60),
  about: z.string().trim().max(500),
  icon: iconSchema,
  accent: accentSchema,
  verified: z.boolean(),
  phone: z.string().trim().max(40),
  email: z.string().trim().max(120),
  website: z.string().trim().max(200),
  address: z.string().trim().max(200),
  hours: z.string().trim().max(120),
});

export const demoSchema = z.object({
  /** URL slug, e.g. `healthcare`. */
  key: slug,
  industry: z.string().trim().min(1).max(60),
  business: businessSchema,
  greeting: text,
  menuText: text,
  menuButton: z.string().trim().min(1).max(LIMITS.buttonTitle),
  order: z.number().int().min(0),
  active: z.boolean(),
});

export type WaNode = z.infer<typeof nodeSchema>;
export type WaEdge = z.infer<typeof edgeSchema>;
export type WaGraph = z.infer<typeof graphSchema>;
export type WorkflowDef = z.infer<typeof workflowSchema>;
export type DemoProfile = z.infer<typeof demoSchema>;
export type NodeOf<T extends NodeType> = Extract<WaNode, { type: T }>;
export type Illustration = z.infer<typeof illustrationSchema>;
export type Product = z.infer<typeof productSchema>;
export type DocumentAttachment = z.infer<typeof documentSchema>;
export type DocSection = DocumentAttachment['preview']['sections'][number];
export type LocationPin = z.infer<typeof locationSchema>;
export type ContactCard = z.infer<typeof contactSchema>;
export type Ticket = z.infer<typeof ticketSchema>;
export type OrderDef = z.infer<typeof orderSchema>;
export type CtaAction = z.infer<typeof ctaActionSchema>;
export type InputKind = (typeof INPUT_KINDS)[number];
export type EntityKind = (typeof ENTITY_KINDS)[number];
export type ConditionOp = (typeof CONDITION_OPS)[number];
