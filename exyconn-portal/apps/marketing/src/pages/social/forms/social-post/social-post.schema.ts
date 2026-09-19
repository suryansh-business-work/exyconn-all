import { z } from 'zod';
import { HTTP_URL } from '@exyconn/regex';
import type { NetworkRule, SocialMediaPostRow, SocialPostFormValues } from './social-post.types';

const MAX_TEXT = 63_206;

/** The post's text as networks count it: with the link appended when the text lacks it. */
export const postLength = (text: string, link: string): number =>
  (link && !text.includes(link) ? `${text}\n\n${link}` : text).length;

/**
 * The composer's rules. The limits are the server's (socialNetworkRules), looked up per chosen
 * account, so a draft Instagram or X would refuse is flagged before it is sent.
 */
export function makeSocialPostSchema(ruleOf: (accountId: string) => NetworkRule | undefined) {
  return z
    .object({
      accountIds: z.array(z.string()),
      text: z.string().max(MAX_TEXT, 'That is longer than any network allows'),
      mediaUrl: z.string(),
      link: z
        .string()
        .trim()
        .refine((v) => v === '' || HTTP_URL.test(v), 'Enter a full link, starting with https://'),
      timing: z.enum(['NOW', 'SCHEDULE', 'DRAFT']),
      scheduledAt: z.string(),
    })
    .superRefine((values, ctx) => {
      if (values.accountIds.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['accountIds'],
          message: 'Choose at least one account',
        });
      }
      if (!values.text.trim() && !values.mediaUrl) {
        ctx.addIssue({
          code: 'custom',
          path: ['text'],
          message: 'Write something, or add an image',
        });
      }
      const length = postLength(values.text, values.link);
      for (const rule of values.accountIds.map(ruleOf)) {
        if (!rule) continue;
        if (rule.requiresImage && !values.mediaUrl) {
          ctx.addIssue({
            code: 'custom',
            path: ['mediaUrl'],
            message: `${rule.network} needs an image`,
          });
        }
        if (!rule.allowsImage && values.mediaUrl) {
          ctx.addIssue({
            code: 'custom',
            path: ['mediaUrl'],
            message: `${rule.network} posts from here cannot carry an image`,
          });
        }
        if (length > rule.maxChars) {
          ctx.addIssue({
            code: 'custom',
            path: ['text'],
            message: `${rule.network} allows ${rule.maxChars} characters; this is ${length}`,
          });
        }
      }
      const at = new Date(values.scheduledAt);
      if (values.timing === 'SCHEDULE' && (!values.scheduledAt || at.getTime() <= Date.now())) {
        ctx.addIssue({
          code: 'custom',
          path: ['scheduledAt'],
          message: 'Pick a time in the future',
        });
      }
    });
}

export type SocialPostValues = z.infer<ReturnType<typeof makeSocialPostSchema>>;

/** A new post goes out now; a stored one stays scheduled, or is a draft. */
function timingOf(post: SocialMediaPostRow | null): SocialPostFormValues['timing'] {
  if (!post) return 'NOW';
  return post.status === 'SCHEDULED' ? 'SCHEDULE' : 'DRAFT';
}

/** Form defaults: empty for a new post, the stored post when editing one. */
export function toFormValues(post: SocialMediaPostRow | null): SocialPostFormValues {
  return {
    accountIds: post ? [post.accountId] : [],
    text: post?.text ?? '',
    mediaUrl: post?.mediaUrl ?? '',
    link: post?.link ?? '',
    timing: timingOf(post),
    scheduledAt: post?.scheduledAt ?? '',
  };
}
