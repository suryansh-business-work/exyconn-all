import { MeDocument, Role } from '@/graphql/generated';
import type { ProfileMe } from '@/pages/Profile/forms/profile';
import { answer } from '../../mockResult';

/** The signed-in person as the Me query returns them; override what a test cares about. */
export function me(patch: Partial<ProfileMe> = {}): ProfileMe {
  return {
    __typename: 'User',
    id: 'user-1',
    name: 'Asha Rao',
    email: 'asha@example.com',
    roles: [Role.Employee],
    avatarUrl: null,
    timezone: 'Asia/Kolkata',
    locale: 'en-IN',
    organizationId: 'org-1',
    department: 'Engineering',
    designation: 'Staff Engineer',
    brief: 'Builds the payroll engine.',
    phone: '+91 98765 43210',
    socialLinks: {
      __typename: 'UserSocialLinks',
      linkedin: 'https://www.linkedin.com/in/asha',
      github: null,
      twitter: null,
      website: null,
    },
    lastActiveAt: null,
    isOnline: true,
    ...patch,
  };
}

/** Answers to Me, enough for the AuthProvider's revalidation and the page's own read. */
export function meAnswer(patch: Partial<ProfileMe> = {}, uses = 3) {
  return answer(MeDocument, { me: me(patch) }, undefined, uses);
}
