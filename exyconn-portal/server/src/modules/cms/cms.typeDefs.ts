import gql from 'graphql-tag';

/** Website › Websites, Pages, Fragments, Design System and Media (website team). */
export const cmsTypeDefs = gql`
  enum CmsSiteStatus {
    ACTIVE
    DRAFT
  }

  enum CmsDocumentStatus {
    "Never published."
    DRAFT
    "Live, and unchanged since it was published."
    PUBLISHED
    "Live, with newer edits waiting to be published."
    CHANGED
  }

  enum CmsPageKind {
    "One page at one path."
    PAGE
    "A family of pages, e.g. /blog/:slug; its components read the matching item."
    TEMPLATE
  }

  enum CmsPageLayout {
    "With the site's header and footer."
    default
    "Without them (a landing page, an embed)."
    bare
  }

  enum CmsFragmentKind {
    HEADER
    FOOTER
    SECTION
    SNIPPET
  }

  type CmsSiteSeo {
    "The title pattern; %s is the page title."
    titleTemplate: String!
    description: String!
    ogImageUrl: String!
  }

  "A website the CMS serves, with its domains, design system, header and footer."
  type CmsSite {
    id: ID!
    name: String!
    slug: String!
    domains: [String!]!
    "The site unknown hosts (localhost) are served as."
    isDefault: Boolean!
    status: CmsSiteStatus!
    "Pages are served under a market prefix (/en-us/…) with alternates for every market."
    markets: Boolean!
    defaultLocale: String!
    faviconUrl: String!
    seo: CmsSiteSeo!
    headerFragmentId: String!
    footerFragmentId: String!
    designSystemId: String!
    "Markup added to every page's head (meta tags, analytics)."
    headHtml: String!
    "Markup added before every page's closing body tag (scripts)."
    bodyEndHtml: String!
    globalCss: String!
    notFoundPageId: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CmsSiteSeoInput {
    titleTemplate: String
    description: String
    ogImageUrl: String
  }

  input CmsSiteInput {
    name: String!
    slug: String!
    domains: [String!]!
    status: CmsSiteStatus!
    markets: Boolean!
    defaultLocale: String!
    faviconUrl: String
    seo: CmsSiteSeoInput
    headerFragmentId: String
    footerFragmentId: String
    designSystemId: String
    headHtml: String
    bodyEndHtml: String
    globalCss: String
    notFoundPageId: String
  }

  "A site's colours (light and dark), type, radii, shadows and spacing, as CSS custom properties."
  type CmsDesignSystem {
    id: ID!
    siteId: String!
    name: String!
    "{ colors: { light, dark }, fonts, radii, shadows, spacing } — each a map of name to CSS value."
    tokens: JSON!
    extraCss: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CmsDesignSystemInput {
    siteId: String!
    name: String!
    tokens: JSON!
    extraCss: String
  }

  type CmsPageSeo {
    title: String!
    description: String!
    keywords: String!
    ogImageUrl: String!
    canonical: String!
    noindex: Boolean!
    jsonLd: JSON
  }

  "What the editor last saved: GrapesJS's project, and the HTML and CSS it produced."
  type CmsDraft {
    projectData: JSON
    html: String!
    css: String!
  }

  type CmsPublished {
    publishedAt: DateTime!
  }

  type CmsPage {
    id: ID!
    siteId: String!
    path: String!
    kind: CmsPageKind!
    title: String!
    seo: CmsPageSeo!
    layout: CmsPageLayout!
    "Only on a single page (cmsPage), never in lists."
    draft: CmsDraft
    published: CmsPublished
    status: CmsDocumentStatus!
    updatedByName: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type CmsPagePage {
    rows: [CmsPage!]!
    totalCount: Int!
  }

  input CmsPageListInput {
    page: Int!
    pageSize: Int!
    search: String
    status: CmsDocumentStatus
    kind: CmsPageKind
  }

  input CmsPageSeoInput {
    title: String
    description: String
    keywords: String
    ogImageUrl: String
    canonical: String
    noindex: Boolean
    jsonLd: JSON
  }

  input CmsPageSettingsInput {
    path: String!
    title: String!
    kind: CmsPageKind!
    layout: CmsPageLayout!
    seo: CmsPageSeoInput
  }

  input CmsDraftInput {
    projectData: JSON
    html: String!
    css: String!
  }

  type CmsPageRevision {
    id: ID!
    version: Int!
    title: String!
    publishedByName: String!
    createdAt: DateTime!
  }

  "A reusable header, footer or section, placed into pages and published once for all of them."
  type CmsFragment {
    id: ID!
    siteId: String!
    name: String!
    kind: CmsFragmentKind!
    "Only on a single fragment (cmsFragment), never in lists."
    draft: CmsDraft
    published: CmsPublished
    status: CmsDocumentStatus!
    updatedByName: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CmsFragmentInput {
    name: String!
    kind: CmsFragmentKind!
  }

  "An image in a site's media library."
  type CmsAsset {
    id: ID!
    siteId: String!
    url: String!
    name: String!
    mime: String!
    size: Int!
    width: Int!
    height: Int!
    alt: String!
    createdAt: DateTime!
  }

  type CmsAssetPage {
    rows: [CmsAsset!]!
    totalCount: Int!
  }

  input CmsAssetUploadInput {
    siteId: String!
    "A data: URL (image or PDF, up to 12 MB)."
    file: String!
    fileName: String!
    alt: String
    width: Int
    height: Int
  }

  "A dynamic component the website can render (the @exyconn/cms catalogue)."
  type CmsComponentDef {
    key: String!
    label: String!
    category: String!
    description: String!
    defaultProps: JSON!
    acceptsChildren: Boolean!
  }

  type CmsARecord {
    ip: String!
    ttl: Int!
  }

  "One domain of a site, where its DNS is served and the A records it points to."
  type CmsDomainDns {
    domain: String!
    "The registered domain on the GoDaddy account it lives under."
    zone: String!
    "The host within it: @ for the domain itself, else e.g. www."
    name: String!
    "GODADDY, CLOUDFLARE, OTHER — or UNKNOWN when it could not be read."
    authority: String!
    records: [CmsARecord!]!
    "Every A record is the websites' server address."
    pointsHere: Boolean!
    "Why the records could not be read; empty when they were."
    error: String!
  }

  type CmsSiteDns {
    "The address websites are served from (WEBSITE_SERVER_IP); empty when not configured."
    serverIp: String!
    domains: [CmsDomainDns!]!
  }

  "A Google Fonts family: its styles (400, 700i…), subsets and variable axes."
  type CmsGoogleFont {
    family: String!
    category: String!
    variants: [String!]!
    subsets: [String!]!
    axes: [CmsFontAxis!]!
    "Rank by use on the web; 1 is the most used."
    popularity: Int!
  }

  type CmsFontAxis {
    tag: String!
    min: Float!
    max: Float!
  }

  type CmsGoogleFontPage {
    rows: [CmsGoogleFont!]!
    totalCount: Int!
  }

  extend type Query {
    "Website › Settings › Domains: each domain's DNS provider and A records (through GoDaddy/Cloudflare in Tech)."
    cmsSiteDns(siteId: ID!): CmsSiteDns!
    "The Google Fonts catalogue, most used first; category is Sans Serif, Serif, Display, Handwriting or Monospace."
    cmsGoogleFonts(search: String, category: String, limit: Int): CmsGoogleFontPage!
    cmsSites: [CmsSite!]!
    cmsSite(id: ID!): CmsSite!
    cmsSiteBySlug(slug: String!): CmsSite!
    cmsDesignSystems(siteId: ID!): [CmsDesignSystem!]!
    cmsDesignSystem(id: ID!): CmsDesignSystem!
    cmsPages(siteId: ID!, input: CmsPageListInput!): CmsPagePage!
    cmsPage(id: ID!): CmsPage!
    cmsPageRevisions(pageId: ID!): [CmsPageRevision!]!
    "A link token that shows the page's draft on the website for two hours."
    cmsPreviewToken(pageId: ID!): String!
    cmsFragments(siteId: ID!): [CmsFragment!]!
    cmsFragment(id: ID!): CmsFragment!
    cmsAssets(siteId: ID!, page: Int!, pageSize: Int!, search: String): CmsAssetPage!
    "The dynamic components an editor can drop into a page."
    cmsComponents: [CmsComponentDef!]!
  }

  extend type Mutation {
    "Points one of the site's domains at an IPv4 address, at whichever provider serves its DNS."
    setCmsSiteARecord(siteId: ID!, domain: String!, ip: String!, ttl: Int!): CmsDomainDns!
    createCmsSite(input: CmsSiteInput!): CmsSite!
    updateCmsSite(id: ID!, input: CmsSiteInput!): CmsSite!
    setDefaultCmsSite(id: ID!): CmsSite!
    deleteCmsSite(id: ID!): Boolean!
    createCmsDesignSystem(input: CmsDesignSystemInput!): CmsDesignSystem!
    updateCmsDesignSystem(id: ID!, input: CmsDesignSystemInput!): CmsDesignSystem!
    deleteCmsDesignSystem(id: ID!): Boolean!
    createCmsPage(siteId: ID!, input: CmsPageSettingsInput!): CmsPage!
    updateCmsPageSettings(id: ID!, input: CmsPageSettingsInput!): CmsPage!
    saveCmsPageDraft(id: ID!, draft: CmsDraftInput!): CmsPage!
    publishCmsPage(id: ID!): CmsPage!
    unpublishCmsPage(id: ID!): CmsPage!
    duplicateCmsPage(id: ID!, path: String!): CmsPage!
    deleteCmsPage(id: ID!): Boolean!
    "Copies a published version back into the draft (publish it to put it live)."
    restoreCmsPageRevision(revisionId: ID!): CmsPage!
    createCmsFragment(siteId: ID!, input: CmsFragmentInput!): CmsFragment!
    updateCmsFragment(id: ID!, input: CmsFragmentInput!): CmsFragment!
    saveCmsFragmentDraft(id: ID!, draft: CmsDraftInput!): CmsFragment!
    publishCmsFragment(id: ID!): CmsFragment!
    deleteCmsFragment(id: ID!): Boolean!
    uploadCmsAsset(input: CmsAssetUploadInput!): CmsAsset!
    updateCmsAssetAlt(id: ID!, alt: String!): CmsAsset!
    deleteCmsAsset(id: ID!): Boolean!
  }
`;
