import type { MaSpeakerInput } from '@exyconn/shell/graphql/generated';

/** What the form collects; `userId` is '' when the speaker is not a portal user. */
export interface ConfirmSpeakerValues {
  name: string;
  userId: string;
}

/** The mutation input the values become. */
export type ConfirmSpeakerInput = MaSpeakerInput;
