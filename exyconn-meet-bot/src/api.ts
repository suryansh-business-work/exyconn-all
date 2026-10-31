import { config } from './config';

/** One trip as the portal hands it out (POST /meet-assistant/bot/claim). */
export interface Assignment {
  dispatchId: string;
  meetUrl: string;
  meetingCode: string;
  title: string;
  botName: string;
  consentMessage: string;
  timezone: string;
  maxMeetingMinutes: number;
  saveRecordings: boolean;
  accessToken: string;
  refreshToken: string;
}

export type ReportedStatus = 'WAITING_ADMIT' | 'IN_CALL' | 'DONE' | 'FAILED';

const REST = `${config.apiUrl}/meet-assistant`;
const service = { Authorization: `Bearer ${config.botToken}`, 'Content-Type': 'application/json' };

/** A failed request, with the status so callers can tell retryable from final. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function checked(response: Response, label: string): Promise<Response> {
  if (!response.ok) {
    const body = (await response.text()).slice(0, 300);
    throw new ApiError(response.status, `${label} failed (${response.status}): ${body}`);
  }
  return response;
}

/** The next due trip, or null when there is none. */
export async function claim(): Promise<Assignment | null> {
  const response = await checked(
    await fetch(`${REST}/bot/claim`, { method: 'POST', headers: service }),
    'Claim',
  );
  return response.status === 204 ? null : ((await response.json()) as Assignment);
}

/** Reports progress; the answer says whether the trip was called off. */
export async function report(
  dispatchId: string,
  status: ReportedStatus,
  extra: { meetingId?: string | null; error?: string } = {},
): Promise<{ leave: boolean }> {
  const response = await checked(
    await fetch(`${REST}/bot/${dispatchId}/status`, {
      method: 'POST',
      headers: service,
      body: JSON.stringify({ status, ...extra }),
    }),
    'Status report',
  );
  return (await response.json()) as { leave: boolean };
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

/**
 * The owner's bot session: the same narrow token the extension holds. It lasts 15 minutes, so
 * it is refreshed (and the refresh token rotated) well before that.
 */
export class Session {
  private refreshedAt = Date.now();

  constructor(
    private accessToken: string,
    private refreshToken: string,
  ) {}

  private async token(): Promise<string> {
    if (Date.now() - this.refreshedAt > 10 * 60_000) {
      const response = await checked(
        await fetch(`${REST}/auth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: this.refreshToken }),
        }),
        'Token refresh',
      );
      const tokens = (await response.json()) as TokenResponse;
      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token;
      this.refreshedAt = Date.now();
    }
    return this.accessToken;
  }

  async graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const response = await checked(
      await fetch(`${config.apiUrl}/graphql`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await this.token()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      }),
      'GraphQL',
    );
    const body = (await response.json()) as { data?: T; errors?: { message: string }[] };
    if (body.errors?.length || !body.data) {
      throw new ApiError(400, body.errors?.map((error) => error.message).join('; ') ?? 'No data');
    }
    return body.data;
  }

  async post(
    path: string,
    body: string | Uint8Array<ArrayBuffer>,
    contentType: string,
  ): Promise<void> {
    await checked(
      await fetch(`${REST}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await this.token()}`, 'Content-Type': contentType },
        body,
      }),
      `Upload ${path.split('?')[0]}`,
    );
  }

  /** Signs the bot session out; the trip is over. */
  async revoke(): Promise<void> {
    await fetch(`${REST}/auth/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: this.refreshToken }),
    });
  }
}
