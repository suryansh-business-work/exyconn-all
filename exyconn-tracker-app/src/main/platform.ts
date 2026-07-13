import { app } from 'electron';
import { hostname } from 'node:os';

/** Thin re-export layer so modules can pull `app`/`hostname` from one place. */
export { app, hostname };
