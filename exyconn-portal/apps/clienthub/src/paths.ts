/** The client hub's screens. `/invoices?pay=<id>` opens an invoice ready to pay (email links). */
export const PATHS = {
  dashboard: '/dashboard',
  invoices: '/invoices',
  transactions: '/transactions',
  paymentReturn: '/payments/return',
  support: '/support',
  projects: '/projects',
  links: '/links',
  communications: '/communications',
  documents: '/documents',
} as const;
