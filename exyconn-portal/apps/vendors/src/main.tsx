import { mountPortalApp } from '@exyconn/shell/app/mount';
import { App } from './App';
import { withoutPortalSession } from '@exyconn/shell/config/apolloClient';
import { vendorPass } from './auth/vendorPass';

// Before the first request: a signed-in contact's pass rides on every call the app makes, and
// an employee's portal session (shared cookie) is never sent from here nor cleared by it.
withoutPortalSession();
vendorPass.install();
mountPortalApp(<App />);
