import { createAppPass } from '@exyconn/shell/auth/appPass';

/** The client hub pass (email-and-code sign-in), sent as `x-client-pass`. See createAppPass. */
export const clientPass = createAppPass({
  storageKey: 'exyconn.clientHub.pass',
  header: 'x-client-pass',
});
