import type { z } from 'zod';
import type { MeQuery, UpdateProfileInput } from '@/graphql/generated';
import type { profileSchema } from './profile.schema';

/**
 * What the form edits. Every field is a string: '' clears a bio, a phone or a link, and a
 * '' timezone or language follows the workspace default. Checked against the generated
 * input below, so the form cannot drift from what the API accepts.
 */
export type ProfileFormValues = z.infer<typeof profileSchema>;

/** The signed-in person as the Me query returns them. */
export type ProfileMe = MeQuery['me'];

type AssertAssignable<T extends UpdateProfileInput> = T;
export type ProfileInput = AssertAssignable<ProfileFormValues>;
