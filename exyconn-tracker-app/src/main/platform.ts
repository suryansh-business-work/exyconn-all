/** Thin re-export layer so modules can pull `app`/`hostname` from one place. */
export { app } from 'electron';
export { hostname } from 'node:os';
