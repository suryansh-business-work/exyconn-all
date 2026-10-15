import { mountPortalApp } from '@exyconn/shell/app/mount';
import { installVisitorPass } from '@exyconn/demo-visitor';
import { App } from './App';

// Before the first request: a pass handed over in the address (#visitor=) is kept and sent.
installVisitorPass();
mountPortalApp(<App />);
