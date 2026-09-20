import { createHash, randomBytes } from 'node:crypto';
import { ContractSignatureModel } from './signature.model';
import { ContractModel } from './legal.model';
import { emailer } from '../email';
import { safeFetch } from '../../utils/safeFetch';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { badRequest, notFound } from '../../utils/errors';
import { runAsPlatform } from '../../lib/tenant';
import { withId } from '../../utils/serialize';

/**
 * How long a signature link works.
 *
 * Long enough for a counterparty's legal team to read a contract, short enough that a link
 * forwarded on and forgotten stops being a way to sign in our name months later.
 */
const LINK_TTL_DAYS = 30;
const DAY_MS = 86_400_000;

/** The document is fetched to be hashed, so a runaway file must not hold the request open. */
const FETCH_TIMEOUT_MS = 20_000;
const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

/**
 * Where the counterparty signs.
 *
 * The status site, which is the one app with no sign-in — the same place a client reads a
 * shared project, so it shares that base URL rather than introducing a second name for the
 * same host.
 */
export const signingUrl = (token: string): string =>
  `${env.projectShareBaseUrl}/sign/${encodeURIComponent(token)}`;

/**
 * Asks a counterparty to sign, by emailing them a link nobody else has.
 *
 * The token is returned to the caller as well as emailed: Legal often has to pass a link on
 * by another route, and a link that only exists in somebody's inbox is a link that cannot be
 * re-sent.
 */
export async function requestContractSignature(input: {
  contractId: string;
  signerName: string;
  signerEmail: string;
  requestedByName: string;
  message?: string | null;
}) {
  const contract = await ContractModel.findById(input.contractId);
  if (!contract) {
    notFound('Contract');
  }
  if (!contract.documentUrl) {
    badRequest(
      'Attach the document to the contract first. A signature has to be of something a ' +
        'counterparty can read.',
    );
  }
  const token = randomBytes(32).toString('base64url');
  const request = await ContractSignatureModel.create({
    contractId: String(contract._id),
    tokenHash: hashToken(token),
    signerName: input.signerName.trim(),
    signerEmail: input.signerEmail.trim().toLowerCase(),
    requestedByName: input.requestedByName,
    expiresAt: new Date(Date.now() + LINK_TTL_DAYS * DAY_MS),
  });

  await emailer.send({
    template: 'contract-for-signature',
    to: request.signerEmail,
    variables: {
      party: contract.party,
      contractTitle: contract.title,
      message:
        input.message ??
        `Please read and sign "${contract.title}". The link below is yours alone and works for ${LINK_TTL_DAYS} days.`,
      signingUrl: signingUrl(token),
    },
    triggeredBy: input.requestedByName,
  });

  contract.sentAt = new Date();
  await contract.save();
  return { id: String(request._id), token, url: signingUrl(token) };
}

/** A live request, or null. Read as the platform: a signer has no company scope. */
async function liveRequest(token: string) {
  const request = await runAsPlatform(() =>
    ContractSignatureModel.findOne({ tokenHash: hashToken(token) }),
  );
  if (!request || request.revokedAt || request.expiresAt < new Date()) {
    return null;
  }
  return request;
}

/** What the counterparty is shown: the document, and who is asking. Nothing else. */
export async function contractToSign(token: string) {
  const request = await liveRequest(token);
  if (!request) {
    return null;
  }
  const contract = await runAsPlatform(() =>
    ContractModel.findById(request.contractId)
      .select('title party type effectiveDate expiryDate documentUrl')
      .lean(),
  );
  if (!contract) {
    return null;
  }
  return {
    title: contract.title,
    party: contract.party,
    type: contract.type,
    effectiveDate: contract.effectiveDate,
    expiryDate: contract.expiryDate,
    documentUrl: contract.documentUrl,
    signerName: request.signerName,
    signedAt: request.signedAt,
  };
}

/**
 * The hash of what the signer was shown.
 *
 * Fetched and hashed here rather than trusted from anywhere: the point of the hash is that
 * it was computed from the bytes at the moment somebody agreed to them. A document that
 * cannot be read is a refusal, not an empty hash — a signature with no hash would look
 * exactly like one whose document had been swapped.
 */
