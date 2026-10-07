import { Types } from 'mongoose';
import { techService } from '../../../../src/modules/tech/tech.service';
import { EmailConfigModel } from '../../../../src/modules/tech/email-config.model';
import { ImageConfigModel } from '../../../../src/modules/tech/image-config.model';
import { SlackConfigModel } from '../../../../src/modules/tech/slack-config.model';
import { GithubConfigModel } from '../../../../src/modules/tech/github-config.model';
import { PexelsConfigModel } from '../../../../src/modules/tech/pexels-config.model';
import { OpenAiConfigModel } from '../../../../src/modules/tech/openai-config.model';
import type {
  EmailConfigInput,
  GithubConfigInput,
  ImageConfigInput,
  OpenAiConfigInput,
  PexelsConfigInput,
  SlackConfigInput,
} from '../../../../src/modules/tech/tech.service';
import { codeOf } from '../codeOf';
import {
  UNKNOWN_ID,
  credential,
  emailInput,
  githubInput,
  imageInput,
  openAiInput,
  pexelsInput,
  slackInput,
} from './tech.fixtures';

type Input = Record<string, unknown>;

/** One platform credential type, driven through the same create/list/update/delete contract. */
interface ConfigCase {
  name: string;
  secretField: string;
  /** How the refusal names the missing credential. */
  secretLabel: string;
  /** How a NOT_FOUND names the resource. */
  missing: string;
  collection: typeof EmailConfigModel.collection;
  input: (overrides?: Input) => Input;
  create: (input: Input) => Promise<{ _id: unknown }>;
  update: (id: string, input: Input) => Promise<unknown>;
  remove: (id: string) => Promise<boolean>;
  list: () => Promise<Array<{ label: string }>>;
}

const cases: ConfigCase[] = [
  {
    name: 'email',
    secretField: 'password',
    secretLabel: 'An SMTP password',
    missing: 'Email config',
    collection: EmailConfigModel.collection,
    input: (o) => ({ ...emailInput(), ...o }),
    create: (i) => techService.createEmailConfig(i as unknown as EmailConfigInput),
    update: (id, i) => techService.updateEmailConfig(id, i as unknown as EmailConfigInput),
    remove: (id) => techService.deleteEmailConfig(id),
    list: () => techService.listEmailConfigs(),
  },
  {
    name: 'image',
    secretField: 'privateKey',
    secretLabel: 'A private key',
    missing: 'Image config',
    collection: ImageConfigModel.collection,
    input: (o) => ({ ...imageInput(), ...o }),
    create: (i) => techService.createImageConfig(i as unknown as ImageConfigInput),
    update: (id, i) => techService.updateImageConfig(id, i as unknown as ImageConfigInput),
    remove: (id) => techService.deleteImageConfig(id),
    list: () => techService.listImageConfigs(),
  },
  {
    name: 'Slack',
    secretField: 'botToken',
    secretLabel: 'A bot token',
    missing: 'Slack config',
    collection: SlackConfigModel.collection,
    input: (o) => ({ ...slackInput(), ...o }),
    create: (i) => techService.createSlackConfig(i as unknown as SlackConfigInput),
    update: (id, i) => techService.updateSlackConfig(id, i as unknown as SlackConfigInput),
    remove: (id) => techService.deleteSlackConfig(id),
    list: () => techService.listSlackConfigs(),
  },
  {
    name: 'GitHub',
    secretField: 'token',
    secretLabel: 'An access token',
    missing: 'GitHub config',
    collection: GithubConfigModel.collection,
    input: (o) => ({ ...githubInput(), ...o }),
    create: (i) => techService.createGithubConfig(i as unknown as GithubConfigInput),
    update: (id, i) => techService.updateGithubConfig(id, i as unknown as GithubConfigInput),
    remove: (id) => techService.deleteGithubConfig(id),
    list: () => techService.listGithubConfigs(),
  },
  {
    name: 'Pexels',
    secretField: 'apiKey',
    secretLabel: 'An API key',
    missing: 'Pexels config',
    collection: PexelsConfigModel.collection,
    input: (o) => ({ ...pexelsInput(), ...o }),
    create: (i) => techService.createPexelsConfig(i as unknown as PexelsConfigInput),
    update: (id, i) => techService.updatePexelsConfig(id, i as unknown as PexelsConfigInput),
    remove: (id) => techService.deletePexelsConfig(id),
    list: () => techService.listPexelsConfigs(),
  },
  {
    name: 'OpenAI',
    secretField: 'apiKey',
    secretLabel: 'An API key',
    missing: 'OpenAI config',
    collection: OpenAiConfigModel.collection,
    input: (o) => ({ ...openAiInput(), ...o }),
    create: (i) => techService.createOpenAiConfig(i as unknown as OpenAiConfigInput),
    update: (id, i) => techService.updateOpenAiConfig(id, i as unknown as OpenAiConfigInput),
    remove: (id) => techService.deleteOpenAiConfig(id),
    list: () => techService.listOpenAiConfigs(),
  },
];

