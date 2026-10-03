import type { NameserverTarget } from '@exyconn/shell/graphql/generated';

/** The custom nameserver form: one host name per line. */
export interface NameserversFormValues {
  nameServers: string;
}

/** Where the switch points a domain; CUSTOM takes the hosts typed in this form. */
export type { NameserverTarget };
