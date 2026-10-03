/**
 * Menu and specials: the printed menu as a PDF, the chef's specials carousel (each leads to a
 * pre-order or a table), and free-text questions about food read by an `ai` node — veg and
 * Jain options, allergies, timings and parking — with the host as the fallback.
 */
import { defineWorkflow } from '../../author';
import type { Product } from '../../schema';
import { HOST, MENU_PDF, RESTAURANT, SPECIALS, toRows, type Dish } from './data';

const NEXT = 'next-step';
const ASK = 'ask';
const MORE = 'more';
const COLUMNS = ['Dish', 'Description', 'Price'];

function specialCard(dish: Dish): Product {
  return {
    id: dish.id,
    title: dish.title,
    subtitle: dish.subtitle,
    price: dish.price,
    badge: dish.badge,
    image: { icon: dish.icon, accent: dish.accent, title: dish.title },
    buttonTitle: 'Order this',
  };
}

export const menu = defineWorkflow({
  key: 'menu',
  name: 'Menu and specials',
  description: "Full menu, chef's specials, veg and Jain options",
  keywords: [
    'menu',
    'food menu',
    'specials',
    'veg',
    'jain',
    'allergy',
    'what do you serve',
    'dishes',
  ],
  nodes: [
    {
      id: 'pdf',
      type: 'document',
      data: {
        document: {
          fileName: 'SaffronTable_Menu.pdf',
          fileType: 'PDF',
          pages: 6,
          sizeKb: 1280,
          preview: {
            title: 'The Saffron Table — menu',
            subtitle: 'North Indian and Awadhi kitchen',
            sections: [
              {
                kind: 'table',
                heading: 'Starters',
                columns: COLUMNS,
                rows: toRows(MENU_PDF.starters, 'starter'),
              },
              {
                kind: 'table',
                heading: 'Mains',
                columns: COLUMNS,
                rows: toRows(MENU_PDF.mains, 'main'),
              },
              {
                kind: 'table',
                heading: 'Desserts',
                columns: COLUMNS,
                rows: toRows(MENU_PDF.desserts, 'dessert'),
              },
              {
                kind: 'text',
                heading: 'Good to know',
                text: 'Prices exclude 5% GST. Jain versions of most veg dishes on request. Please tell us about allergies — our kitchen handles nuts, dairy and gluten.',
              },
            ],
            footer: 'Menu changes with the seasons',
          },
        },
        caption: 'Here is our menu, {{user.firstName}}. Veg dishes are marked green in the PDF.',
      },
      next: NEXT,
    },
    {
      id: NEXT,
      type: 'buttons',
      data: {
        text: 'What next?',
        buttons: [
          { id: 'specials', title: "Chef's specials" },
          { id: 'reserve', title: 'Reserve a table' },
          { id: 'ask', title: 'Ask a question' },
        ],
      },
      next: { specials: 'specials', reserve: 'to-reserve', ask: ASK },
    },
    {
      id: 'specials',
      type: 'carousel',
      data: {
        text: "This week's specials from Chef Rohit:",
        cards: SPECIALS.map(specialCard),
      },
      next: Object.fromEntries(SPECIALS.map((d) => [d.id, 'how'])),
    },
    {
      id: 'how',
      type: 'buttons',
      data: {
        text: 'Specials are served at the restaurant or with a platter pre-order. How would you like it?',
        buttons: [
          { id: 'table', title: 'Book a table' },
          { id: 'preorder', title: 'Pre-order' },
        ],
      },
      next: { table: 'to-reserve', preorder: 'to-preorder' },
    },
    { id: 'to-reserve', type: 'jump', data: { workflowKey: 'reserve' } },
    { id: 'to-preorder', type: 'jump', data: { workflowKey: 'preorder' } },
    {
      id: ASK,
      type: 'ai',
      data: {
        prompt:
          'Sure — what would you like to know? e.g. "do you have Jain food?" or "is there parking?"',
        intents: [
          { id: 'diet', description: 'Vegetarian, vegan, Jain or other dietary options' },
          { id: 'allergy', description: 'Allergies or ingredients: nuts, gluten, dairy' },
          { id: 'hours', description: 'Opening hours, last orders, or busy times' },
          { id: 'parking', description: 'Parking, directions or how to get there' },
        ],
        entities: [
          { name: 'allergen', kind: 'text', description: 'The ingredient they are worried about' },
        ],
        retry: 'Let me get someone who knows the kitchen best.',
      },
      next: {
        diet: 'diet',
        allergy: 'allergy',
        hours: 'hours',
        parking: 'parking',
        fallback: 'host',
      },
    },
    {
      id: 'diet',
      type: 'text',
      data: {
        text: 'Yes! Over half our menu is vegetarian, and the kitchen makes Jain versions (no onion, garlic or root vegetables) of the dal, paneer and biryani. Vegan? Ask for the dal without butter.',
      },
      next: MORE,
    },
    {
      id: 'allergy',
      type: 'text',
      data: {
        text: 'Thanks for checking. Our kitchen handles nuts, dairy and gluten, so we cannot promise zero traces. Tell the host when you arrive and the chef will guide you to safe dishes.',
      },
      next: MORE,
    },
    {
      id: 'hours',
      type: 'text',
      data: {
        text: 'We are open every day: lunch 12–3:30 pm and dinner 7–11:30 pm (last orders 11 pm). Friday and Saturday evenings fill up fast — booking ahead is best.',
      },
      next: MORE,
    },
    {
      id: 'parking',
      type: 'location',
      data: {
        location: {
          name: RESTAURANT.name,
          address: RESTAURANT.address,
          lat: RESTAURANT.lat,
          lng: RESTAURANT.lng,
        },
        caption:
          'Paid parking at the village entrance (₹60 for 2 hours). Green Park metro is 10 minutes by auto.',
      },
      next: MORE,
    },
    {
      id: MORE,
      type: 'buttons',
      data: {
        text: 'Anything else I can help with?',
        buttons: [
          { id: 'ask', title: 'Another question' },
          { id: 'reserve', title: 'Reserve a table' },
          { id: 'done', title: 'That’s all' },
        ],
      },
      next: { ask: ASK, reserve: 'to-reserve', done: 'done' },
    },
    {
      id: 'done',
      type: 'end',
      data: { text: 'Happy to help, {{user.firstName}}!', showMenu: true },
    },
    {
      id: 'host',
      type: 'handoff',
      data: {
        agentName: HOST.agentName,
        text: "Hi {{user.firstName}}, Kunal here, the floor manager. Ask me anything about the food or the evening — I'll check with the chef if I need to.",
      },
      next: 'host-card',
    },
    {
      id: 'host-card',
      type: 'contact',
      data: {
        contact: {
          name: HOST.name,
          phone: HOST.phone,
          role: HOST.role,
          organisation: 'The Saffron Table',
        },
      },
      next: 'host-end',
    },
    { id: 'host-end', type: 'end', data: { showMenu: true } },
  ],
});
