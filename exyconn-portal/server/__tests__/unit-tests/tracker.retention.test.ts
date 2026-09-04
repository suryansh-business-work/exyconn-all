import { TrackerScreenshotModel } from '../../src/modules/tracker/models';
import { expiryCutoff, purgeExpiredScreenshots } from '../../src/modules/tracker/tracker.retention';
import { imageUploader } from '../../src/utils/imagekit';

const DAY_MS = 24 * 60 * 60 * 1000;

/** A screenshot row `ageDays` old, with or without the provider file id. */
async function screenshotAged(ageDays: number, fileId: string) {
  return TrackerScreenshotModel.create({
    userId: 'u1',
    sessionId: 's1',
    intervalStartedAt: new Date(Date.now() - ageDays * DAY_MS),
    capturedAt: new Date(Date.now() - ageDays * DAY_MS),
    imageUrl: `https://ik.example/${fileId || 'legacy'}.png`,
    fileId,
  });
}

describe('screenshot retention', () => {
  beforeEach(async () => {
    await TrackerScreenshotModel.deleteMany({});
  });

  it('puts the cutoff exactly the retention window back', () => {
    const now = new Date('2026-09-04T10:00:00.000Z');
    expect(expiryCutoff(120, now).toISOString()).toBe('2026-05-07T10:00:00.000Z');
  });

  it('deletes the stored image before the row, and only for expired shots', async () => {
    const remove = jest.spyOn(imageUploader, 'deleteFile').mockResolvedValue(undefined);
    await screenshotAged(200, 'old-file');
    await screenshotAged(3, 'fresh-file');

    const result = await purgeExpiredScreenshots(expiryCutoff(120, new Date()));

    expect(result).toEqual({ deleted: 1, orphaned: 0, failed: 0 });
    expect(remove).toHaveBeenCalledWith('old-file');
    expect(remove).toHaveBeenCalledTimes(1);
    const left = await TrackerScreenshotModel.find().lean();
    expect(left).toHaveLength(1);
    expect(left[0].fileId).toBe('fresh-file');
  });

  it('keeps the row when the image delete fails, so no image is left untracked', async () => {
    jest.spyOn(imageUploader, 'deleteFile').mockRejectedValue(new Error('provider down'));
    await screenshotAged(200, 'old-file');

    const result = await purgeExpiredScreenshots(expiryCutoff(120, new Date()));

    expect(result).toEqual({ deleted: 0, orphaned: 0, failed: 1 });
    expect(await TrackerScreenshotModel.countDocuments()).toBe(1);
  });

  it('drops rows captured before file ids were recorded, and counts them apart', async () => {
    const remove = jest.spyOn(imageUploader, 'deleteFile').mockResolvedValue(undefined);
    await screenshotAged(200, '');

    const result = await purgeExpiredScreenshots(expiryCutoff(120, new Date()));

    expect(result).toEqual({ deleted: 0, orphaned: 1, failed: 0 });
    expect(remove).not.toHaveBeenCalled();
    expect(await TrackerScreenshotModel.countDocuments()).toBe(0);
  });
});
