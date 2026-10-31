import gql from 'graphql-tag';

export const payoutTypeDefs = gql`
  "How money reaches the payee (the same codes as @exyconn/payout PAYOUT_METHODS)."
  enum PayoutMethod {
    BANK_TRANSFER
    UPI
    PAYPAL
    WISE
    PAYONEER
    WESTERN_UNION
  }

  "ISO 20022 cash account type: CURRENT (CACC, checking) or SAVINGS (SVGS)."
  enum BankAccountType {
    CURRENT
    SAVINGS
  }

  "A sealed detail of a payout account, shown in full only on request (and logged)."
  enum PayoutSecretField {
    ACCOUNT_NUMBER
    IBAN
    UPI_ID
    PHONE
    WALLET_EMAIL
  }

  "Masked forms of the sealed details; empty where none is stored."
  type PayoutAccountHints {
    accountNumber: String!
    iban: String!
    upiId: String!
    phone: String!
    walletEmail: String!
  }

  "Where one payee is paid: an employee's salary account or a client's refund account."
  type PayoutAccount {
    id: ID!
    method: PayoutMethod!
    "ISO 3166-1 alpha-2."
    country: String!
    "ISO 4217."
    currency: String!
    holderName: String!
    bankName: String!
    branchName: String!
    "ISO 9362 BIC / SWIFT code."
    bic: String!
    "The country's domestic bank or branch code: IFSC, ABA routing, sort code, BSB, transit."
    routingCode: String!
    accountType: BankAccountType
    city: String!
    region: String!
    hints: PayoutAccountHints!
    "One masked line naming the account."
    summary: String!
    isPrimary: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  "A blank sealed detail on an edit keeps the stored one."
  input PayoutAccountInput {
    method: PayoutMethod!
    country: String!
    currency: String!
    holderName: String!
    bankName: String!
    branchName: String!
    accountNumber: String!
    iban: String!
    bic: String!
    routingCode: String!
    accountType: BankAccountType
    upiId: String!
    phone: String!
    walletEmail: String!
    city: String!
    region: String!
    isPrimary: Boolean
  }

  extend type Query {
    "An employee's salary accounts (Payroll: HR or Finance)."
    employeePayoutAccounts(employeeId: ID!): [PayoutAccount!]!
    "One sealed detail of an employee's salary account in full. Logged."
    employeePayoutSecret(employeeId: ID!, id: ID!, field: PayoutSecretField!): String!
    "A client's refund accounts, as the client entered them in the client hub."
    clientPayoutAccounts(clientId: ID!): [PayoutAccount!]!
    "One sealed detail of a client's refund account in full. Logged."
    clientPayoutSecret(clientId: ID!, id: ID!, field: PayoutSecretField!): String!
    "The signed-in client's refund accounts."
    clientHubPayoutAccounts: [PayoutAccount!]!
    "One sealed detail of the signed-in client's refund account in full."
    clientHubPayoutSecret(id: ID!, field: PayoutSecretField!): String!
  }

  extend type Mutation {
    "Adds (no id) or replaces an employee's salary account. Nobody edits their own."
    saveEmployeePayoutAccount(employeeId: ID!, id: ID, input: PayoutAccountInput!): PayoutAccount!
    deleteEmployeePayoutAccount(employeeId: ID!, id: ID!): Boolean!
    "Adds (no id) or replaces one of the signed-in client's refund accounts."
    clientHubSavePayoutAccount(id: ID, input: PayoutAccountInput!): PayoutAccount!
    "Removes one of the signed-in client contact's refund accounts. Audited. Confirm with the person first."
    clientHubDeletePayoutAccount(id: ID!): Boolean!
  }
`;
