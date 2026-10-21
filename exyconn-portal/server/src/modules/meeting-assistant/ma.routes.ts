import express, { Router, type Request, type Response } from 'express';
import { env } from '../../config/env';
import { runForOrganization, runForOrganizationOf } from '../../lib/tenant';
import { createLimiter } from '../../lib/rateLimiter';
import { verifyToken } from '../../utils/jwt';
import { logger } from '../../utils/logger';
import { UserModel } from '../admin/user.model';
import type { GraphQLContext } from '../../middleware/auth';
import { assertMaUser, ownedMeeting, type MaActor } from './ma.access';
import {
  exchangeCode,
  extensionSessionIsLive,
  refreshSession,
  revokeByRefreshToken,
  TokenRefusal,
} from './extension.auth';
import { AudioRejection, transcribeChunk } from './transcription.service';
import { readDownloadToken, MA_DOWNLOAD_PATH } from './download-links';
import { openReleaseArtifact } from './releases.service';
import { streamReleaseZip } from './releases.store';
import { addReleaseUploadRoute } from './releases.upload';
import { streamMergedWav } from './recording.store';
import { MaMeetingModel } from './models';

export const MA_REST_PATH = '/meet-assistant';
const STREAMS: ReadonlySet<string> = new Set(['TAB', 'MIC']);
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

const audioLimiter = createLimiter({ keyPrefix: 'ma-audio', points: 40, durationSec: 60 });
const tokenLimiter = createLimiter({ keyPrefix: 'ma-token', points: 30, durationSec: 60 });

const text = (value: unknown, max = 2000) => (typeof value === 'string' ? value.slice(0, max) : '');
const int = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : -1;

