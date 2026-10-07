import { describe, expect, it } from 'vitest';
import { GatewayMode } from '@exyconn/shell/graphql/generated';
import {
  BOOL_OPTIONS,
  MODE_OPTIONS,
} from '../../../../src/pages/environment-variables/gatewayOptions';

describe('gateway options', () => {
  it('offers yes and no as the strings a select submits', () => {
    expect(BOOL_OPTIONS).toEqual([
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ]);
  });

  it('offers sandbox before live, saying which one moves real money', () => {
    expect(MODE_OPTIONS.map((option) => option.value)).toEqual([
      GatewayMode.Sandbox,
      GatewayMode.Live,
    ]);
    expect(MODE_OPTIONS[1]?.label).toBe('Live (real money)');
    expect(MODE_OPTIONS[0]?.label).toBe('Sandbox (test payments)');
  });
});
