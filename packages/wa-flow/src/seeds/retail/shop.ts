/**
 * Product enquiry: a category (or a free-text "what are you looking for?" read by AI) →
 * product carousel → product card → questions answered by AI, a stylist hand-off or a size
 * guide → size → PIN code → prepaid (order + GST invoice) or cash on delivery → a "shipped"
 * push that leads into order tracking.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import type { Product } from '../../schema';
import {
  CARE_AGENT,
  CATEGORIES,
  COD_FEE,
  rupees,
  SIZES,
  STORE,
  type Category,
  type Item,
} from './data';

const BROWSE = 'browse';
const DETAIL = 'detail';
const ACTIONS = 'detail-actions';
const NEEDS_SIZE = 'needs-size';
const FIT = 'a-fit';
const STYLIST = 'stylist';

/** What picking a product stores for the rest of the flow. */
const chosen = (item: Item) => ({
  title: item.title,
  subtitle: item.subtitle,
  price: String(item.price),
  mrp: String(item.mrp),
  sized: item.sized,
  variant: item.variant,
  rating: item.rating,
});

function itemCard(item: Item): Product {
  return {
    id: item.id,
    title: item.title,
    subtitle: `${item.subtitle} · ${item.rating}`,
    price: item.price,
    mrp: item.mrp,
    badge: item.badge,
    image: { icon: item.icon, accent: 'orange', title: item.title },
    buttonTitle: 'View details',
    set: chosen(item),
  };
}

function categoryRow(category: Category) {
  return {
    id: category.key,
    title: category.name,
    description: category.description,
    set: { cat: category.name, catKey: category.key },
  };
}

/** One carousel per category; every card leads to the product card. */
function categoryCarousel(category: Category): AuthorNode {
  const from = Math.min(...category.items.map((i) => i.price));
  return {
    id: `c-${category.key}`,
    type: 'carousel',
    data: {
      text: `${category.name} — this week's top picks, from ${rupees(from)}. Prices include GST; delivery is free above ₹499.`,
      cards: category.items.map(itemCard),
    },
    next: Object.fromEntries(category.items.map((i) => [i.id, DETAIL])),
  };
}

/** Every category but the last gets a condition case; the last one is the `else`. */
const ROUTED = CATEGORIES.slice(0, -1);
const [LAST] = CATEGORIES.slice(-1);

const askAi: AuthorNode = {
  id: 'ask-ai',
  type: 'ai',
  data: {
    prompt:
      'Tell me what you are looking for, in your own words — e.g. "birthday gift for my sister under 1500" or "cotton kurta for Diwali, size L".',
    intents: CATEGORIES.map((c) => ({
      id: c.key,
      description: `Wants something from ${c.name}: ${c.description}`,
    })),
    entities: [
      { name: 'budget', kind: 'number', description: 'Budget in rupees, if mentioned' },
      { name: 'occasion', kind: 'text', description: 'The occasion or person it is for' },
    ],
    retry: 'Sorry, I could not place that. Please pick a category instead.',
  },
  next: { ...Object.fromEntries(CATEGORIES.map((c) => [c.key, `c-${c.key}`])), fallback: BROWSE },
};

const askProduct: AuthorNode = {
  id: 'ask',
  type: 'ai',
  data: {
    set: { pincode: 'your PIN code' },
    prompt:
      'Ask me anything about the {{title}} — e.g. "will M fit a 40 inch chest?", "kab tak deliver hoga 560034?" or "any offer if I buy two?".',
    intents: [
      { id: 'fit', description: 'A question about size, fit, material or how to care for it' },
      { id: 'delivery', description: 'When it will arrive, or whether it ships to a PIN code' },
      { id: 'offer', description: 'Price, discounts, coupons, EMI or bulk offers' },
      { id: 'compare', description: 'Wants alternatives, something cheaper or a different style' },
      { id: 'human', description: 'Wants to talk to a person or a stylist' },
    ],
    entities: [
      { name: 'pincode', kind: 'text', description: '6-digit Indian PIN code, if given' },
      { name: 'budget', kind: 'number', description: 'Budget in rupees, if mentioned' },
    ],
    retry: 'Sorry, I did not quite get that.',
  },
  next: {
    fit: FIT,
    delivery: 'a-delivery',
    offer: 'a-offer',
    compare: 'a-compare',
    human: STYLIST,
    fallback: 'ask-menu',
  },
};

