/**
 * Property enquiry: buy (budget → locality) or rent, or describe it in one line ("3BHK
 * under 1.2 crore near Gachibowli") read by an `ai` node whose budget picks the band. Matches
 * come as a carousel → the home's card and brochure PDF → site visit, callback or more homes.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import type { Product } from '../../schema';
import {
  BUY_BANDS,
  LOCALITIES,
  OFFICE,
  RENTALS,
  RM,
  listingSet,
  type Band,
  type Listing,
} from './data';

const BUDGET = 'budget';
const ROUTE = 'route';
const DETAIL = 'detail';
const [LOW, MID, HIGH] = BUY_BANDS;

function listingCard(listing: Listing): Product {
  return {
    id: listing.id,
    title: listing.title,
    subtitle: `${listing.config} · ${listing.sqft} sq ft · ${listing.area} · ${listing.possession}`,
    price: listing.price,
    badge: listing.badge,
    image: { icon: listing.icon, accent: 'blue', title: listing.title, subtitle: listing.area },
    buttonTitle: 'View details',
    set: listingSet(listing),
  };
}

/** One carousel per budget band. */
function bandCarousel(band: Band): AuthorNode {
  return {
    id: `homes-${band.id}`,
    type: 'carousel',
    data: {
      text: 'Top picks around {{area}} · {{band}}. Prices include car parking; registration is extra.',
      cards: band.listings.map(listingCard),
    },
    next: Object.fromEntries(band.listings.map((l) => [l.id, DETAIL])),
  };
}

