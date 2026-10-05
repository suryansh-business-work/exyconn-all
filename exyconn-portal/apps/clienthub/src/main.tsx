import { mountPortalApp } from '@exyconn/shell/app/mount';
import { App } from './App';
import { clientPass } from './auth/clientPass';

// Before the first request: a signed-in contact's pass rides on every call the app makes.
clientPass.install();
mountPortalApp(<App />);