async function hashDocument(url: string): Promise<string> {
  // safeFetch caps the body itself and reads it within that cap, so an oversized document
  // is an error here rather than a buffer this process has already allocated.
  const response = await safeFetch(
    url,
    {},
    { timeoutMs: FETCH_TIMEOUT_MS, maxBytes: MAX_DOCUMENT_BYTES },
  );
  if (!response.ok) {
    badRequest('The document could not be read just now. Try again in a moment.');
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Records a signature: the name typed, where from, and the hash of the document signed.
 *
 * Written once. A request that has been used is finished — re-signing would leave two
 * answers about one agreement and no way to say which stood.
 */
export async function signContractWithToken(input: {
  token: string;
  signedName: string;
  ip: string;
  userAgent: string;
}) {
  const request = await liveRequest(input.token);
  if (!request) {
    badRequest('That signing link is no longer valid. Ask for a new one.');
  }
  if (request.signedAt) {
    badRequest('This contract has already been signed.');
  }
  const typed = input.signedName.trim();
  if (typed.length < 2) {
    badRequest('Type your full name to sign.');
  }

  const contract = await runAsPlatform(() => ContractModel.findById(request.contractId));
  if (!contract) {
    notFound('Contract');
  }

  const documentSha256 = await hashDocument(contract.documentUrl);
  request.set({
    signedAt: new Date(),
    signedName: typed,
    signedIp: input.ip,
    signedUserAgent: input.userAgent.slice(0, 200),
    documentSha256,
    documentUrl: contract.documentUrl,
  });
  await request.save();

  // The contract itself carries the headline, so the register reads without a join.
  contract.signedBy = typed;
  contract.signedAt = request.signedAt;
  contract.status = 'ACTIVE';
  await contract.save();

  logger.info(`Contract ${contract.title} signed by ${request.signerEmail}`);
  return { signedAt: request.signedAt, documentSha256 };
}

/**
 * Our own side of a contract, signed by the account asking for it.
 *
 * The same evidence as a counterparty's signature, minus the link: there is no token because
 * the signer is already identified by their session, and the row records which account it
 * was rather than a name somebody chose to type.
 */
export async function signContractInternally(input: {
  contractId: string;
  signerEmail: string;
  ip: string;
  userAgent: string;
}) {
  const contract = await ContractModel.findById(input.contractId);
  if (!contract) {
    notFound('Contract');
  }
  if (!contract.documentUrl) {
    badRequest('Attach the document first. A signature has to be of something.');
  }
  const documentSha256 = await hashDocument(contract.documentUrl);
  const signedAt = new Date();

  await ContractSignatureModel.create({
    contractId: String(contract._id),
    // No link was issued, so there is no token to hash; the row still needs a unique value,
    // and the hash of "internal" plus the moment is one nobody can present as a link.
    tokenHash: createHash('sha256')
      .update(`internal:${String(contract._id)}:${signedAt.toISOString()}`)
      .digest('hex'),
    signerName: input.signerEmail,
    signerEmail: input.signerEmail,
    requestedByName: input.signerEmail,
    expiresAt: signedAt,
    signedAt,
    signedName: input.signerEmail,
    signedIp: input.ip,
    signedUserAgent: input.userAgent.slice(0, 200),
    documentSha256,
    documentUrl: contract.documentUrl,
  });

  contract.signedBy = input.signerEmail;
  contract.signedAt = signedAt;
  contract.status = 'ACTIVE';
  await contract.save();
  return withId(contract.toObject() as { _id: unknown });
}

/** Every request on one contract, with its evidence, for the Legal screen. */
export async function contractSignatures(contractId: string) {
  const rows = await ContractSignatureModel.find({ contractId }).sort({ createdAt: -1 }).lean();
  return rows.map((row) => ({
    id: String(row._id),
    signerName: row.signerName,
    signerEmail: row.signerEmail,
    requestedByName: row.requestedByName,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
    signedAt: row.signedAt,
    signedName: row.signedName,
    signedIp: row.signedIp,
    signedUserAgent: row.signedUserAgent,
    documentSha256: row.documentSha256,
    createdAt: row.createdAt,
  }));
}

/** Withdraws an unsigned request. A signed one is evidence and cannot be withdrawn. */
export async function revokeContractSignature(id: string) {
  const request = await ContractSignatureModel.findById(id);
  if (!request) {
    notFound('Signature request');
  }
  if (request.signedAt) {
    badRequest('That contract has already been signed, so the request cannot be withdrawn.');
  }
  request.revokedAt = new Date();
  await request.save();
  return true;
}
