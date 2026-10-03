/**
 * Membership and renewal: the current plan card (renew the same, upgrade, or later), the plan
 * carousel for new members, an add-on, a coupon code checked by a condition → order with GST →
 * pay → tax invoice PDF → digital membership card. Freezing goes to the membership desk.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import type { Product } from '../../schema';
import { rupees } from '../healthcare/data';
import {
  ADD_ONS,
  BRANCHES,
  COUPONS,
  CURRENT_PLAN,
  gstOn,
  MEMBERSHIP_DESK,
  PLANS,
  type Plan,
} from './data';

const PLANS_NODE = 'plans';
const ADDON = 'addon';
const SUMMARY = 'summary';
const CURRENT = PLANS.find((p) => p.id === CURRENT_PLAN.id) ?? PLANS[0];

/** What choosing a plan stores; `planDays` feeds the card's `$days:` expiry. */
const planVars = (plan: Plan) => ({
  plan: plan.title,
  planPrice: String(plan.price),
  planGst: String(gstOn(plan.price)),
  planDays: String(plan.months * 30),
});

function planCard(plan: Plan): Product {
  return {
    id: plan.id,
    title: `${plan.title} membership`,
    subtitle: plan.subtitle,
    price: plan.price,
    mrp: plan.mrp,
    badge: plan.badge,
    image: { icon: 'fitness', accent: 'red', title: plan.title },
    buttonTitle: 'Choose plan',
    set: planVars(plan),
  };
}

/** One node per valid code: sets the discount, then on to the order. */
function couponNode(coupon: (typeof COUPONS)[number]): AuthorNode {
  return {
    id: `ok-${coupon.id}`,
    type: 'text',
    data: {
      set: { discount: String(coupon.amount), couponLabel: coupon.label },
      text: 'Code applied — {{discount|money}} off.',
    },
    next: SUMMARY,
  };
}

const orderItems = [
  { id: 'plan', name: '{{plan}} membership', qty: 1, price: '{{planPrice}}' },
  { id: 'addon', name: '{{addon}}', qty: 1, price: '{{addonPrice}}' },
];
const orderAdjustments = [
  { id: 'gst-plan', label: 'GST 18% (plan)', amount: '{{planGst}}' },
  { id: 'gst-addon', label: 'GST 18% (add-on)', amount: '{{addonGst}}' },
  { id: 'coupon', label: '{{couponLabel}}', amount: '-{{discount}}' },
];

