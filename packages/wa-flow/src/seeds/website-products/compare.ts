/**
 * Compare products: pick a pair → a side-by-side spec sheet → shop the catalogue, ask a home
 * expert, or compare another pair.
 */
import { defineWorkflow, type AuthorNode } from '../../author';

const PAIRS = 'pairs';
const NEXT_STEP = 'next-step';

interface Comparison {
  id: string;
  title: string;
  description: string;
  left: string;
  right: string;
  specs: readonly (readonly [string, string, string])[];
  verdict: string;
}

const COMPARISONS: readonly Comparison[] = [
  {
    id: 'cams',
    title: 'Cam 2K vs Video Doorbell',
    description: 'Watch inside, or see who is at the door',
    left: 'Cam 2K',
    right: 'Video Doorbell',
    specs: [
      ['Price', '₹2,999', '₹6,499'],
      ['Video', '2K, 360° pan', 'HD, 160° wide'],
      ['Power', 'Plug-in', 'Wired or battery'],
      ['Best for', 'Kids, pets, elders', 'Deliveries, visitors'],
    ],
    verdict:
      'Most families start with the Doorbell at the entrance and add a Cam 2K for the living room.',
  },
  {
    id: 'lights',
    title: 'Bulbs vs Ceiling Panel',
    description: 'Room-by-room colour, or one bright panel',
    left: 'Smart Bulb 4-pack',
    right: 'Ceiling Panel',
    specs: [
      ['Price', '₹2,499', '₹5,499'],
      ['Brightness', '806 lm each', '3,600 lm'],
      ['Colours', '16 million', 'Tunable white'],
      ['Fitting', 'Any B22 holder', 'Ceiling mount'],
    ],
    verdict: 'Bulbs suit bedrooms and mood lighting; the Panel lights a whole living room evenly.',
  },
  {
    id: 'sound',
    title: 'Soundbar vs Speaker Mini',
    description: 'Cinema sound, or music in every room',
    left: 'Soundbar 2.1',
    right: 'Speaker Mini',
    specs: [
      ['Price', '₹11,999', '₹2,499'],
      ['Output', '160 W with subwoofer', '10 W'],
      ['Assistant', 'Via your TV', 'Built in'],
      ['Best for', 'Movies and sport', 'Kitchen, bedroom, desk'],
    ],
    verdict: 'Pick the Soundbar for the TV room; add a Speaker Mini or two for multi-room music.',
  },
];

function comparisonDoc(c: Comparison): AuthorNode {
  return {
    id: `doc-${c.id}`,
    type: 'document',
    data: {
      complete: true,
      document: {
        fileName: `Lumio-Compare-${c.id}.pdf`,
        fileType: 'PDF',
        pages: 2,
        sizeKb: 240,
        preview: {
          title: c.title,
          subtitle: 'Side-by-side comparison',
          sections: [
            {
              kind: 'table',
              columns: ['Feature', c.left, c.right],
              rows: c.specs.map(([feature, a, b]) => ({
                id: feature.toLowerCase().replaceAll(' ', '-'),
                cells: [feature, a, b],
              })),
            },
            { kind: 'text', heading: 'Our take', text: c.verdict },
          ],
          footer: 'Both work with the Lumio app, Alexa and Google Home.',
        },
      },
    },
    next: NEXT_STEP,
  };
}

export const compare = defineWorkflow({
  key: 'compare',
  name: 'Compare products',
  description: 'Side-by-side specs for our most-asked pairs',
  keywords: ['compare', 'comparison', 'difference', 'vs', 'versus', 'which is better'],
  nodes: [
    {
      id: PAIRS,
      type: 'list',
      data: {
        text: 'Torn between two? Pick a pair and I will lay them side by side.',
        button: 'Choose pair',
        sections: [
          {
            id: 'pairs',
            title: 'Popular comparisons',
            rows: COMPARISONS.map((c) => ({
              id: c.id,
              title: c.title,
              description: c.description,
            })),
          },
        ],
      },
      next: Object.fromEntries(COMPARISONS.map((c) => [c.id, `doc-${c.id}`])),
    },
    ...COMPARISONS.map(comparisonDoc),
    {
      id: NEXT_STEP,
      type: 'buttons',
      data: {
        text: 'Ready to choose, or want a second opinion?',
        buttons: [
          { id: 'shop', title: 'Shop now' },
          { id: 'expert', title: 'Ask an expert' },
          { id: 'more', title: 'Compare another' },
        ],
      },
      next: { shop: 'to-shop', expert: 'to-human', more: PAIRS },
    },
    { id: 'to-shop', type: 'jump', data: { workflowKey: 'catalogue' } },
    { id: 'to-human', type: 'jump', data: { workflowKey: 'human' } },
  ],
});