/** The stored row, read past Mongoose so nothing is filtered or cast on the way out. */
const stored = (c: ConfigCase, id: unknown) =>
  c.collection.findOne({ _id: new Types.ObjectId(String(id)) });

const activeLabels = async (c: ConfigCase) =>
  (await c.collection.find({ isActive: true }).toArray()).map((row) => row.label);

describe.each(cases)('the $name config', (c) => {
  it('refuses to be created without its credential, and stores nothing', async () => {
    await expect(c.create(c.input({ [c.secretField]: '   ' }))).rejects.toThrow(
      `${c.secretLabel} is required.`,
    );
    expect(await c.collection.countDocuments()).toBe(0);
  });

  it('keeps one active row: an inactive create leaves the active one alone, an active one replaces it', async () => {
    await c.create(c.input({ label: 'First', isActive: true }));
    await c.create(c.input({ label: 'Second' }));
    expect(await activeLabels(c)).toEqual(['First']);

    await c.create(c.input({ label: 'Third', isActive: true }));
    expect(await activeLabels(c)).toEqual(['Third']);
  });

  it('lists the newest first, by when each was created', async () => {
    const older = await c.create(c.input({ label: 'Older' }));
    const newer = await c.create(c.input({ label: 'Newer' }));
    await c.collection.updateOne(
      { _id: new Types.ObjectId(String(older._id)) },
      { $set: { createdAt: new Date('2025-01-01T00:00:00Z') } },
    );
    await c.collection.updateOne(
      { _id: new Types.ObjectId(String(newer._id)) },
      { $set: { createdAt: new Date('2026-01-01T00:00:00Z') } },
    );

    expect((await c.list()).map((row) => row.label)).toEqual(['Newer', 'Older']);
  });

  it('keeps the stored credential when an edit sends a blank one, and replaces it with a new one', async () => {
    const original = c.input();
    const row = await c.create(original);

    await c.update(String(row._id), c.input({ label: 'Renamed', [c.secretField]: '' }));
    const kept = await stored(c, row._id);
    expect(kept?.label).toBe('Renamed');
    expect(kept?.[c.secretField]).toBe(original[c.secretField]);

    const rotated = credential('rotated');
    await c.update(String(row._id), c.input({ [c.secretField]: rotated }));
    expect((await stored(c, row._id))?.[c.secretField]).toBe(rotated);
  });

  it('deactivates the others, not itself, when an edit makes one active', async () => {
    await c.create(c.input({ label: 'Was active', isActive: true }));
    const other = await c.create(c.input({ label: 'Now active' }));

    const updated = await c.update(
      String(other._id),
      c.input({ label: 'Now active', isActive: true }),
    );

    expect(updated).toMatchObject({ label: 'Now active', isActive: true });
    expect(await activeLabels(c)).toEqual(['Now active']);
  });

  it('deletes a row and says so', async () => {
    const row = await c.create(c.input());

    await expect(c.remove(String(row._id))).resolves.toBe(true);
    expect(await c.collection.countDocuments()).toBe(0);
  });

  it('answers NOT_FOUND for an edit or delete of a row that is not there', async () => {
    expect(await codeOf(c.update(UNKNOWN_ID, c.input()))).toBe('NOT_FOUND');
    await expect(c.remove(UNKNOWN_ID)).rejects.toThrow(`${c.missing} not found`);
  });
});
