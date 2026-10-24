import { describe, expect, it } from 'vitest';
import type { z } from 'zod';

/** What makes one OAuth client schema (Gmail, Google sign-in, Microsoft Mail) different. */
export interface OAuthClientSchemaSpec {
  name: string;
  make: (hasSecret: boolean) => z.ZodType;
  clientId: string;
  /** Extra fields the schema expects. */
  extra: Record<string, unknown>;
  missingClientId: string;
  missingSecret: string;
}

/** The rules every OAuth client schema shares: switching it on needs both halves of the client. */
export function describeOAuthClientSchema(spec: Readonly<OAuthClientSchemaSpec>) {
  const values = (overrides: Record<string, unknown>) => ({
    clientId: spec.clientId,
    clientSecret: '',
    enabled: true,
    ...spec.extra,
    ...overrides,
  });
  const messages = (hasSecret: boolean, overrides: Record<string, unknown>) =>
    spec
      .make(hasSecret)
      .safeParse(values(overrides))
      .error?.issues.map((issue) => issue.message) ?? [];

  describe(spec.name, () => {
    it('switches on with a typed secret when none is stored', () => {
      expect(messages(false, { clientSecret: 'typed-secret' })).toEqual([]);
    });

    it('switches on with a stored secret and the field left blank', () => {
      expect(messages(true, {})).toEqual([]);
    });

    it('will not switch on without any secret', () => {
      expect(messages(false, {})).toEqual([spec.missingSecret]);
    });

    it('will not switch on without a client ID', () => {
      expect(messages(true, { clientId: '' })).toEqual([spec.missingClientId]);
    });

    it('may be saved switched off with nothing filled in', () => {
      expect(messages(false, { clientId: '', enabled: false })).toEqual([]);
    });
  });
}
