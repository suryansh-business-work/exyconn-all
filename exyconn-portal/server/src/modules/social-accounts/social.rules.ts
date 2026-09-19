import type { SocialNetwork } from './social.constants';

/** What a network accepts from the composer. Configuration, not data. */
export interface NetworkRule {
  network: SocialNetwork;
  /** Whether posts can be published to it at all. */
  canPublish: boolean;
  /** Longest text, link included. */
  maxChars: number;
  /** Instagram publishes images only. */
  requiresImage: boolean;
  /** Whether an image can be attached. */
  allowsImage: boolean;
  /** Said beside the network in the composer. */
  note: string;
}

export const NETWORK_RULES: Readonly<Record<SocialNetwork, NetworkRule>> = {
  FACEBOOK: {
    network: 'FACEBOOK',
    canPublish: true,
    maxChars: 63_206,
    requiresImage: false,
    allowsImage: true,
    note: 'Text, a link or a photo.',
  },
  INSTAGRAM: {
    network: 'INSTAGRAM',
    canPublish: true,
    maxChars: 2_200,
    requiresImage: true,
    allowsImage: true,
    note: 'Needs an image — Instagram has no text-only posts.',
  },
  LINKEDIN: {
    network: 'LINKEDIN',
    canPublish: true,
    maxChars: 3_000,
    requiresImage: false,
    allowsImage: false,
    note: 'Text, with a link shared as an article.',
  },
  X: {
    network: 'X',
    canPublish: true,
    maxChars: 280,
    requiresImage: false,
    allowsImage: false,
    note: 'Text up to 280 characters, link included.',
  },
  YOUTUBE: {
    network: 'YOUTUBE',
    canPublish: false,
    maxChars: 0,
    requiresImage: false,
    allowsImage: false,
    note: 'Analytics only — a YouTube post is a video upload.',
  },
};

export interface Draft {
  text: string;
  mediaUrl: string;
  link: string;
}

/** Why this network would refuse the draft, or null when it would take it. */
export function ruleProblem(network: SocialNetwork, draft: Draft): string | null {
  const rule = NETWORK_RULES[network];
  const length = (
    draft.link && !draft.text.includes(draft.link) ? `${draft.text}\n\n${draft.link}` : draft.text
  ).length;
  if (!rule.canPublish) return `${network} does not take posts from here.`;
  if (rule.requiresImage && !draft.mediaUrl) return `${network} needs an image.`;
  if (!rule.allowsImage && draft.mediaUrl)
    return `${network} posts from here cannot carry an image.`;
  if (length > rule.maxChars)
    return `${network} allows ${rule.maxChars} characters; this is ${length}.`;
  if (!draft.text.trim() && !draft.mediaUrl) return 'Write something, or add an image.';
  return null;
}