export const membershipRenewal = defineWorkflow({
  key: 'membership-renewal',
  name: 'Membership & renewal',
  description: 'Renew, upgrade or freeze your membership',
  keywords: ['membership', 'renew', 'renewal', 'plans', 'join', 'freeze', 'upgrade'],
  nodes: [
    {
      id: 'start',
      type: 'buttons',
      data: {
        set: { memberId: '$id:FN' },
        header: 'Membership',
        text: 'Hi {{user.firstName}}, what would you like to do?',
        buttons: [
          { id: 'renew', title: 'Renew my plan' },
          { id: 'plans', title: 'See all plans' },
          { id: 'freeze', title: 'Freeze membership' },
        ],
      },
      next: { renew: 'current', plans: PLANS_NODE, freeze: 'freeze' },
    },
    {
      id: 'current',
      type: 'image',
      data: {
        set: {
          homeBranch: BRANCHES[0].name,
          expiry: `$days:${CURRENT_PLAN.expiresInDays}`,
          visits: String(CURRENT_PLAN.visits),
          ptLeft: String(CURRENT_PLAN.ptLeft),
          ...planVars(CURRENT),
        },
        image: {
          icon: 'fitness',
          accent: 'red',
          title: '{{plan}} membership',
          subtitle: 'Expires {{expiry|date}}',
        },
        caption:
          'Member {{memberId}} · {{homeBranch}}\nVisits this term: {{visits}} · PT sessions left: {{ptLeft}}\nRenew before {{expiry|date}} to keep your locker and your streak.',
      },
      next: 'current-actions',
    },
    {
      id: 'current-actions',
      type: 'buttons',
      data: {
        text: 'Renew the {{plan}} plan for {{planPrice|money}} + GST, or upgrade for a bigger saving?',
        buttons: [
          { id: 'same', title: 'Renew same plan' },
          { id: 'upgrade', title: 'Upgrade plan' },
          { id: 'later', title: 'Not now' },
        ],
      },
      next: { same: ADDON, upgrade: PLANS_NODE, later: 'later' },
    },
    {
      id: PLANS_NODE,
      type: 'carousel',
      data: {
        text: 'All plans include every branch, group classes and the FitNation app. Prices before GST.',
        cards: PLANS.map(planCard),
      },
      next: Object.fromEntries(PLANS.map((p) => [p.id, ADDON])),
    },
    {
      id: ADDON,
      type: 'list',
      data: {
        text: 'Add anything to the {{plan}} plan?',
        button: 'Choose add-on',
        sections: [
          {
            id: 'addons',
            title: 'Add-ons',
            rows: ADD_ONS.map((a) => ({
              id: a.id,
              title: a.title,
              description: a.price ? `${a.description} · ${rupees(a.price)}` : a.description,
              set: {
                addon: a.title,
                addonPrice: String(a.price),
                addonGst: String(gstOn(a.price)),
              },
            })),
          },
        ],
      },
      next: Object.fromEntries(ADD_ONS.map((a) => [a.id, 'coupon-ask'])),
    },
    {
      id: 'coupon-ask',
      type: 'buttons',
      data: {
        text: 'Do you have a coupon or referral code?',
        buttons: [
          { id: 'yes', title: 'Apply a code' },
          { id: 'no', title: 'No code', set: { discount: '0', couponLabel: 'No code' } },
        ],
      },
      next: { yes: 'code', no: SUMMARY },
    },
    {
      id: 'code',
      type: 'input',
      data: { prompt: 'Type your code, e.g. FIT500.', var: 'coupon', kind: 'text' },
      next: 'code-check',
    },
    {
      id: 'code-check',
      type: 'condition',
      data: {
        cases: COUPONS.map((c) => ({ id: c.id, var: 'coupon', op: 'eq' as const, value: c.code })),
      },
      next: { ...Object.fromEntries(COUPONS.map((c) => [c.id, `ok-${c.id}`])), else: 'bad-code' },
    },
    ...COUPONS.map(couponNode),
    {
      id: 'bad-code',
      type: 'text',
      data: {
        set: { discount: '0', couponLabel: 'No code' },
        text: 'Sorry, {{coupon|upper}} is not a valid code. Carrying on without it — the desk can apply it later if it should work.',
      },
      next: SUMMARY,
    },
    {
      id: SUMMARY,
      type: 'order',
      data: {
        set: { orderId: '$id:MB' },
        order: {
          orderId: '{{orderId}}',
          title: 'FitNation membership',
          items: orderItems,
          adjustments: orderAdjustments,
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
          items: orderItems,
          adjustments: orderAdjustments,
          status: 'paid',
        },
      },
      next: 'invoice',
    },
    {
      id: 'invoice',
      type: 'document',
      data: {
        set: { invoiceNo: '$id:INV', validTill: '$days:{{planDays}}' },
        document: {
          fileName: 'FitNation_Tax_Invoice.pdf',
          fileType: 'PDF',
          pages: 1,
          sizeKb: 88,
          preview: {
            title: 'Tax invoice',
            subtitle: 'FitNation Health Clubs Pvt. Ltd. · GSTIN 27AAACF0000A1Z5',
            sections: [
              {
                kind: 'fields',
                fields: [
                  { label: 'Invoice', value: '{{invoiceNo}}' },
                  { label: 'Member', value: '{{user.fullName}}' },
                  { label: 'Email', value: '{{user.email}}' },
                  { label: 'Plan', value: '{{plan}}' },
                  { label: 'Valid till', value: '{{validTill|date}}' },
                ],
              },
              {
                kind: 'table',
                heading: 'Charges',
                columns: ['Item', 'Amount'],
                rows: [
                  { id: 'plan', cells: ['{{plan}} membership', '{{planPrice|money}}'] },
                  { id: 'addon', cells: ['{{addon}}', '{{addonPrice|money}}'] },
                  {
                    id: 'gst',
                    cells: ['GST 18% (SAC 999723)', '{{planGst|money}} + {{addonGst|money}}'],
                  },
                  { id: 'coupon', cells: ['{{couponLabel}}', '-{{discount|money}}'] },
                ],
              },
            ],
            footer: 'Membership is personal and non-transferable.',
          },
        },
        caption: 'Your tax invoice. A copy is in your email too.',
      },
      next: 'card',
    },
    {
      id: 'card',
      type: 'ticket',
      data: {
        complete: true,
        ticket: {
          ticketId: '{{memberId}}',
          title: 'FitNation membership',
          subtitle: '{{plan}} · all branches',
          fields: [
            { label: 'Member', value: '{{user.fullName}}' },
            { label: 'Plan', value: '{{plan}}' },
            { label: 'Add-on', value: '{{addon}}' },
            { label: 'Valid till', value: '{{validTill|date}}' },
          ],
          qrData: 'fitnation://member/{{memberId}}?till={{validTill}}',
        },
        caption: 'Your digital membership card — scan it at any turnstile.',
      },
      next: 'what-next',
    },
    {
      id: 'what-next',
      type: 'buttons',
      data: {
        text: "You're all set, {{user.firstName}}! Want a coach to plan your next few weeks?",
        buttons: [
          { id: 'pt', title: 'Book a PT session' },
          { id: 'menu', title: 'Main menu' },
        ],
      },
      next: { pt: 'to-pt', menu: 'menu-end' },
    },
    { id: 'to-pt', type: 'jump', data: { workflowKey: 'personal-training' } },
    { id: 'menu-end', type: 'end', data: { showMenu: true } },
    {
      id: 'later',
      type: 'end',
      data: { text: 'No problem — we will remind you before it expires.', showMenu: true },
    },
    {
      id: 'freeze',
      type: 'buttons',
      data: {
        text: 'Travelling or unwell? You can freeze your membership and the days are added back at the end.',
        footer: 'Half-yearly: up to 15 days · Annual: up to 30 days',
        buttons: [
          { id: 'f15', title: 'Freeze 15 days', set: { freezeDays: '15' } },
          { id: 'f30', title: 'Freeze 30 days', set: { freezeDays: '30' } },
          { id: 'talk', title: 'Talk to us' },
        ],
      },
      next: { f15: 'freeze-ok', f30: 'freeze-ok', talk: 'desk' },
    },
    {
      id: 'freeze-ok',
      type: 'buttons',
      data: {
        set: { freezeFrom: '$days:1' },
        text: 'Freeze for {{freezeDays}} days from {{freezeFrom|date}}? Your access pauses and the expiry moves by {{freezeDays}} days.',
        buttons: [
          { id: 'confirm', title: 'Confirm freeze' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'frozen', cancel: 'later' },
    },
    {
      id: 'frozen',
      type: 'end',
      data: {
        set: { freezeId: '$id:FZ' },
        complete: true,
        text: 'Done — membership frozen from {{freezeFrom|date}} for {{freezeDays}} days (reference {{freezeId}}). Scan in any time to resume early.',
        showMenu: true,
      },
    },
    {
      id: 'desk',
      type: 'handoff',
      data: {
        agentName: MEMBERSHIP_DESK.agentName,
        text: 'Hi {{user.firstName}}, Nikita here from the membership desk. Tell me what is going on and I will sort out the best option for you.',
      },
      next: 'desk-card',
    },
    {
      id: 'desk-card',
      type: 'contact',
      data: {
        contact: {
          name: MEMBERSHIP_DESK.name,
          phone: MEMBERSHIP_DESK.phone,
          role: MEMBERSHIP_DESK.role,
          organisation: 'FitNation',
        },
      },
      next: 'desk-end',
    },
    { id: 'desk-end', type: 'end', data: { showMenu: true } },
  ],
});
