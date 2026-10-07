import type { PexelsMediaFieldsFragment } from '@/graphql/generated';

/** A Pexels result as the server returns it; a duration above zero makes it a clip. */
export function pexelsItem(
  patch: Partial<PexelsMediaFieldsFragment> = {},
): PexelsMediaFieldsFragment {
  return {
    __typename: 'PexelsMedia',
    id: '101',
    previewUrl: 'https://images.pexels.com/101/small.jpg',
    url: 'https://images.pexels.com/101/full.jpg',
    alt: 'A lighthouse at dusk',
    credit: 'Mira Sol',
    duration: 0,
    ...patch,
  };
}