/** OAuth's token endpoint shape: 200 with tokens, or 400/401 with { error, error_description }. */
async function tokenEndpoint(req: Request, res: Response): Promise<void> {
  res.set('Cache-Control', 'no-store');
  if (!(await tokenLimiter.allow(req.ip ?? 'unknown'))) {
    res.status(429).json({ error: 'slow_down', error_description: 'Too many sign-in attempts.' });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  try {
    if (body.grant_type === 'authorization_code') {
      const tokens = await exchangeCode(
        {
          code: text(body.code, 200),
          codeVerifier: text(body.code_verifier, 200),
          redirectUri: text(body.redirect_uri, 500),
          extensionId: text(body.extension_id, 64),
        },
        {
          deviceLabel: text(body.device_label, 200),
          extensionVersion: text(body.extension_version, 40),
          userAgent: text(req.headers['user-agent'], 500),
        },
      );
      res.json(tokens);
      return;
    }
    if (body.grant_type === 'refresh_token') {
      res.json(
        await refreshSession(text(body.refresh_token, 200), text(body.extension_version, 40)),
      );
      return;
    }
    throw new TokenRefusal('unsupported_grant_type', 'Unsupported grant type.');
  } catch (error) {
    if (error instanceof TokenRefusal) {
      res
        .status(error.code === 'invalid_grant' ? 401 : 400)
        .json({ error: error.code, error_description: error.message });
      return;
    }
    logger.error({ err: error }, 'Meeting extension token request failed');
    res
      .status(500)
      .json({ error: 'server_error', error_description: 'Sign-in failed. Try again.' });
  }
}

/** The extension user behind a Bearer token, inside their company, or null. */
async function extensionCaller(
  req: Request,
): Promise<{ ctx: GraphQLContext; organizationId: string } | null> {
  const header = req.headers.authorization ?? '';
  const decoded = header.startsWith('Bearer ') ? verifyToken(header.slice(7)) : null;
  if (!decoded?.esid || !decoded.organizationId) {
    return null;
  }
  if (!(await extensionSessionIsLive(decoded.esid, decoded.id))) {
    return null;
  }
  const user = await runForOrganization(decoded.organizationId, () =>
    UserModel.findById(decoded.id).select('isActive isBlocked tokenVersion').lean(),
  );
  if (!user?.isActive || user.isBlocked || (decoded.tv ?? 0) !== (user.tokenVersion ?? 0)) {
    return null;
  }
  return {
    ctx: { user: decoded, organizationId: decoded.organizationId, ip: req.ip },
    organizationId: decoded.organizationId,
  };
}

interface AudioBody {
  meetingId: string;
  stream: 'TAB' | 'MIC';
  seq: number;
  startMs: number;
  durationMs: number;
  audio: Buffer;
}

/** The upload's fields, checked; null when anything is missing or malformed. */
function audioBody(raw: unknown): AudioBody | null {
  const body = (raw ?? {}) as Record<string, unknown>;
  const stream = text(body.stream, 3);
  const audio = Buffer.from(text(body.audio, 12 * 1024 * 1024), 'base64');
  const fields = {
    seq: int(body.seq),
    startMs: int(body.startMs),
    durationMs: int(body.durationMs),
  };
  const meetingId = text(body.meetingId, 24);
  if (
    !/^[\da-f]{24}$/.test(meetingId) ||
    !STREAMS.has(stream) ||
    Object.values(fields).includes(-1) ||
    audio.length === 0
  ) {
    return null;
  }
  return { meetingId, stream: stream as 'TAB' | 'MIC', ...fields, audio };
}

async function transcribeFor(actor: MaActor, body: AudioBody) {
  const meeting = await ownedMeeting(actor, body.meetingId);
  return transcribeChunk(meeting, actor, { ...body });
}

/** One audio chunk from the extension: a base64 16 kHz PCM WAV in a JSON body. */
async function audioEndpoint(req: Request, res: Response): Promise<void> {
  const caller = await extensionCaller(req);
  if (!caller) {
    res.status(401).json({ error: 'unauthenticated' });
    return;
  }
  const body = audioBody(req.body);
  if (!body) {
    res.status(400).json({ error: 'invalid_request' });
    return;
  }
  if (body.audio.length > MAX_AUDIO_BYTES) {
    res.status(413).json({ error: 'too_large' });
    return;
  }
  if (!(await audioLimiter.allow(caller.ctx.user?.id ?? 'unknown'))) {
    res.status(429).json({ error: 'rate_limited', retryAfterMs: 5_000 });
    return;
  }
  try {
    const result = await runForOrganization(caller.organizationId, async () =>
      transcribeFor(await assertMaUser(caller.ctx), body),
    );
    res.json(result);
  } catch (error) {
    if (error instanceof AudioRejection) {
      res.status(error.status).json({ error: error.code, retryAfterMs: error.retryAfterMs });
      return;
    }
    const status =
      (error as { extensions?: { code?: string } }).extensions?.code === 'NOT_FOUND' ? 404 : 403;
    res.status(status).json({ error: status === 404 ? 'not_found' : 'disabled' });
  }
}

async function sendRelease(id: string, res: Response): Promise<void> {
  const release = await openReleaseArtifact(id);
  res.set({
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="${release.artifactName.replaceAll('"', '')}"`,
    'X-Checksum-SHA256': release.sha256,
  });
  await streamReleaseZip(release.fileId, res);
}

async function sendRecording(id: string, stream: string, res: Response): Promise<void> {
  const meeting = await MaMeetingModel.findById(id).select('title').lean();
  if (!meeting || !STREAMS.has(stream)) {
    res.status(404).send('Not found');
    return;
  }
  res.set({
    'Content-Type': 'audio/wav',
    'Content-Disposition': `attachment; filename="meeting-${id}-${stream.toLowerCase()}.wav"`,
  });
  if (!(await streamMergedWav(id, stream, res))) {
    res.status(404).send('No recording saved');
  }
}

/** A signed, expiring download: a release ZIP or a meeting recording. No session needed. */
async function downloadEndpoint(req: Request, res: Response): Promise<void> {
  const grant = readDownloadToken(text(req.query.token, 2000));
  if (!grant) {
    res.status(403).send('This download link has expired. Go back and download again.');
    return;
  }
  res.set('Cache-Control', 'private, no-store');
  try {
    if (grant.kind === 'release') {
      await sendRelease(grant.id, res);
    } else {
      await runForOrganizationOf(grant.organizationId, () =>
        sendRecording(grant.id, grant.stream ?? '', res),
      );
    }
  } catch (error) {
    logger.error({ err: error, kind: grant.kind }, 'Meeting assistant download failed');
    if (!res.headersSent) {
      res.status(502).send('The download could not be started. Try again.');
    }
  }
}

/** The extension's REST endpoints, CI's build upload and the assistant's signed downloads. */
export function meetAssistantRouter(): Router {
  const router = Router();
  const small = express.json({ limit: '16kb' });
  router.post('/auth/token', small, (req, res) => {
    tokenEndpoint(req, res).catch((error: unknown) =>
      logger.error({ err: error }, 'token endpoint'),
    );
  });
  router.post('/auth/revoke', small, (req, res) => {
    revokeByRefreshToken(
      text((req.body as Record<string, unknown> | undefined)?.refresh_token, 200),
    )
      .then(() => res.status(204).end())
      .catch((error: unknown) => {
        logger.error({ err: error }, 'Meeting extension revoke failed');
        res.status(204).end();
      });
  });
  router.post('/audio', express.json({ limit: env.meetAssistant.audioBodyLimit }), (req, res) => {
    audioEndpoint(req, res).catch((error: unknown) => {
      logger.error({ err: error }, 'Meeting audio upload failed');
      if (!res.headersSent) {
        res.status(500).json({ error: 'server_error' });
      }
    });
  });
  addReleaseUploadRoute(router);
  router.get(MA_DOWNLOAD_PATH.replace(MA_REST_PATH, ''), (req, res) => {
    downloadEndpoint(req, res).catch((error: unknown) => logger.error({ err: error }, 'download'));
  });
  return router;
}
