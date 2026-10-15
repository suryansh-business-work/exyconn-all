/**
 * Offers & coupons: a carousel of bundles → the coupon as an illustration → buy now (checkout
 * with the coupon applied), remind me tonight (a push before the offer ends), or browse again.
 */
import { defineWorkflow } from '../../author';
import { checkoutNodes } from './checkout';

const CARDS = 'cards';
const COUPON = 'coupon';

const OFFERS = [
  {
    id: 'safe-home',
    title: 'Safe Home Bundle',
    subtitle: 'Cam 2K + Video Doorbell + Sensor Kit',
    price: 11999,
    mrp: 17496,
    code: 'SAFE1000',
    off: 1000,
    ends: 'Sunday',
  },
  {
    id: 'glow',
    title: 'Glow Starter Kit',
    subtitle: 'Smart Bulb 4-pack + Light Strip 5 m',
    price: 3999,
    mrp: 6595,
    code: 'GLOW300',
    off: 300,
    ends: 'tonight',
  },
  {
    id: 'movie',
    title: 'Movie Night Combo',
    subtitle: 'Soundbar 2.1 + Speaker Mini',
    price: 13499,
    mrp: 20998,
    code: 'CINEMA750',
    off: 750,
    ends: 'Friday',
  },
  {
    id: 'clean-air',
    title: 'Clean Air Pack',
    subtitle: 'Air Purifier 300 + Smart Plug 2-pack',
    price: 10499,
    mrp: 15998,
    code: 'BREATHE500',
    off: 500,
    ends: 'month end',
  },
] as const;

export const offers = defineWorkflow({
  key: 'offers',
  name: 'Offers & coupons',
  description: 'Bundles and coupon codes running this week',
  keywords: ['offer', 'offers', 'coupon', 'discount', 'deal', 'sale', 'promo code'],
  nodes: [
    {
      id: CARDS,
      type: 'carousel',
      data: {
        text: 'This week’s best deals, {{user.firstName}}. Each bundle has an extra coupon on top.',
        cards: OFFERS.map((o) => ({
          id: o.id,
          title: o.title,
          subtitle: o.subtitle,
          price: o.price,
          mrp: o.mrp,
          badge: 'Extra coupon',
          image: { icon: 'offer', accent: 'pink', title: o.title },
          buttonTitle: 'Get the code',
          set: {
            pName: o.title,
            pPrice: String(o.price),
            couponCode: o.code,
            couponOff: String(o.off),
            couponAmt: String(-o.off),
            offerEnds: o.ends,
          },
        })),
      },
      next: Object.fromEntries(OFFERS.map((o) => [o.id, COUPON])),
    },
    {
      id: COUPON,
      type: 'image',
      data: {
        complete: true,
        image: { icon: 'gift', accent: 'pink', title: '{{couponCode}}', subtitle: '{{pName}}' },
        caption:
          'Use *{{couponCode}}* for an extra {{couponOff|money}} off the {{pName}}. Valid till {{offerEnds}}, one use per customer.',
      },
      next: 'choose',
    },
    {
      id: 'choose',
      type: 'buttons',
      data: {
        text: 'Shall I apply it to your order now?',
        buttons: [
          { id: 'buy', title: 'Apply & buy' },
          { id: 'later', title: 'Remind me later' },
          { id: 'more', title: 'Other offers' },
        ],
      },
      next: { buy: 'deal-cart', later: 'remind', more: CARDS },
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Offer ending',
        note: 'Real use: three hours before it ends.',
      },
      next: { next: 'remind-ok', later: 'last-call' },
    },
    {
      id: 'remind-ok',
      type: 'end',
      data: { text: 'Done — I will nudge you before {{couponCode}} expires.', showMenu: true },
    },
    {
      id: 'last-call',
      type: 'buttons',
      data: {
        header: 'Last call',
        text: '{{couponCode}} ends soon, {{user.firstName}}. The {{pName}} is still in stock and ships today.',
        buttons: [
          { id: 'buy', title: 'Apply & buy' },
          { id: 'skip', title: 'No thanks' },
        ],
      },
      next: { buy: 'deal-cart', skip: 'skip-end' },
    },
    {
      id: 'skip-end',
      type: 'end',
      data: { text: 'No problem. New deals drop every Monday.', showMenu: true },
    },
    ...checkoutNodes('deal', [
      { id: 'coupon', label: 'Coupon {{couponCode}}', amount: '{{couponAmt}}' },
    ]),
  ],
});
