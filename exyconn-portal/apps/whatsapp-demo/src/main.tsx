import { mountPortalApp } from '@exyconn/shell/app/mount';
import { App } from './App';
import { installVisitorPass } from './visitor/visitorPass';

// Before the first request: a demo visitor's pass rides on every call the app makes.
installVisitorPass();
mountPortalApp(<App />);
