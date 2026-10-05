import { createAppPass } from '@exyconn/shell/auth/appPass';

/**
 * The demo visitor's pass (email-and-code sign-in), sent as `x-demo-visitor`. The website hands
 * a fresh one over in the address fragment (`#visitor=<pass>`). See createAppPass.
 */
const visitorPass = createAppPass({
  storageKey: 'exyconn.whatsappDemo.visitorPass',
  header: 'x-demo-visitor',
  fragmentKey: 'visitor',
});

export const hasVisitorPass = visitorPass.has;
export const storeVisitorPass = visitorPass.store;
export const clearVisitorPass = visitorPass.clear;
export const installVisitorPass = visitorPass.install;
