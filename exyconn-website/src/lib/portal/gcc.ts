import { portalRequest } from "./client";
import type { CaptchaAnswer } from "./submit";

/**
 * The GCC cost calculator's portal operations. Estimates travel as JSON strings; the portal
 * validates them against the shared schema and recomputes every figure itself.
 */

const EMAIL = `
  mutation EmailGccEstimate($input: GccEmailInput!, $captcha: WebsiteCaptchaAnswer!) {
    emailGccEstimate(input: $input, captcha: $captcha) {
      sentTo
    }
  }
`;

const CREATE_SHARE = `
  mutation CreateGccShare($input: GccShareInput!, $captcha: WebsiteCaptchaAnswer!) {
    createGccShare(input: $input, captcha: $captcha) {
      token
      revokeKey
      expiresAt
    }
  }
`;

const SHARED = `
  query SharedGccEstimate($token: String!) {
    sharedGccEstimate(token: $token) {
      estimateJson
      expiresAt
    }
  }
`;

const REVOKE_SHARE = `
  mutation RevokeGccShare($token: String!, $revokeKey: String!) {
    revokeGccShare(token: $token, revokeKey: $revokeKey)
  }
`;

export interface GccEmailRequest {
  to: string;
  estimateJson: string;
  note: string;
}

export interface GccShareRequest {
  estimateJson: string;
  expiresInDays: number;
  consent: boolean;
}

export interface GccShareLink {
  token: string;
  revokeKey: string;
  expiresAt: string;
}

export interface GccSharedEstimate {
  estimateJson: string;
  expiresAt: string;
}

/** Has the portal email the estimate as a PDF; resolves with the address it was sent to. */
export async function emailGccEstimate(
  input: GccEmailRequest,
  captcha: CaptchaAnswer
): Promise<string> {
  const data = await portalRequest<{ emailGccEstimate: { sentTo: string } }>(EMAIL, {
    input,
    captcha,
  });
  return data.emailGccEstimate.sentTo;
}

/** Stores the estimate behind a read-only link; the token and revoke key come back once. */
export async function createGccShare(
  input: GccShareRequest,
  captcha: CaptchaAnswer
): Promise<GccShareLink> {
  const data = await portalRequest<{ createGccShare: GccShareLink }>(CREATE_SHARE, {
    input,
    captcha,
  });
  return data.createGccShare;
}

/** The shared estimate, or null when the link is unknown, expired or revoked. */
export async function getSharedGccEstimate(token: string): Promise<GccSharedEstimate | null> {
  const data = await portalRequest<{ sharedGccEstimate: GccSharedEstimate | null }>(SHARED, {
    token,
  });
  return data.sharedGccEstimate;
}

/** True when the link was live and the key matched. */
export async function revokeGccShare(token: string, revokeKey: string): Promise<boolean> {
  const data = await portalRequest<{ revokeGccShare: boolean }>(REVOKE_SHARE, {
    token,
    revokeKey,
  });
  return data.revokeGccShare;
}
