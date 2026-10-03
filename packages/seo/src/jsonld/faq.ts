import { schemaNode } from './compact';
import type { JsonLdNode } from '../types';

export interface FaqInput {
  readonly question: string;
  readonly answer: string;
}

/** schema.org FAQPage; the questions must also be visible on the page. */
export function faqPageLd(faqs: readonly FaqInput[]): JsonLdNode {
  return schemaNode('FAQPage', {
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  });
}
