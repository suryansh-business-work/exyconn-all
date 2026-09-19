import type { SocialApp } from './social.constants';
import { SocialProviderError } from './social.http';
import { PROVIDERS } from './social.providers';
import { appConfigs, callbackUrl } from './social.service';

/** What a provider says when the client ID or secret is wrong — as opposed to the code. */
const BAD_CREDENTIALS =
  /invalid_client|unauthorized_client|client secret|client id|validating application|client authentication|oauth client was not found/i;

/** A code no provider ever issued, and a verifier of the length PKCE demands. */
const PROBE_CODE = 'exyconn-connection-test';
const PROBE_VERIFIER = 'x'.repeat(43);

export interface AppTest {
  ok: boolean;
  message: string;
}

/**
 * Checks an app's credentials without anyone signing in: it exchanges a code the provider never
 * issued. A provider refuses that either way, but says why — a wrong client ID or secret is
 * "invalid client", right credentials with a made-up code are "invalid code" — so the refusal
 * itself is the answer.
 */
export async function testAppConnection(app: SocialApp): Promise<AppTest> {
  const config = (await appConfigs()).find((row) => row.app === app);
  const label = PROVIDERS[app].label;
  if (!config?.clientId || !config.clientSecret) {
    return { ok: false, message: `Add the ${label} client ID and secret first.` };
  }
  try {
    await PROVIDERS[app].exchange(config, PROBE_CODE, callbackUrl(app), PROBE_VERIFIER);
    return { ok: true, message: `${label} accepted the app's credentials.` };
  } catch (error) {
    if (!(error instanceof SocialProviderError)) {
      return {
        ok: false,
        message: `${label} could not be reached: ${String((error as Error).message)}`,
      };
    }
    if (BAD_CREDENTIALS.test(error.message)) {
      return { ok: false, message: `${label} rejected the client ID or secret. ${error.message}` };
    }
    return { ok: true, message: `${label} recognised the app's client ID and secret.` };
  }
}
