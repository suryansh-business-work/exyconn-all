import gql from 'graphql-tag';

/** The eye button on Tech > Environment Variables (see tech.reveal.ts). */
export const techRevealTypeDefs = gql`
  "A saved credential on Tech > Environment Variables that staff may reveal, one at a time."
  enum TechSecret {
    EMAIL_PASSWORD
    INBOUND_MAIL_PASSWORD
    IMAGEKIT_PRIVATE_KEY
    SLACK_BOT_TOKEN
    SLACK_SIGNING_SECRET
    GITHUB_TOKEN
    PEXELS_API_KEY
    OPENAI_API_KEY
    SONAR_TOKEN
    GODADDY_API_KEY
    GODADDY_API_SECRET
    CLOUDFLARE_API_TOKEN
    STRIPE_SECRET_KEY
    STRIPE_WEBHOOK_SECRET
    RAZORPAY_KEY_SECRET
    RAZORPAY_WEBHOOK_SECRET
    PAYPAL_CLIENT_SECRET
    PAYONEER_API_TOKEN
    EMAIL_VERIFIER_PROXY_PASSWORD
    SOCIAL_APP_CLIENT_SECRET
    GOOGLE_SIGN_IN_CLIENT_SECRET
  }

  extend type Mutation {
    "One saved credential of the config with this id, in full. Each reveal is audited."
    revealTechSecret(id: ID!, secret: TechSecret!): String!
  }
`;
