import gql from 'graphql-tag';

/** What the website reads to render a CMS site (no sign-in). */
export const cmsPublicTypeDefs = gql`
  "A published fragment's block tree (@exyconn/cms CmsBlock[]) and CSS."
  type CmsPublicFragment {
    id: ID!
    blocks: JSON!
    css: String!
  }

  "Everything every page of a site shares."
  type CmsPublicSite {
    site: CmsSite!
    designSystem: CmsDesignSystem
    "The header and footer, and the fragments they place."
    fragments: [CmsPublicFragment!]!
  }

  type CmsPublicPageData {
    id: ID!
    path: String!
    kind: CmsPageKind!
    title: String!
    seo: CmsPageSeo!
    layout: CmsPageLayout!
    blocks: JSON!
    css: String!
    publishedAt: DateTime!
    "The values a template path bound, e.g. { slug: 'hello' } for /blog/:slug."
    params: JSON!
    "True for a draft shown through a preview link (never index it)."
    preview: Boolean!
  }

  type CmsPublicPage {
    page: CmsPublicPageData!
    "Every published fragment the page places, nested ones included."
    fragments: [CmsPublicFragment!]!
  }

  type CmsPublicPath {
    path: String!
    updatedAt: DateTime!
  }

  input NewsletterSignupInput {
    "The site's key; the default site when empty."
    site: String
    email: String!
    name: String
    "The page they signed up on."
    source: String
  }

  extend type Query {
    "The site served at a host (the default site for an unknown one)."
    publicCmsSite(host: String!): CmsPublicSite!
    "The page at a path, else the template it fits; a draft with a valid preview token. Null for 404."
    publicCmsPage(siteId: ID!, path: String!, previewToken: String): CmsPublicPage
    publicCmsPaths(siteId: ID!): [CmsPublicPath!]!
    publicNewsletterIssues(site: String): [NewsletterIssue!]!
    publicNewsletterIssue(slug: String!, site: String): NewsletterIssue
  }

  extend type Mutation {
    "Public, from the website's server: signs somebody up, answering the site's security question."
    subscribeNewsletter(input: NewsletterSignupInput!, captcha: WebsiteCaptchaAnswer!): Boolean!
    "Public: the unsubscribe link in a newsletter email."
    unsubscribeNewsletter(token: String!): Boolean!
  }
`;
