/**
 * Browse the catalogue: category list → that category's carousel → the product's detail card
 * → delivery PIN check → checkout (order → pay → paid → track).
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import { checkoutNodes } from './checkout';
import { itemCard } from './data';
import { CATEGORIES, type Category } from './products';

const PIN = 'pincode';

function categoryNodes(category: Category): AuthorNode[] {
  return [
    {
      id: `cat-${category.id}`,
      type: 'carousel',
      data: {
        text: '{{catName}} — prices include GST, delivery is free.',
        cards: category.items.map((item) => itemCard(item, category.icon, 'View details')),
      },
      next: Object.fromEntries(category.items.map((item) => [item.id, `detail-${category.id}`])),
    },
    {
      id: `detail-${category.id}`,
      type: 'product',
      data: {
        product: {
          id: 'add',
          title: '{{pName}}',
          subtitle: '{{pSub}}',
          price: '{{pPrice}}',
          mrp: '{{pMrp}}',
          badge: '{{pRating}}',
          image: { icon: category.icon, accent: 'teal', title: '{{pName}}' },
          buttonTitle: 'Add to cart',
        },
      },
      next: { add: PIN },
    },
  ];
}

export const catalogue = defineWorkflow({
  key: 'catalogue',
  name: 'Shop the catalogue',
  description: 'Security, lighting, audio and air — with offers',
  keywords: ['shop', 'buy', 'catalogue', 'products', 'browse', 'camera', 'bulb', 'speaker'],
  nodes: [
    {
      id: 'categories',
      type: 'list',
      data: {
        header: 'Lumio Home store',
        text: 'Everything works with one app and your voice assistant. What are you shopping for?',
        footer: 'Free delivery · 1-year warranty · 7-day returns',
        button: 'Categories',
        sections: [
          {
            id: 'cats',
            title: 'Categories',
            rows: CATEGORIES.map((c) => ({
              id: c.id,
              title: c.name,
              description: c.description,
              set: { catName: c.name },
            })),
          },
        ],
      },
      next: Object.fromEntries(CATEGORIES.map((c) => [c.id, `cat-${c.id}`])),
    },
    ...CATEGORIES.flatMap(categoryNodes),
    {
      id: PIN,
      type: 'input',
      data: {
        prompt: 'Good choice! Type your 6-digit PIN code and I will check the delivery date.',
        var: 'pincode',
        kind: 'pincode',
        error: 'That does not look like a PIN code — please type the 6 digits.',
      },
      next: 'delivery',
    },
    {
      id: 'delivery',
      type: 'buttons',
      data: {
        set: { etaDay: '$days:2' },
        text: 'Delivers to {{pincode}} by *{{etaDay|day}}* with free express shipping. Pay by UPI, card or EMI.',
        buttons: [
          { id: 'buy', title: 'Checkout' },
          { id: 'more', title: 'Keep shopping' },
        ],
      },
      next: { buy: 'shop-cart', more: 'categories' },
    },
    ...checkoutNodes('shop'),
  ],
});
