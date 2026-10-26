import { runAsPlatform } from '../../../lib/tenant';
import { badRequest, notFound } from '../../../utils/errors';
import { isWebAddress } from '../../../utils/webAddress';
import { open, seal } from '../../../utils/secretBox';
import { providerGuide } from './provider-guides';
import { ProviderProfileModel } from './provider-profile.model';

export interface ProviderLoginInput {
  label: string;
  username: string;
  signInMethod: string;
  /** Blank on an edit keeps the stored password. */
  password: string;
  notes: string;
}

export interface ProviderLinkInput {
  label: string;
  url: string;
  kind: string;
}

const LIMITS = { label: 120, username: 200, password: 500, notes: 2000, url: 2000 } as const;

/** Shown for a saved password: never any of its characters. */
const SAVED_PASSWORD = '••••••••';

function guideOf(provider: string) {
  return providerGuide(provider) ?? notFound('Provider');
}

function cleanText(value: string, max: number, message: string, required = false): string {
  const text = value.trim();
  if ((required && !text) || text.length > max) {
    badRequest(message);
  }
  return text;
}

/** The provider's stored profile, created empty on first write. */
const profileOf = (provider: string) =>
  runAsPlatform(() =>
    ProviderProfileModel.findOneAndUpdate(
      { provider },
      { $setOnInsert: { provider } },
      { upsert: true, new: true },
    ).select('+logins.password'),
  );

/** The guide merged with what the team stored: built-in links first, then their own. */
async function view(provider: string) {
  const guide = guideOf(provider);
  const stored = await runAsPlatform(() => ProviderProfileModel.findOne({ provider }).lean());
  return {
    provider,
    label: guide.label,
    billing: guide.billing,
    steps: guide.steps,
    links: [
      ...guide.links.map((l, i) => ({ ...l, id: `builtin-${i}`, custom: false })),
      ...(stored?.links ?? []).map((l) => ({ ...l, id: String(l._id), custom: true })),
    ],
    logins: (stored?.logins ?? []).map((l) => ({
      id: String(l._id),
      label: l.label,
      username: l.username,
      signInMethod: l.signInMethod,
      hasPassword: Boolean(l.passwordHint),
      passwordHint: l.passwordHint,
      notes: l.notes,
    })),
  };
}

export const providerProfileService = {
  view,

  async saveLogin(provider: string, id: string | null, input: ProviderLoginInput) {
    guideOf(provider);
    const label = cleanText(
      input.label,
      LIMITS.label,
      'Name the account in under 120 characters.',
      true,
    );
    const username = cleanText(
      input.username,
      LIMITS.username,
      'Keep the email or username under 200 characters.',
    );
    const notes = cleanText(input.notes, LIMITS.notes, 'Keep the notes under 2000 characters.');
    const password = input.password.slice(0, LIMITS.password);
    const profile = await profileOf(provider);
    const existing = id ? profile.logins.id(id) : null;
    if (id && !existing) {
      notFound('Login');
    }
    const fields = { label, username, notes, signInMethod: input.signInMethod };
    const secret = password ? { password: seal(password), passwordHint: SAVED_PASSWORD } : {};
    if (existing) {
      existing.set({ ...fields, ...secret });
    } else {
      profile.logins.push({ ...fields, ...secret });
    }
    await runAsPlatform(() => profile.save());
    return { label, view: await view(provider) };
  },

  async deleteLogin(provider: string, id: string) {
    const profile = await profileOf(provider);
    const login = profile.logins.id(id) ?? notFound('Login');
    const { label } = login;
    login.deleteOne();
    await runAsPlatform(() => profile.save());
    return { label, view: await view(provider) };
  },

  async revealPassword(provider: string, id: string) {
    const profile = await profileOf(provider);
    const login = profile.logins.id(id) ?? notFound('Login');
    if (!login.password) {
      notFound('Password');
    }
    return { label: login.label, value: open(login.password) };
  },

  async saveLink(provider: string, id: string | null, input: ProviderLinkInput) {
    guideOf(provider);
    const label = cleanText(
      input.label,
      LIMITS.label,
      'Name the link in under 120 characters.',
      true,
    );
    const url = cleanText(input.url, LIMITS.url, 'Enter the link’s address.', true);
    if (!isWebAddress(url)) {
      badRequest('Enter a full web address starting with http:// or https://.');
    }
    const profile = await profileOf(provider);
    const existing = id ? profile.links.id(id) : null;
    if (id && !existing) {
      notFound('Link');
    }
    if (existing) {
      existing.set({ label, url, kind: input.kind });
    } else {
      profile.links.push({ label, url, kind: input.kind });
    }
    await runAsPlatform(() => profile.save());
    return { label, view: await view(provider) };
  },

  async deleteLink(provider: string, id: string) {
    const profile = await profileOf(provider);
    const link = profile.links.id(id) ?? notFound('Link');
    const { label } = link;
    link.deleteOne();
    await runAsPlatform(() => profile.save());
    return { label, view: await view(provider) };
  },
};
