import { createAppPass } from '@exyconn/shell/auth/appPass';

/** The vendor portal pass (email-and-code sign-in), sent as `x-vendor-pass`. See createAppPass. */
export const vendorPass = createAppPass({
  storageKey: 'exyconn.vendorPortal.pass',
  header: 'x-vendor-pass',
});
