import gql from 'graphql-tag';

export const billingTypeDefs = gql`
  "How often a plan is charged."
  enum PlanInterval {
    MONTH
    YEAR
  }

  "Where a company's subscription stands."
  enum SubscriptionStatus {
    "On a free trial; modules close when it ends unpaid."
    TRIALING
    "Paid and current."
    ACTIVE
    "A renewal failed; access continues while the provider retries."
    PAST_DUE
    "Ended; only Admin and My Workspace stay open."
    CANCELLED
  }

  "Who collects a subscription's money."
  enum SubscriptionProvider {
    NONE
    STRIPE
    RAZORPAY
    "Set by a platform administrator (invoiced, courtesy or grandfathered)."
    MANUAL
  }

  "A gateway a company can pay its subscription through."
  enum CheckoutProvider {
    STRIPE
    RAZORPAY
  }

  "A plan's price in one currency, per interval."
  type PlanPrice {
    "ISO 4217 currency code."
    currency: String!
    amount: Float!
  }

  "A subscription plan companies choose from. Limits of 0 are unlimited."
  type BillingPlan {
    id: ID!
    "URL-safe handle, unique across the platform."
    key: String!
    name: String!
    description: String!
    prices: [PlanPrice!]!
    interval: PlanInterval!
    trialDays: Int!
    "Active people a company on this plan may have; 0 is unlimited."
    seatLimit: Int!
    "Every module, present and future. When false, modules lists what is included."
    allModules: Boolean!
    "Module roles included besides ADMIN and EMPLOYEE, which every plan opens."
    modules: [Role!]!
    "AI spend allowed per calendar month, in USD; 0 is unlimited."
    aiMonthlyUsdCap: Float!
    "Offered on the public sign-up page."
    isPublic: Boolean!
    "A retired plan keeps its subscribers but cannot be chosen."
    isActive: Boolean!
    "The platform's own grandfathered plan; cannot be deleted or retired."
    isSystem: Boolean!
    sortOrder: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  "A company's subscription."
  type BillingSubscription {
    id: ID!
    planId: ID!
    planKey: String!
    status: SubscriptionStatus!
    provider: SubscriptionProvider!
    "ISO 4217 currency it is charged in, or empty before the first payment."
    currency: String!
    trialEndsAt: DateTime
    currentPeriodEnd: DateTime
    "True when it will end with the period already paid for."
    cancelAtPeriodEnd: Boolean!
    cancelledAt: DateTime
    updatedAt: DateTime!
  }

  "A company's plan, status and usage against its limits."
  type BillingOverview {
    "Null for a company that has never been put on a plan (no limits apply)."
    subscription: BillingSubscription
    plan: BillingPlan
    "True when the trial ran out unpaid or the subscription was cancelled."
    lapsed: Boolean!
    seatsUsed: Int!
    aiSpentThisMonthUsd: Float!
    "The gateways configured for checkout."
    providers: [CheckoutProvider!]!
    "The plans this company can switch to."
    plans: [BillingPlan!]!
  }

  input PlanPriceInput {
    "ISO 4217 currency code, e.g. USD or INR."
    currency: String!
    "Price per interval in that currency's main unit (dollars, rupees)."
    amount: Float!
  }

  input BillingPlanInput {
    "URL-safe handle (lower-case letters, digits, dashes). Fixed once the plan exists."
    key: String!
    name: String!
    description: String
    "One price per currency it is sold in. No price (or all 0) makes it free."
    prices: [PlanPriceInput!]!
    interval: PlanInterval!
    "Free trial length for a new sign-up, 0 to 365 days."
    trialDays: Int!
    "Active people allowed; 0 is unlimited."
    seatLimit: Int!
    "Include every module."
    allModules: Boolean!
    "Module roles included when allModules is false (ADMIN and EMPLOYEE are always open)."
    modules: [Role!]!
    "AI spend allowed per calendar month in USD; 0 is unlimited."
    aiMonthlyUsdCap: Float!
    "Offer it on the public sign-up page."
    isPublic: Boolean!
    "False retires it: subscribers keep it, nobody new can choose it."
    isActive: Boolean!
    "Position in lists, lowest first."
    sortOrder: Int
  }

  input BillingCheckoutInput {
    "The plan to subscribe to."
    planId: ID!
    "ISO 4217 currency to pay in; the plan must have a price in it."
    currency: String!
    "The gateway to pay through."
    provider: CheckoutProvider!
  }

  extend type User {
    "The module roles this person's company plan opens besides ADMIN and EMPLOYEE; null when every module is open."
    planRoles: [Role!]
  }

  extend type Query {
    "Every plan in the catalogue, retired ones included (SUPER_ADMIN)."
    billingPlans: [BillingPlan!]!
    "The caller's company: its plan, subscription status, seats and AI used, and the plans it can move to (ADMIN)."
    billingOverview: BillingOverview!
    "One company's subscription, or null when it has none (SUPER_ADMIN)."
    organizationSubscription("The organization to read." organizationId: ID!): BillingSubscription
  }

  extend type Mutation {
    "Adds a plan to the catalogue (SUPER_ADMIN)."
    createBillingPlan(
      "The plan's price, limits and modules."
      input: BillingPlanInput!
    ): BillingPlan!
    "Changes a plan; companies on it get the new limits within a minute (SUPER_ADMIN)."
    updateBillingPlan(
      "The plan to change."
      id: ID!
      "The plan's new price, limits and modules. The key is kept."
      input: BillingPlanInput!
    ): BillingPlan!
    "Deletes a plan nobody is on; retire one with subscribers instead (SUPER_ADMIN)."
    deleteBillingPlan("The plan to delete." id: ID!): Boolean!
    "Opens a hosted Stripe or Razorpay checkout to subscribe the caller's company to a plan, and returns its URL. The subscription changes when the provider confirms payment (ADMIN)."
    startBillingCheckout("The plan, currency and gateway." input: BillingCheckoutInput!): String!
    "Cancels the caller's company subscription: a paid one ends with its period, a trial or manual one ends now (ADMIN)."
    cancelBillingSubscription: BillingOverview!
    "Places a company on a plan by hand, e.g. an invoiced deal (SUPER_ADMIN)."
    assignOrganizationPlan(
      "The organization to change."
      organizationId: ID!
      "The plan to put it on."
      planId: ID!
      "Its status on that plan."
      status: SubscriptionStatus!
    ): BillingSubscription!
  }
`;
