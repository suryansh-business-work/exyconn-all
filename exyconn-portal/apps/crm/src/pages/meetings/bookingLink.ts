import { appBaseUrl } from '@exyconn/shell/config/apps';

/**
 * A public booking address in full — domain, company and path
 * (https://crm.exyconn.com/organization/<company>/book/<page>/<link>) — to paste anywhere.
 */
export const bookingLink = (path: string) => `${appBaseUrl('crm')}${path}`;
