import { Types } from 'mongoose';
import {
  MaMeetingModel,
  MaSettingsModel,
  type MaMeetingDocument,
} from '../../../../src/modules/meeting-assistant/models';
import { OpenAiConfigModel } from '../../../../src/modules/tech/openai-config.model';
import { wavHeader } from '../../../../src/modules/meeting-assistant/wav';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { UserModel } from '../../../../src/modules/admin/user.model';
import type { MaActor } from '../../../../src/modules/meeting-assistant/ma.access';
import type { Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

export type LeanMeeting = MaMeetingDocument & { _id: unknown };

/** A signed-in extension user with a fresh id. */
export function actorNamed(name: string, email = `${name.toLowerCase()}@exyconn.com`): MaActor {
  return { id: new Types.ObjectId().toHexString(), name, email };
}

/** A canonical 16 kHz mono PCM16 WAV holding `dataBytes` of samples, each byte `fill`. */
export function wavOf(dataBytes: number, fill = 0): Buffer {
  return Buffer.concat([wavHeader(dataBytes), Buffer.alloc(dataBytes, fill)]);
}

/** A meeting row for `owner`, live by default; returned the way the services read it (lean). */
export async function seedMeeting(
  owner: MaActor,
  overrides: Partial<Record<keyof MaMeetingDocument, unknown>> = {},
): Promise<LeanMeeting> {
  const startedAt = (overrides.startedAt as Date | undefined) ?? new Date(Date.now() - 60_000);
  const meetingCode = (overrides.meetingCode as string | undefined) ?? 'abc-defg-hij';
  const created = await MaMeetingModel.create({
    sessionKey: `${owner.id}:${meetingCode}:${startedAt.getTime()}:${new Types.ObjectId().toHexString()}`,
    meetingCode,
    url: `https://meet.google.com/${meetingCode}`,
    title: 'Weekly sync',
    ownerId: owner.id,
    ownerName: owner.name,
    ownerEmail: owner.email,
    viewerIds: [owner.id],
    startedAt,
    lastHeartbeatAt: new Date(),
    ...overrides,
  });
  return created.toObject() as LeanMeeting;
}

/** Changes this company's Meeting Assistant settings (created with defaults if missing). */
export async function setMaSettings(fields: Record<string, unknown>): Promise<void> {
  await MaSettingsModel.updateOne({ key: 'global' }, { $set: fields }, { upsert: true });
}

/** The install's active OpenAI credential, which every AI call reads its key from. */
export function seedOpenAiConfig() {
  return runAsPlatform(() =>
    OpenAiConfigModel.create({
      label: 'Primary',
      apiKey: process.env.TEST_OPENAI_KEY ?? 'test-key',
      defaultModel: 'gpt-4o',
      isActive: true,
    }),
  );
}

/** A portal account (in the company in scope) and the actor it signs in as. */
export async function seedAccount(
  name: string,
  roles: Role[],
  overrides: Record<string, unknown> = {},
): Promise<MaActor> {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase()}@exyconn.com`,
    passwordHash: `hash-${new Types.ObjectId().toHexString()}`,
    roles,
    ...overrides,
  });
  return { id: String(user._id), name: user.name, email: user.email };
}

/** A resolver context for `actor` holding `roles`; `extra` adds token claims (esid…). */
export const ctxOf = (
  actor: MaActor,
  roles: Role[],
  extra: Record<string, unknown> = {},
): GraphQLContext => ({ user: { id: actor.id, roles, email: actor.email, ...extra } });

/** The first page of a grid. */
export const PAGE = { page: 0, pageSize: 20 };
