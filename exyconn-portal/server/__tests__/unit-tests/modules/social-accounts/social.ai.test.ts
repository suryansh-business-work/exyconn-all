import { analysePosts, postIdeas } from '../../../../src/modules/social-accounts/social.ai';
import { SocialMediaPostModel } from '../../../../src/modules/social-accounts/social-post.model';
import { useTestOrganization } from '../../../helpers';

jest.mock('../../../../src/modules/ai/ai.actions', () => ({
  ...jest.requireActual('../../../../src/modules/ai/ai.actions'),
  runAssist: jest.fn(async (name: string) => `${name}: done`),
}));
import { runAssist } from '../../../../src/modules/ai/ai.actions';

useTestOrganization();

const ACTOR = { id: 'u1', name: 'm@exyconn.com' };
const promptOf = () => (runAssist as jest.Mock).mock.calls[0][1] as string;

afterEach(() => jest.restoreAllMocks());

describe('analysing posts', () => {
  it('shortens a long post, flattens its lines, and marks what the network did not say', async () => {
    jest.spyOn(SocialMediaPostModel, 'aggregate').mockResolvedValueOnce([
      {
        network: 'X',
        publishedAt: null,
        text: `Line one\nLine two ${'y'.repeat(300)}`,
        metrics: null,
      },
      {
        network: 'FACEBOOK',
        publishedAt: new Date('2026-09-18T09:30:00Z'),
        text: 'Short',
        metrics: { likes: 3 },
      },
    ] as never);

    expect(await analysePosts(30, ACTOR)).toBe('Analyse social posts: done');

    const lines = promptOf().split('\n');
    const first = lines.find((line) => line.startsWith('- [X,')) ?? '';
    expect(first).toMatch(
      /^- \[X, unknown UTC\] likes 0, comments 0, shares 0, views 0: "Line one Line two y+…"$/,
    );
    expect(first.length).toBeLessThan(330);
    expect(lines).toContain(
      '- [FACEBOOK, 2026-09-18 09:30 UTC] likes 3, comments 0, shares 0, views 0: "Short"',
    );
    expect(runAssist).toHaveBeenCalledWith('Analyse social posts', expect.any(String), ACTOR);
  });
});

describe('writing post ideas', () => {
  it('keeps a plain voice when there are no posts to imitate', async () => {
    expect(await postIdeas('  Hiring  ', 2, ACTOR)).toBe('Social post ideas: done');
    const prompt = promptOf();
    expect(prompt.startsWith('Write 2 social media post ideas about: Hiring\n')).toBe(true);
    expect(prompt).toContain('Keep a clear, friendly, professional voice.');
    expect(prompt).not.toContain('Match the voice');
  });

  it('refuses a topic that is too long or a count that is not whole', async () => {
    await expect(postIdeas('x'.repeat(301), 3, ACTOR)).rejects.toThrow(
      'Keep the topic under 300 characters',
    );
    await expect(postIdeas('Hiring', 2.5, ACTOR)).rejects.toThrow('between 1 and 10');
    await expect(postIdeas('Hiring', 0, ACTOR)).rejects.toThrow('between 1 and 10');
    expect(runAssist).not.toHaveBeenCalled();
  });
});
