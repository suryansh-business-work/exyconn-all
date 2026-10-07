import { uploadChatFiles } from '../../../../src/modules/website-chat/chat.media';
import { imageUploader } from '../../../../src/utils/imagekit';

jest.mock('../../../../src/utils/imagekit', () => ({
  imageUploader: { uploadChatMedia: jest.fn() },
}));

const upload = imageUploader.uploadChatMedia as jest.Mock;

/** A data URL whose base64 payload decodes to `bytes` bytes. */
const dataUrl = (mime: string, bytes: number) =>
  `data:${mime};base64,${Buffer.alloc(bytes).toString('base64')}`;

beforeEach(() => {
  upload.mockImplementation(async (_data: string, name: string) => `https://ik.test/${name}`);
});

describe('uploadChatFiles', () => {
  it('uploads pictures, clips and voice notes with their kind and decoded size', async () => {
    const files = [
      { name: 'a.png', data: dataUrl('image/png', 30) },
      { name: 'b.mp4', data: dataUrl('video/mp4', 3) },
      { name: 'c.webm', data: dataUrl('audio/webm', 6) },
    ];
    await expect(uploadChatFiles(files, 1)).resolves.toEqual([
      { url: 'https://ik.test/a.png', name: 'a.png', kind: 'IMAGE', size: 30 },
      { url: 'https://ik.test/b.mp4', name: 'b.mp4', kind: 'VIDEO', size: 3 },
      { url: 'https://ik.test/c.webm', name: 'c.webm', kind: 'AUDIO', size: 6 },
    ]);
    expect(upload).toHaveBeenCalledWith(files[0].data, 'a.png');
  });

  it('uploads nothing when no files came with the message', async () => {
    await expect(uploadChatFiles([], 10)).resolves.toEqual([]);
    expect(upload).not.toHaveBeenCalled();
  });

  it('refuses anything that is not a picture, video or voice note', async () => {
    const pdf = { name: 'x.pdf', data: dataUrl('application/pdf', 3) };
    await expect(uploadChatFiles([pdf], 10)).rejects.toThrow(
      'Send a picture, a video or a voice note.',
    );
    await expect(uploadChatFiles([{ name: 'x', data: 'plain text' }], 10)).rejects.toThrow(
      'Send a picture, a video or a voice note.',
    );
    expect(upload).not.toHaveBeenCalled();
  });

  it('allows a file of exactly the limit and refuses one byte more', async () => {
    const mb = 1024 * 1024;
    await expect(
      uploadChatFiles([{ name: 'ok.png', data: dataUrl('image/png', 3 * mb) }], 3),
    ).resolves.toHaveLength(1);
    await expect(
      uploadChatFiles([{ name: 'big.png', data: dataUrl('image/png', 3 * mb + 3) }], 3),
    ).rejects.toThrow('Files can be up to 3 MB.');
  });

  it('passes on an upload failure', async () => {
    upload.mockRejectedValueOnce(new Error('ImageKit down'));
    await expect(
      uploadChatFiles([{ name: 'a.png', data: dataUrl('image/png', 3) }], 1),
    ).rejects.toThrow('ImageKit down');
  });
});
