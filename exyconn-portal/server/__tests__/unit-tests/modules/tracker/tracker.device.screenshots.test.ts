import { Types } from 'mongoose';
import { imageUploader } from '../../../../src/utils/imagekit';
import {
  trackerDeviceService,
  type ScreenshotInput,
} from '../../../../src/modules/tracker/tracker.device.service';
import { TRACKER_LIMITS } from '../../../../src/modules/tracker/tracker.constants';
import {
  TrackerIntervalModel,
  TrackerScreenshotModel,
  TrackerSessionModel,
} from '../../../../src/modules/tracker/models';
import { codeOf } from '../codeOf';

const USER = new Types.ObjectId().toHexString();
const INTERVAL_START = new Date('2026-07-13T09:00:00.000Z');
const CAPTURED = new Date('2026-07-13T09:04:00.000Z');
const IMAGE = `data:image/jpeg;base64,${Buffer.alloc(64).toString('base64')}`;
const UPLOADED = { url: 'https://ik.example/tracker/shot.jpg', fileId: 'file-1' };

async function session(userId = USER) {
  const created = await TrackerSessionModel.create({
    userId,
    deviceId: 'd1',
    startedAt: INTERVAL_START,
    status: 'active',
  });
  return created._id.toHexString();
}

const shot = (sessionId: string, overrides: Partial<ScreenshotInput> = {}): ScreenshotInput => ({
  sessionId,
  intervalStartedAt: INTERVAL_START,
  capturedAt: CAPTURED,
  image: IMAGE,
  ...overrides,
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('uploading a screenshot', () => {
  it('stores the uploaded image against the interval, named for the employee and moment', async () => {
    const upload = jest.spyOn(imageUploader, 'uploadTrackerScreenshot').mockResolvedValue(UPLOADED);
    const sessionId = await session();

    const stored = await trackerDeviceService.uploadScreenshot(
      USER,
      shot(sessionId, { displayId: '2', blurred: true }),
    );

    expect(upload).toHaveBeenCalledWith(IMAGE, `shot-${USER}-${CAPTURED.getTime()}`, USER);
    expect(stored).toMatchObject({
      imageUrl: UPLOADED.url,
      fileId: UPLOADED.fileId,
      displayId: '2',
      blurred: true,
      // Uploaded from inside an interval the app has not synced yet.
      activityPercent: 0,
    });
  });

  it('carries the activity of an interval that has already been synced', async () => {
    jest.spyOn(imageUploader, 'uploadTrackerScreenshot').mockResolvedValue(UPLOADED);
    const sessionId = await session();
    await TrackerIntervalModel.create({
      userId: USER,
      sessionId,
      startedAt: INTERVAL_START,
      endedAt: new Date('2026-07-13T09:10:00.000Z'),
      activityPercent: 65,
    });

    const stored = await trackerDeviceService.uploadScreenshot(USER, shot(sessionId));

    expect(stored).toMatchObject({ activityPercent: 65, displayId: '', blurred: false });
  });

  it('refuses a capture larger than the byte budget without uploading it', async () => {
    const upload = jest.spyOn(imageUploader, 'uploadTrackerScreenshot');
    const sessionId = await session();
    const oversized = 'A'.repeat(Math.ceil((TRACKER_LIMITS.maxScreenshotBytes * 4) / 3) + 8);

    const attempt = trackerDeviceService.uploadScreenshot(
      USER,
      shot(sessionId, { image: oversized }),
    );

    await expect(attempt).rejects.toThrow('Screenshot is too large');
    expect(upload).not.toHaveBeenCalled();
  });

  it('refuses a session that belongs to somebody else', async () => {
    const upload = jest.spyOn(imageUploader, 'uploadTrackerScreenshot');
    const sessionId = await session(new Types.ObjectId().toHexString());

    await expect(
      codeOf(trackerDeviceService.uploadScreenshot(USER, shot(sessionId))),
    ).resolves.toBe('NOT_FOUND');
    expect(upload).not.toHaveBeenCalled();
    expect(await TrackerScreenshotModel.countDocuments()).toBe(0);
  });
});
