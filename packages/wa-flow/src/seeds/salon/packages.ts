/**
 * Packages and memberships: carousel → for me or as a gift (recipient details) → order →
 * paid invoice PDF → membership or gift-voucher QR → book the first session. A "custom
 * bridal" card goes to the bridal studio.
 */
import { defineWorkflow } from '../../author';
import type { Product } from '../../schema';
import { BRIDAL_DESK, PACKAGES, SALON, type SalonPackage } from './data';

const BUY = 'for-whom';
const CUSTOM = 'custom-bridal';

function packageCard(item: SalonPackage): Product {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    price: item.price,
    mrp: item.mrp,
    badge: item.badge,
    image: { icon: item.icon, accent: 'pink', title: item.title },
    buttonTitle: 'Buy this',
    set: {
      pkg: item.title,
      pkgPrice: String(item.price),
      pkgMrp: String(item.mrp),
      validity: item.validity,
      sessions: item.sessions,
    },
  };
}

export const packages = defineWorkflow({
  key: 'packages',
  name: 'Packages and offers',
  description: 'Memberships, spa days, bridal and gift vouchers',
  keywords: ['package', 'membership', 'offer', 'gift voucher', 'bridal', 'glow card', 'deal'],
  nodes: [
    {
      id: 'cards',
      type: 'carousel',
      data: {
        text: 'Hi {{user.firstName}}, our packages save up to 30% and make lovely gifts. Swipe to explore.',
        cards: [
          ...PACKAGES.map(packageCard),
          {
            id: CUSTOM,
            title: 'Custom bridal plan',
            subtitle: 'Bride, family and pre-wedding sittings, planned with you',
            price: 25000,
            badge: 'From ₹25,000',
            image: { icon: 'event', accent: 'purple', title: 'Bridal studio' },
            buttonTitle: 'Plan with us',
          },
        ],
      },
      next: { ...Object.fromEntries(PACKAGES.map((p) => [p.id, BUY])), [CUSTOM]: 'bridal' },
    },
    {
      id: BUY,
      type: 'buttons',
      data: {
        text: '*{{pkg}}* · {{pkgPrice|money}} (worth {{pkgMrp|money}})\n{{sessions}} · valid {{validity}} from the first visit.\nIs it for you or a gift?',
        buttons: [
          { id: 'me', title: 'For me', set: { holder: '{{user.fullName}}', gift: 'no' } },
          { id: 'gift', title: 'It’s a gift', set: { gift: 'yes' } },
          { id: 'back', title: 'Other packages' },
        ],
      },
      next: { me: 'summary', gift: 'r-name', back: 'cards' },
    },
    {
      id: 'r-name',
      type: 'input',
      data: { prompt: 'Who is the lucky one? Type their full name.', var: 'holder', kind: 'name' },
      next: 'r-phone',
    },
    {
      id: 'r-phone',
      type: 'input',
      data: {
        prompt:
          "{{holder}}'s mobile number? We will WhatsApp the voucher to them on the day you choose.",
        var: 'holderPhone',
        kind: 'phone',
      },
      next: 'r-note',
    },
    {
      id: 'r-note',
      type: 'input',
      data: {
        prompt: 'Add a short message for the card, e.g. "Happy birthday, Didi! Treat yourself."',
        var: 'giftNote',
        kind: 'text',
      },
      next: 'summary',
    },
    {
      id: 'summary',
      type: 'order',
      data: {
        set: { orderId: '$id:GCO', welcome: '$price:200:20' },
        order: {
          orderId: '{{orderId}}',
          title: '{{pkg}}',
          items: [{ id: 'pkg', name: '{{pkg}} · {{validity}}', qty: 1, price: '{{pkgPrice}}' }],
          adjustments: [{ id: 'welcome', label: 'WhatsApp welcome offer', amount: '-{{welcome}}' }],
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
        set: { memberId: '$id:GLW', paidOn: '$now' },
        order: {
          orderId: '{{orderId}}',
          title: 'Payment received',
          items: [{ id: 'pkg', name: '{{pkg}} · {{validity}}', qty: 1, price: '{{pkgPrice}}' }],
          adjustments: [{ id: 'welcome', label: 'WhatsApp welcome offer', amount: '-{{welcome}}' }],
          status: 'paid',
        },
      },
      next: 'invoice',
    },
    {
      id: 'invoice',
      type: 'document',
      data: {
        document: {
          fileName: 'GlowAndCo_Invoice.pdf',
          fileType: 'PDF',
          pages: 1,
          sizeKb: 86,
          preview: {
            title: 'Tax invoice',
            subtitle: 'Glow & Co. Salon and Spa · GSTIN 27AAAGC0000A1Z5',
            sections: [
              {
                kind: 'fields',
                heading: 'Bill to',
                fields: [
                  { label: 'Customer', value: '{{user.fullName}}' },
                  { label: 'Invoice', value: '{{orderId}}' },
                  { label: 'Date', value: '{{paidOn|date}}' },
                  { label: 'Card holder', value: '{{holder}}' },
                ],
              },
              {
                kind: 'table',
                heading: 'Items',
                columns: ['Item', 'Validity', 'Amount'],
                rows: [
                  { id: 'pkg', cells: ['{{pkg}}', '{{validity}}', '{{pkgPrice|money}}'] },
                  { id: 'offer', cells: ['WhatsApp welcome offer', '—', '-{{welcome|money}}'] },
                ],
              },
              {
                kind: 'text',
                heading: 'Terms',
                text: 'Prices include 18% GST. Packages are non-refundable but can be transferred once to a family member. Book sessions on WhatsApp or at reception.',
              },
            ],
            footer: 'Glow & Co. Salon and Spa, Bandra West, Mumbai',
          },
        },
        caption: 'Your invoice, {{user.firstName}}.',
      },
      next: 'gift-or-me',
    },
    {
      id: 'gift-or-me',
      type: 'condition',
      data: { cases: [{ id: 'gift', var: 'gift', op: 'eq', value: 'yes' }] },
      next: { gift: 'voucher', else: 'card' },
    },
    {
      id: 'card',
      type: 'ticket',
      data: {
        complete: true,
        ticket: {
          ticketId: '{{memberId}}',
          title: '{{pkg}}',
          subtitle: 'Glow & Co. member card',
          fields: [
            { label: 'Member', value: '{{holder}}' },
            { label: 'Includes', value: '{{sessions}}' },
            { label: 'Valid', value: '{{validity}}' },
          ],
          qrData: 'glowandco://member/{{memberId}}',
        },
        caption: 'Show this QR at reception and the benefits apply automatically.',
      },
      next: 'first',
    },
    {
      id: 'first',
      type: 'buttons',
      data: {
        text: 'Shall we book your first session now?',
        buttons: [
          { id: 'book', title: 'Book now' },
          { id: 'later', title: 'Later' },
        ],
      },
      next: { book: 'to-book', later: 'later' },
    },
    { id: 'to-book', type: 'jump', data: { workflowKey: 'book' } },
    {
      id: 'later',
      type: 'end',
      data: { text: 'Sure. Type *book* whenever you are ready.', showMenu: true },
    },
    {
      id: 'voucher',
      type: 'ticket',
      data: {
        complete: true,
        ticket: {
          ticketId: '{{memberId}}',
          title: 'Gift voucher · {{pkg}}',
          subtitle: 'From {{user.fullName}}',
          fields: [
            { label: 'For', value: '{{holder}}' },
            { label: 'Message', value: '{{giftNote}}' },
            { label: 'Includes', value: '{{sessions}}' },
            { label: 'Valid', value: '{{validity}}' },
          ],
          qrData: 'glowandco://gift/{{memberId}}',
        },
        caption: 'This is a preview. We will send the voucher to {{holder}} on {{holderPhone}}.',
      },
      next: 'gift-sent',
    },
    {
      id: 'gift-sent',
      type: 'end',
      data: {
        text: 'What a thoughtful gift, {{user.firstName}}! We will let you know once {{holder}} books.',
        showMenu: true,
      },
    },
    {
      id: 'bridal',
      type: 'handoff',
      data: {
        agentName: BRIDAL_DESK.agentName,
        text: "Congratulations, {{user.firstName}}! I'm Meher, I lead our bridal studio. Tell me the wedding date, the functions and how many people need looks — I will put a plan and a quote together for you.",
      },
      next: 'bridal-cta',
    },
    {
      id: 'bridal-cta',
      type: 'cta',
      data: {
        text: 'You can also browse past bridal looks, or call me directly.',
        actions: [
          { kind: 'url', title: 'Bridal lookbook', url: SALON.lookbook },
          { kind: 'call', title: 'Call Meher', phone: BRIDAL_DESK.phone },
        ],
      },
      next: 'bridal-end',
    },
    { id: 'bridal-end', type: 'end', data: { showMenu: true } },
  ],
});
