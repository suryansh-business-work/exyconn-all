import { logger } from '../../../src/utils/logger';
import {
  GithubConfigModel,
  type GithubConfigDocument,
} from '../../../src/modules/tech/github-config.model';
import { asArg } from '../../mockAs';

/** Shared doubles for the GitHub Actions suites. */
export const config = {
  label: 'Releases',
  owner: 'acme',
  repo: 'portal',
  token: `ghp-${Date.now()}`,
  isActive: true,
} as GithubConfigDocument;

export const REPO = 'https://api.github.com/repos/acme/portal';
export const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

/** One release as the GitHub API lists it. */
export const release = (tag: string, names: string[], draft = false) => ({
  tag_name: tag,
  name: tag,
  body: '',
  html_url: `https://github.test/${tag}`,
  draft,
  prerelease: false,
  published_at: '2026-10-01T00:00:00Z',
  created_at: '2026-10-01T00:00:00Z',
  assets: names.map((name) => ({
    name,
    size: 1,
    download_count: 0,
    browser_download_url: `https://dl.test/${tag}/${name}`,
  })),
});

/** Makes `value` the active GitHub configuration. */
export function active(value: GithubConfigDocument | null) {
  return jest
    .spyOn(GithubConfigModel, 'findOne')
    .mockReturnValue(asArg({ lean: jest.fn().mockResolvedValue(value) }));
}

/** Spies on fetch and quiets the info log; returns the fetch spy. */
export function stubGithub(): jest.SpyInstance {
  jest.spyOn(logger, 'info').mockImplementation(() => undefined);
  return jest.spyOn(globalThis, 'fetch');
}