export const find = defineWorkflow({
  key: 'find',
  name: 'Find a home',
  description: 'Buy or rent — filter by budget and locality',
  keywords: ['buy', 'rent', 'apartment', 'property', 'bhk', 'villa', 'house', 'budget'],
  nodes: [
    {
      id: 'start',
      type: 'buttons',
      data: {
        header: 'Find a home',
        text: 'Hi {{user.firstName}}! Are you looking to buy or rent? Or just describe what you want, like "3BHK under 1.2 crore near Gachibowli".',
        footer: 'RERA-registered projects only',
        buttons: [
          { id: 'buy', title: 'Buy' },
          { id: 'rent', title: 'Rent', set: { area: 'West Hyderabad' } },
          { id: 'describe', title: 'Describe it' },
        ],
      },
      next: { buy: BUDGET, rent: 'rentals', describe: 'ai' },
    },
    {
      id: 'ai',
      type: 'ai',
      data: {
        set: { budgetLakh: '', area: 'West Hyderabad' },
        prompt: 'Go ahead — budget, locality and size, in your own words.',
        intents: [
          { id: 'buy', description: 'Wants to buy a home: apartment, villa or plot' },
          { id: 'rent', description: 'Wants to rent a home' },
          { id: 'sell', description: 'Wants to sell or rent out their own property' },
          { id: 'human', description: 'Wants to talk to a person' },
        ],
        entities: [
          {
            name: 'budgetLakh',
            kind: 'number',
            description: 'Budget in lakh rupees, e.g. 1.2 crore = 120, 80 lakh = 80',
          },
          { name: 'area', kind: 'location', description: 'Preferred locality in Hyderabad' },
        ],
        retry: 'Let me ask you step by step instead.',
      },
      next: { buy: 'ai-budget', rent: 'rentals', sell: 'rm', human: 'rm', fallback: BUDGET },
    },
    {
      id: 'ai-budget',
      type: 'condition',
      data: {
        note: 'Budget in lakh: under 80, under 150, or above. No budget → ask.',
        cases: [
          { id: 'none', var: 'budgetLakh', op: 'empty' },
          { id: 'low', var: 'budgetLakh', op: 'lt', value: '80' },
          { id: 'mid', var: 'budgetLakh', op: 'lt', value: '150' },
        ],
      },
      next: { none: BUDGET, low: 'ai-low', mid: 'ai-mid', else: 'ai-high' },
    },
    {
      id: 'ai-low',
      type: 'delay',
      data: { ms: 300, set: { band: LOW.title, bandId: LOW.id } },
      next: ROUTE,
    },
    {
      id: 'ai-mid',
      type: 'delay',
      data: { ms: 300, set: { band: MID.title, bandId: MID.id } },
      next: ROUTE,
    },
    {
      id: 'ai-high',
      type: 'delay',
      data: { ms: 300, set: { band: HIGH.title, bandId: HIGH.id } },
      next: ROUTE,
    },
    {
      id: BUDGET,
      type: 'list',
      data: {
        text: "What's your budget?",
        footer: 'All-inclusive price, before registration',
        button: 'Budget',
        sections: [
          {
            id: 'bands',
            title: 'Budget',
            rows: BUY_BANDS.map((b) => ({
              id: b.id,
              title: b.title,
              description: b.description,
              set: { band: b.title, bandId: b.id },
            })),
          },
        ],
      },
      next: Object.fromEntries(BUY_BANDS.map((b) => [b.id, 'locality'])),
    },
    {
      id: 'locality',
      type: 'list',
      data: {
        text: 'Which locality do you prefer?',
        button: 'Localities',
        sections: [
          {
            id: 'west',
            title: 'West Hyderabad',
            rows: LOCALITIES.map((l) => ({ id: l.id, title: l.title, set: { area: l.title } })),
          },
        ],
      },
      next: Object.fromEntries(LOCALITIES.map((l) => [l.id, ROUTE])),
    },
    {
      id: ROUTE,
      type: 'condition',
      data: {
        cases: [
          { id: MID.id, var: 'bandId', op: 'eq', value: MID.id },
          { id: HIGH.id, var: 'bandId', op: 'eq', value: HIGH.id },
        ],
      },
      next: { [MID.id]: `homes-${MID.id}`, [HIGH.id]: `homes-${HIGH.id}`, else: `homes-${LOW.id}` },
    },
    ...BUY_BANDS.map(bandCarousel),
    {
      id: 'rentals',
      type: 'carousel',
      data: {
        text: 'Homes for rent around {{area}}. Two months’ deposit; no brokerage on these.',
        cards: RENTALS.map(listingCard),
      },
      next: Object.fromEntries(RENTALS.map((l) => [l.id, DETAIL])),
    },
    {
      id: DETAIL,
      type: 'image',
      data: {
        image: {
          icon: 'realestate',
          accent: 'blue',
          title: '{{listing}}',
          subtitle: '{{listingConfig}} · {{listingArea}}',
        },
        caption:
          '*{{listing}}, {{listingArea}}*\n{{listingConfig}} · {{sqft}} sq ft · {{listingPrice}}\nPossession: {{possession}} · RERA {{rera}}\nClubhouse, pool, gym, 24×7 security and power back-up.',
      },
      next: 'brochure',
    },
    {
      id: 'brochure',
      type: 'document',
      data: {
        document: {
          fileName: 'Skyline_Project_Brochure.pdf',
          fileType: 'PDF',
          pages: 18,
          sizeKb: 5120,
          preview: {
            title: '{{listing}}',
            subtitle: '{{listingArea}}, Hyderabad · RERA {{rera}}',
            sections: [
              {
                kind: 'fields',
                heading: 'Home',
                fields: [
                  { label: 'Configuration', value: '{{listingConfig}}' },
                  { label: 'Carpet area', value: '{{sqft}} sq ft' },
                  { label: 'Price', value: '{{listingPrice}}' },
                  { label: 'Possession', value: '{{possession}}' },
                ],
              },
              {
                kind: 'table',
                heading: 'Nearby',
                columns: ['Place', 'Distance'],
                rows: [
                  { id: 'it', cells: ['Hitech City / Financial District', '10–20 min'] },
                  { id: 'airport', cells: ['RGI Airport', '35 min via ORR'] },
                  { id: 'school', cells: ['International schools', 'Within 3 km'] },
                  { id: 'hospital', cells: ['Multi-speciality hospital', 'Within 5 km'] },
                ],
              },
              {
                kind: 'text',
                heading: 'Amenities',
                text: 'Clubhouse, swimming pool, gym, indoor games, children’s play area, jogging track, EV charging, rainwater harvesting and 3-tier security.',
              },
            ],
            footer:
              'Prices and possession dates are indicative. Please verify on the RERA website.',
          },
        },
        caption: 'Floor plans, amenities and location for {{listing}}.',
      },
      next: 'next',
    },
    {
      id: 'next',
      type: 'buttons',
      data: {
        text: 'Seeing it in person is the best way to decide. What next?',
        buttons: [
          { id: 'visit', title: 'Book site visit' },
          { id: 'call', title: 'Request callback' },
          { id: 'more', title: 'More homes' },
        ],
      },
      next: { visit: 'to-visit', call: 'to-callback', more: 'start' },
    },
    { id: 'to-visit', type: 'jump', data: { workflowKey: 'visit' } },
    { id: 'to-callback', type: 'jump', data: { workflowKey: 'callback' } },
    {
      id: 'rm',
      type: 'handoff',
      data: {
        agentName: RM.agentName,
        text: "Hi {{user.firstName}}, I'm Karthik, a relationship manager at Skyline. Tell me a little about what you need — buying, renting or selling — and I'll shortlist options for you today.",
      },
      next: 'rm-cta',
    },
    {
      id: 'rm-cta',
      type: 'cta',
      data: {
        text: 'Or take a virtual tour while we talk.',
        actions: [
          { kind: 'url', title: 'Virtual tour', url: OFFICE.tour },
          { kind: 'call', title: 'Call Karthik', phone: RM.phone },
        ],
      },
      next: 'rm-end',
    },
    { id: 'rm-end', type: 'end', data: { showMenu: true } },
  ],
});
