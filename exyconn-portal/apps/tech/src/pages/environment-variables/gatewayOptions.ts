import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import { GatewayMode } from '@exyconn/shell/graphql/generated';

/** The yes/no choice behind "Set as active" on the gateway forms. */
export const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

/** Which of the gateway's environments an account talks to. */
export const MODE_OPTIONS: SelectOption[] = [
  { value: GatewayMode.Sandbox, label: 'Sandbox (test payments)' },
  { value: GatewayMode.Live, label: 'Live (real money)' },
];
