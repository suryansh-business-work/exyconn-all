/**
 * Talk to a human: the shopper says what they need in their own words; an `ai` node reads the
 * intent → order problems go to Care, buying advice to a home expert, bulk and business
 * orders to the business team (with a contact card), and anything unclear to Care. Ends with
 * the experience centre's pin and a call button.
 */
import { defineWorkflow } from '../../author';
import { BRAND } from './data';

const CARE = 'care';
const VISIT = 'visit';

export const human = defineWorkflow({
  key: 'human',
  name: 'Talk to a human',
  description: 'Care, home experts and business orders',
  keywords: ['human', 'agent', 'customer care', 'talk to someone', 'call me', 'complaint'],
  nodes: [
    {
      id: 'ask',
      type: 'ai',
      data: {
        set: { orderRef: '', productAsked: '' },
        prompt:
          'Of course. Tell me briefly what it is about — for example "my doorbell order is late" or "which camera for a 3BHK?" — and I will bring in the right person.',
        intents: [
          {
            id: 'order',
            description: 'A problem with an existing order, delivery, payment or refund',
          },
          { id: 'advice', description: 'Wants help choosing products or planning a smart home' },
          { id: 'business', description: 'Bulk, corporate, builder or office order' },
        ],
        entities: [
          { name: 'orderRef', kind: 'text', description: 'Order number, usually starting with LH' },
          { name: 'productAsked', kind: 'text', description: 'Product or category mentioned' },
        ],
        retry: 'Let me get someone from our Care team for you.',
      },
      next: { order: CARE, advice: 'expert', business: 'biz', fallback: CARE },
    },
    {
      id: CARE,
      type: 'handoff',
      data: {
        complete: true,
        agentName: BRAND.careAgent,
        text: 'Hi {{user.firstName}}, Tara from Lumio Care here. I am pulling up your account now — give me a moment and tell me anything else I should know.',
      },
      next: VISIT,
    },
    {
      id: 'expert',
      type: 'handoff',
      data: {
        complete: true,
        agentName: BRAND.expertAgent,
        text: 'Hi {{user.firstName}}, I am Vikram, a Lumio home expert. Tell me about your rooms and routine and I will put together a setup that fits your budget.',
      },
      next: VISIT,
    },
    {
      id: 'biz',
      type: 'handoff',
      data: {
        complete: true,
        agentName: BRAND.bizAgent,
        text: 'Hi {{user.firstName}}, Neha from Lumio for Business. We supply offices, hotels and housing projects with volume pricing and on-site installation. How many units are you planning?',
      },
      next: 'biz-card',
    },
    {
      id: 'biz-card',
      type: 'contact',
      data: {
        contact: {
          name: 'Neha Arora',
          phone: '+91 80 4920 6650',
          role: 'Business sales lead',
          organisation: 'Lumio Home',
        },
      },
      next: VISIT,
    },
    {
      id: VISIT,
      type: 'location',
      data: {
        location: { name: BRAND.name, address: BRAND.address, lat: BRAND.lat, lng: BRAND.lng },
        caption:
          'Want to try before you buy? Every product is on live demo at our experience centre, open daily 11 am – 9 pm.',
      },
      next: 'call',
    },
    {
      id: 'call',
      type: 'cta',
      data: {
        text: 'Prefer to talk? We answer in under a minute.',
        actions: [{ kind: 'call', title: 'Call Lumio Care', phone: BRAND.carePhone }],
      },
      next: 'bye',
    },
    { id: 'bye', type: 'end', data: { showMenu: false } },
  ],
});