export const shop = defineWorkflow({
  key: 'shop',
  name: 'Browse & buy',
  description: 'Product enquiry, sizes, offers and checkout',
  keywords: ['shop', 'buy', 'product', 'catalogue', 'catalog', 'price', 'offer', 'gift'],
  nodes: [
    {
      id: BROWSE,
      type: 'list',
      data: {
        header: 'Shop on WhatsApp',
        text: 'Hi {{user.firstName}}, what are you shopping for today? Pick a category, or just describe what you need.',
        footer: '7-day easy returns · cash on delivery available',
        button: 'Categories',
        sections: [
          { id: 'categories', title: 'Categories', rows: CATEGORIES.map(categoryRow) },
          {
            id: 'help',
            title: 'Need help choosing?',
            rows: [
              {
                id: 'assistant',
                title: 'Describe what you need',
                description: 'Tell us the occasion and budget; we suggest picks',
              },
            ],
          },
        ],
      },
      next: { ...Object.fromEntries(CATEGORIES.map((c) => [c.key, 'route'])), assistant: 'ask-ai' },
    },
    {
      id: 'route',
      type: 'condition',
      data: {
        note: 'One case per category; the last category is the else.',
        cases: ROUTED.map((c) => ({ id: c.key, var: 'catKey', op: 'eq' as const, value: c.key })),
      },
      next: {
        ...Object.fromEntries(ROUTED.map((c) => [c.key, `c-${c.key}`])),
        else: `c-${LAST.key}`,
      },
    },
    askAi,
    ...CATEGORIES.map(categoryCarousel),
    {
      id: DETAIL,
      type: 'product',
      data: {
        product: {
          id: 'chosen-item',
          title: '{{title}}',
          subtitle: '{{variant}} · {{rating}}',
          price: '{{price}}',
          mrp: '{{mrp}}',
          image: { icon: 'bag', accent: 'orange', title: '{{title}}', subtitle: '{{variant}}' },
        },
      },
      next: ACTIONS,
    },
    {
      id: ACTIONS,
      type: 'buttons',
      data: {
        text: '*{{title}}*\n{{subtitle}}\n\n{{price|money}} (MRP {{mrp|money}}) · {{rating}}\nIn stock · ships in 24 hours from our Bengaluru warehouse.',
        footer: 'Free delivery above ₹499',
        buttons: [
          { id: 'buy', title: 'Buy now' },
          { id: 'ask', title: 'Ask a question' },
          { id: 'more', title: 'Keep browsing' },
        ],
      },
      next: { buy: NEEDS_SIZE, ask: 'ask', more: BROWSE },
    },
    askProduct,
    {
      id: FIT,
      type: 'cta',
      data: {
        text: 'Our {{title}} runs true to size. If you are between two sizes, pick the larger one — and a free size exchange is always an option within 7 days.',
        actions: [
          { kind: 'url', title: 'Size guide', url: STORE.sizeGuide },
          { kind: 'call', title: 'Call a stylist', phone: STORE.phone },
        ],
      },
      next: ACTIONS,
    },
    {
      id: 'a-delivery',
      type: 'text',
      data: {
        set: { eta: '$days:3' },
        text: 'Yes, we deliver to {{pincode}}. Order before 6 pm today and the {{title}} arrives by {{eta|day}}. Cash on delivery is available there too.',
      },
      next: ACTIONS,
    },
    {
      id: 'a-offer',
      type: 'text',
      data: {
        text: 'Offers on the {{title}} right now:\n• WELCOME10 — 10% off your first order (up to ₹200)\n• 5% instant discount with UPI or cards\n• No-cost EMI on orders above ₹3,000\nThe best one is applied automatically at checkout.',
      },
      next: ACTIONS,
    },
    {
      id: 'a-compare',
      type: 'text',
      data: { text: 'Sure — here is the full range so you can compare styles and prices.' },
      next: BROWSE,
    },
    {
      id: 'ask-menu',
      type: 'buttons',
      data: {
        text: 'I can help with sizing, connect you to a stylist, or you can go ahead and order.',
        buttons: [
          { id: 'size', title: 'Size guide' },
          { id: 'stylist', title: 'Talk to a stylist' },
          { id: 'buy', title: 'Buy now' },
        ],
      },
      next: { size: FIT, stylist: STYLIST, buy: NEEDS_SIZE },
    },
    {
      id: STYLIST,
      type: 'handoff',
      data: {
        agentName: CARE_AGENT.stylistName,
        text: 'Hi {{user.firstName}}, Kabir here from the Bazaarly styling team. I can see you are looking at the {{title}}. What would you like to know?',
      },
      next: 'stylist-end',
    },
    { id: 'stylist-end', type: 'end', data: { showMenu: true } },
    {
      id: NEEDS_SIZE,
      type: 'condition',
      data: {
        set: { size: 'One size' },
        cases: [{ id: 'sized', var: 'sized', op: 'eq', value: 'yes' }],
      },
      next: { sized: 'size', else: 'pincode' },
    },
    {
      id: 'size',
      type: 'list',
      data: {
        text: 'Which size would you like in the {{title}}?',
        footer: 'Free size exchange within 7 days',
        button: 'Choose size',
        sections: [
          {
            id: 'sizes',
            title: 'Sizes in stock',
            rows: SIZES.map((s) => ({ ...s, set: { size: s.title } })),
          },
          {
            id: 'unsure',
            title: 'Not sure?',
            rows: [{ id: 'guide', title: 'See the size guide' }],
          },
        ],
      },
      next: { ...Object.fromEntries(SIZES.map((s) => [s.id, 'pincode'])), guide: FIT },
    },
    {
      id: 'pincode',
      type: 'input',
      data: {
        prompt: 'Please type the 6-digit PIN code we should deliver to.',
        var: 'pincode',
        kind: 'pincode',
      },
      next: 'eta',
    },
    {
      id: 'eta',
      type: 'text',
      data: {
        set: { eta: '$days:3', discount: '$price:120:25' },
        text: 'Great news — we deliver to {{pincode}}. Expected delivery: {{eta|day}}.',
      },
      next: 'pay-mode',
    },
    {
      id: 'pay-mode',
      type: 'buttons',
      data: {
        header: 'How would you like to pay?',
        text: '*{{title}}* · {{variant}} · {{size}}\n{{price|money}}\n\nPay online for an extra prepaid discount, or pay cash at your door ({{codFee|money}} handling fee).',
        set: { codFee: String(COD_FEE) },
        buttons: [
          { id: 'online', title: 'Pay online' },
          { id: 'cod', title: 'Cash on delivery' },
          { id: 'cancel', title: 'Not now' },
        ],
      },
      next: { online: 'secure', cod: 'cod-summary', cancel: 'not-ordered' },
    },
    {
      id: 'secure',
      type: 'notice',
      data: {
        text: 'Payments are processed by Bazaarly’s payment partner. We never ask for your card PIN or OTP in this chat.',
      },
      next: 'summary',
    },
    {
      id: 'summary',
      type: 'order',
      data: {
        set: { orderId: '$id:BZ' },
        order: {
          orderId: '{{orderId}}',
          title: 'Your Bazaarly order',
          items: [{ id: 'item', name: '{{title}} · {{size}}', qty: 1, price: '{{price}}' }],
          adjustments: [{ id: 'discount', label: 'Prepaid discount', amount: '-{{discount}}' }],
          status: 'pending',
          payTitle: 'Pay now',
        },
      },
      next: { pay: 'paid' },
    },
    {
      id: 'paid',
      type: 'order',
      data: {
        order: {
          orderId: '{{orderId}}',
          title: 'Payment received',
          items: [{ id: 'item', name: '{{title}} · {{size}}', qty: 1, price: '{{price}}' }],
          adjustments: [{ id: 'discount', label: 'Prepaid discount', amount: '-{{discount}}' }],
          status: 'paid',
        },
      },
      next: 'invoice',
    },
    {
      id: 'invoice',
      type: 'document',
      data: {
        set: { invoiceNo: '$id:INV' },
        document: {
          fileName: 'Bazaarly_Tax_Invoice.pdf',
          fileType: 'PDF',
          pages: 1,
          sizeKb: 148,
          preview: {
            title: 'Tax invoice',
            subtitle: 'Bazaarly Retail Pvt. Ltd. · GSTIN 29ABCDE1234F1Z5',
            sections: [
              {
                kind: 'fields',
                heading: 'Billed to',
                fields: [
                  { label: 'Name', value: '{{user.fullName}}' },
                  { label: 'Invoice', value: '{{invoiceNo}}' },
                  { label: 'Order', value: '{{orderId}}' },
                  { label: 'Ship to PIN', value: '{{pincode}}' },
                ],
              },
              {
                kind: 'table',
                heading: 'Items',
                columns: ['Item', 'Size', 'Qty', 'Amount'],
                rows: [{ id: 'item', cells: ['{{title}}', '{{size}}', '1', '{{price|money}}'] }],
              },
              {
                kind: 'text',
                heading: 'Tax',
                text: 'Prices include GST (CGST + SGST for Karnataka, IGST elsewhere). Prepaid discount of {{discount|money}} applied.',
              },
            ],
            footer: 'Computer-generated invoice; no signature required.',
          },
        },
        caption: 'Your GST invoice for order {{orderId}}.',
      },
      next: 'placed',
    },
    {
      id: 'cod-summary',
      type: 'order',
      data: {
        set: { orderId: '$id:BZ' },
        order: {
          orderId: '{{orderId}}',
          title: 'Cash on delivery',
          items: [{ id: 'item', name: '{{title}} · {{size}}', qty: 1, price: '{{price}}' }],
          adjustments: [{ id: 'cod', label: 'COD handling fee', amount: '{{codFee}}' }],
          status: 'pending',
        },
      },
      next: 'cod-note',
    },
    {
      id: 'cod-note',
      type: 'text',
      data: {
        text: 'Please keep the amount ready at delivery — cash or UPI at the door both work.',
      },
      next: 'placed',
    },
    {
      id: 'placed',
      type: 'text',
      data: {
        complete: true,
        text: 'Order {{orderId}} is placed, {{user.firstName}}! The {{title}} ({{size}}) arrives by {{eta|day}}. We will message you here when it ships.',
      },
      next: 'ship-remind',
    },
    {
      id: 'ship-remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Order shipped',
        note: 'Real use: when the courier picks it up. Short for the demo.',
      },
      next: { next: 'done', later: 'shipped' },
    },
    {
      id: 'done',
      type: 'end',
      data: { text: 'Thank you for shopping with Bazaarly. Anything else?', showMenu: true },
    },
    {
      id: 'shipped',
      type: 'buttons',
      data: {
        header: 'Your order has shipped',
        set: { awb: '$id:BXP' },
        text: 'Good news, {{user.firstName}} — the {{title}} from order {{orderId}} is on its way with Bazaarly Express (AWB {{awb}}). Expected by {{eta|day}}.',
        buttons: [
          { id: 'track', title: 'Track order' },
          { id: 'ok', title: 'Thanks' },
        ],
      },
      next: { track: 'to-track', ok: 'shipped-end' },
    },
    { id: 'to-track', type: 'jump', data: { workflowKey: 'track-order' } },
    {
      id: 'shipped-end',
      type: 'end',
      data: { text: 'Happy shopping, {{user.firstName}}!', showMenu: true },
    },
    {
      id: 'not-ordered',
      type: 'end',
      data: {
        text: 'No problem — nothing was ordered. The {{title}} will be here when you are ready.',
        showMenu: true,
      },
    },
  ],
});
