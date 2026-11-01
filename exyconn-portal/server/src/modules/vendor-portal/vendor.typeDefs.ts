import gql from 'graphql-tag';

/**
 * The vendor portal (vendors.exyconn.com) from the supplier's side: email-code sign-in, their
 * purchase orders and the invoices they send against them. Every operation here needs a
 * vendor pass (x-vendor-pass); none of them is open to a portal session.
 */
export const vendorPortalTypeDefs = gql`
  enum VendorInvoiceStatus {
    SUBMITTED
    APPROVED
    REJECTED
  }

  "NOT_BILLED until the buyer approves the invoice; then the Finance bill's UNPAID or PAID."
  enum VendorPaymentStatus {
    NOT_BILLED
    UNPAID
    PAID
  }

  "The signed-in vendor contact and the supplier they act for."
  type VendorPortalMe {
    name: String!
    email: String!
    supplierName: String!
    supplierCode: String!
  }

  "A vendor portal sign-in: the pass to send as x-vendor-pass on every vendor portal request."
  type VendorPortalSession {
    token: String!
    name: String!
    email: String!
  }

  "An invoice a supplier sent against one of their purchase orders, and where it stands."
  type VendorInvoice {
    id: ID!
    supplierId: String!
    supplierName: String!
    purchaseOrderId: String!
    purchaseOrderNumber: String!
    invoiceNumber: String!
    invoiceDate: DateTime!
    dueDate: DateTime!
    amount: Float!
    currency: String!
    notes: String!
    "The invoice document (PDF or image)."
    fileUrl: String!
    fileName: String!
    status: VendorInvoiceStatus!
    submittedBy: String!
    reviewedBy: String!
    reviewedAt: DateTime
    "Why the buyer sent it back, when it was rejected."
    reviewNote: String!
    "Whether the buyer has paid it, read from the Finance bill an approval filed."
    paymentStatus: VendorPaymentStatus!
    paidOn: DateTime
    createdAt: DateTime!
  }

  type VendorInvoicePage {
    rows: [VendorInvoice!]!
    totalCount: Int!
  }

  input VendorInvoiceInput {
    "The purchase order this invoice bills."
    purchaseOrderId: ID!
    "The supplier's own invoice number."
    invoiceNumber: String!
    invoiceDate: DateTime!
    dueDate: DateTime!
    "The invoice total, in the order's currency."
    amount: Float!
    notes: String
    "The uploaded invoice document's URL, from vendorUploadInvoiceFile."
    fileUrl: String!
    fileName: String!
  }

  extend type Query {
    "Vendor pass: the signed-in contact and their supplier."
    vendorPortalMe: VendorPortalMe!
    "Vendor pass: the supplier's purchase orders (never drafts), one page at a time."
    vendorPurchaseOrders(input: TableQueryInput!): PurchaseOrderPage!
    "Vendor pass: the invoices the supplier sent, with review and payment status."
    vendorInvoices(input: TableQueryInput!): VendorInvoicePage!
  }

  extend type Mutation {
    "Emails a vendor portal sign-in code to a supplier contact who has access."
    requestVendorPortalCode(email: String!): Boolean!
    "Signs a vendor contact in with the emailed code and returns their vendor pass."
    verifyVendorPortalCode(email: String!, code: String!): VendorPortalSession!
    "Vendor pass: confirms the supplier has received an open purchase order."
    vendorAcknowledgePurchaseOrder(id: ID!): PurchaseOrder!
    "Vendor pass: uploads an invoice document (PDF or image, base64 data URL, up to 12 MB) and returns its URL."
    vendorUploadInvoiceFile(file: String!, fileName: String!): String!
    "Vendor pass: sends an invoice against one of the supplier's purchase orders for review."
    vendorSubmitInvoice(input: VendorInvoiceInput!): VendorInvoice!
  }
`;

/**
 * The buyer's side: who at a supplier may use the vendor portal, and reviewing the invoices
 * suppliers send. These are Products operations, offered on the Products MCP server.
 */
export const vendorStaffTypeDefs = gql`
  "A person at a supplier who may sign in to the vendor portal with an emailed code."
  type VendorContact {
    id: ID!
    supplierId: String!
    name: String!
    email: String!
    active: Boolean!
    lastSignInAt: DateTime
    signInCount: Int!
    createdAt: DateTime!
  }

  input VendorContactInput {
    "The supplier the person works for."
    supplierId: ID!
    name: String!
    "The address they sign in with; it may have vendor portal access at one supplier only."
    email: String!
  }

  extend type Query {
    "Lists who at a supplier may sign in to the vendor portal."
    vendorContacts("The supplier's id." supplierId: ID!): [VendorContact!]!
    "Lists the invoices suppliers sent through the vendor portal, one page at a time, with payment status."
    listVendorInvoicesPaged(input: TableQueryInput!): VendorInvoicePage!
    "Summary numbers for vendor invoices: total, counts by status and the summed amount."
    listVendorInvoicesStats: TableStats!
  }

  extend type Mutation {
    "Gives a supplier contact vendor portal access and emails them where to sign in."
    addVendorContact(input: VendorContactInput!): VendorContact!
    "Switches a vendor contact's access off (signing them out at once) or back on."
    setVendorContactActive("The vendor contact's id." id: ID!, active: Boolean!): VendorContact!
    "Removes a vendor contact's access for good. Confirm with the person first."
    deleteVendorContact("The vendor contact's id." id: ID!): Boolean!
    "Approves a submitted vendor invoice and files it as an unpaid Finance bill; paying the bill in Finance marks it paid for the supplier."
    approveVendorInvoice("The vendor invoice's id." id: ID!): VendorInvoice!
    "Sends a submitted vendor invoice back to the supplier with the reason."
    rejectVendorInvoice(
      "The vendor invoice's id."
      id: ID!
      "Why it is rejected; the supplier sees this."
      reason: String!
    ): VendorInvoice!
  }
`;
