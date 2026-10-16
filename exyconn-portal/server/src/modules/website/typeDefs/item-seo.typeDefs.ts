import gql from 'graphql-tag';

/** Per-item meta, shared by every content type the website renders as its own page. */
export const itemSeoTypeDefs = gql`
  "An item's own search and share meta; a blank field keeps the page template's."
  type ItemSeo {
    title: String!
    description: String!
    keywords: String!
    "The image shown when the page is shared (1200x630 works best)."
    ogImageUrl: String!
    noindex: Boolean!
  }

  input ItemSeoInput {
    title: String
    description: String
    keywords: String
    ogImageUrl: String
    noindex: Boolean
  }
`;
