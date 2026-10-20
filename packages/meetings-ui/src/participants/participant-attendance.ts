import type { MaParticipantRowFragment } from '@exyconn/shell/graphql/generated';

export type ParticipantRow = MaParticipantRowFragment;

/** When the participant first joined the call, or undefined before any session was seen. */
export function firstJoined(row: ParticipantRow): string | undefined {
  return row.sessions[0]?.joinedAt;
}

/** When they last left, or undefined while they are still in the call. */
export function lastLeft(row: ParticipantRow): string | undefined {
  return row.sessions.at(-1)?.leftAt ?? undefined;
}
