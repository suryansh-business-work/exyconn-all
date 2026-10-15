/**
 * Product finder quiz: what matters most → type of home → budget → a condition routes to the
 * recommendations for that goal (a carousel) → checkout.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import { checkoutNodes } from './checkout';
import { categoryOf, itemCard } from './data';

const GOALS = [
  { id: 'security', title: 'Home security' },
  { id: 'lighting', title: 'Lighting & comfort' },
  { id: 'audio', title: 'Music & TV' },
] as const;

const HOMES = [
  { id: 'flat', title: 'Apartment' },
  { id: 'house', title: 'Independent house' },
  { id: 'office', title: 'Small office' },
] as const;

const BUDGETS = [
  { id: 'b-low', title: 'Under ₹5,000' },
  { id: 'b-mid', title: '₹5,000 – ₹15,000' },
  { id: 'b-high', title: 'Above ₹15,000' },
] as const;

function picks(goal: (typeof GOALS)[number]): AuthorNode {
  const category = categoryOf(goal.id);
  return {
    id: `rec-${goal.id}`,
    type: 'carousel',
    data: {
      text: 'Our picks for {{goalLabel|lower}} in a {{homeLabel|lower}}, ranked for a budget of {{budgetLabel}}:',
      cards: category.items.map((item) => itemCard(item, category.icon, 'Buy now')),
    },
    next: Object.fromEntries(category.items.map((item) => [item.id, 'quiz-cart'])),
  };
}

export const finder = defineWorkflow({
  key: 'finder',
  name: 'Find my product',
  description: 'Three questions, then our best picks for you',
  keywords: ['recommend', 'suggest', 'which product', 'help me choose', 'quiz', 'finder'],
  nodes: [
    {
      id: 'goal',
      type: 'buttons',
      data: {
        header: 'Product finder',
        text: 'Not sure where to start, {{user.firstName}}? Answer three quick questions and I will pick the right gear. What matters most?',
        buttons: GOALS.map((g) => ({
          id: g.id,
          title: g.title,
          set: { goal: g.id, goalLabel: g.title },
        })),
      },
      next: Object.fromEntries(GOALS.map((g) => [g.id, 'home'])),
    },
    {
      id: 'home',
      type: 'buttons',
      data: {
        text: 'Where will you use it?',
        buttons: HOMES.map((h) => ({ id: h.id, title: h.title, set: { homeLabel: h.title } })),
      },
      next: Object.fromEntries(HOMES.map((h) => [h.id, 'budget'])),
    },
    {
      id: 'budget',
      type: 'buttons',
      data: {
        text: 'And roughly how much would you like to spend?',
        buttons: BUDGETS.map((b) => ({ id: b.id, title: b.title, set: { budgetLabel: b.title } })),
      },
      next: Object.fromEntries(BUDGETS.map((b) => [b.id, 'route'])),
    },
    {
      id: 'route',
      type: 'condition',
      data: {
        cases: [
          { id: 'security', var: 'goal', op: 'eq', value: 'security' },
          { id: 'lighting', var: 'goal', op: 'eq', value: 'lighting' },
        ],
      },
      next: { security: 'rec-security', lighting: 'rec-lighting', else: 'rec-audio' },
    },
    ...GOALS.map(picks),
    ...checkoutNodes('quiz'),
  ],
});
