import gql from 'graphql-tag';

/**
 * `publicBranding` is intentionally unauthenticated: the marketing website, the tools apps
 * and the desktop tracker's login screen all need the logo/colours before anyone signs in.
 * Only `updateBranding` is privileged (ADMIN).
 *
 * `uploadImage` is the single upload path behind the portal's shared ImageUploadDialog —
 * any image field (branding, avatars, blog covers, tool icons) goes through it.
 */
export const brandingTypeDefs = gql`
  # One portal app's login screen. The sign-in form is identical everywhere; only the
  # background, the portal name and the accent change per subdomain.
  type LoginPage {
    app: String!
    name: String!
    tagline: String!
    backgroundImageUrl: String!
    accentColor: String!
  }

  input LoginPageInput {
    app: String!
    name: String!
    tagline: String!
    backgroundImageUrl: String!
    accentColor: String!
  }

  type Branding {
    id: ID!
    businessName: String!
    legalName: String!
    slogan: String!
    description: String!

    logoUrl: String!
    logoDarkUrl: String!
    faviconUrl: String!
    appIconUrl: String!
    emailLogoUrl: String!
    ogImageUrl: String!

    primaryColor: String!
    secondaryColor: String!
    accentColor: String!
    backgroundColor: String!
    textColor: String!

    supportEmail: String!
    contactPhone: String!
    websiteUrl: String!
    address: String!

    linkedinUrl: String!
    twitterUrl: String!
    facebookUrl: String!
    instagramUrl: String!
    youtubeUrl: String!
    githubUrl: String!

    copyrightText: String!

    loginPages: [LoginPage!]!
  }

  input BrandingInput {
    businessName: String
    legalName: String
    slogan: String
    description: String

    logoUrl: String
    logoDarkUrl: String
    faviconUrl: String
    appIconUrl: String
    emailLogoUrl: String
    ogImageUrl: String

    primaryColor: String
    secondaryColor: String
    accentColor: String
    backgroundColor: String
    textColor: String

    supportEmail: String
    contactPhone: String
    websiteUrl: String
    address: String

    linkedinUrl: String
    twitterUrl: String
    facebookUrl: String
    instagramUrl: String
    youtubeUrl: String
    githubUrl: String

    copyrightText: String

    loginPages: [LoginPageInput!]
  }

  extend type Query {
    branding: Branding!
    publicBranding: Branding!
  }

  extend type Mutation {
    updateBranding(input: BrandingInput!): Branding!
    # Uploads a base64 data-URL image to ImageKit and returns its hosted URL. The folder
    # arg just groups uploads (branding, blog...); any authenticated user may call it.
    uploadImage(file: String!, fileName: String!, folder: String): String!
  }
`;
