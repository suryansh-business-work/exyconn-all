import { GraphQLError } from 'graphql';
import { ConfigurationError } from '../../../src/utils/errors';
import { imageUploader } from '../../../src/utils/imagekit';
import {
  ImageConfigModel,
  type ImageConfigDocument,
} from '../../../src/modules/tech/image-config.model';

const mockUpload = jest.fn();
const mockDeleteFile = jest.fn();
const mockImageKit = jest.fn((_options: unknown) => ({
  upload: mockUpload,
  deleteFile: mockDeleteFile,
}));

jest.mock('imagekit', () => ({
  __esModule: true,
  default: function ImageKit(options: unknown) {
    return mockImageKit(options);
  },
}));

const config = {
  label: 'CDN',
  provider: 'imagekit',
  publicKey: 'public_key',
  privateKey: `private-${Date.now()}`,
  urlEndpoint: 'https://ik.test/acme',
  isActive: true,
} as ImageConfigDocument;

const dataUrl = (mime: string, bytes: string) =>
  `data:${mime};base64,${Buffer.from(bytes, 'latin1').toString('base64')}`;
const PNG = dataUrl('image/png', '\x89PNG\r\n\x1A\nrest-of-image');
const PDF = dataUrl('application/pdf', '%PDF-1.7 body');
const WOFF2 = dataUrl('font/woff2', 'wOF2 font body');

function active(value: ImageConfigDocument | null) {
  return jest
    .spyOn(ImageConfigModel, 'findOne')
    .mockReturnValue({ lean: jest.fn().mockResolvedValue(value) } as never);
}

/** The folder of the one upload made. */
const uploadedTo = () => (mockUpload.mock.calls[0][0] as { folder: string }).folder;

beforeEach(() => {
  mockUpload.mockResolvedValue({ url: 'https://ik.test/acme/file.png', fileId: 'file-1' });
  mockDeleteFile.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('uploads through the active configuration', () => {
  it('builds the client from the active credentials and uploads an avatar', async () => {
    active(config);
    await expect(imageUploader.uploadAvatar(PNG, 'me.png')).resolves.toBe(
      'https://ik.test/acme/file.png',
    );
    expect(mockImageKit).toHaveBeenCalledWith({
      publicKey: 'public_key',
      privateKey: config.privateKey,
      urlEndpoint: 'https://ik.test/acme',
    });
    expect(mockUpload).toHaveBeenCalledWith({
      file: PNG,
      fileName: 'me.png',
      folder: '/exyconn-portal/avatars',
      useUniqueFileName: true,
    });
  });

  it('refuses when no image configuration is active', async () => {
    active(null);
    await expect(imageUploader.uploadAvatar(PNG, 'me.png')).rejects.toBeInstanceOf(
      ConfigurationError,
    );
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('checks the file before it reads the configuration', async () => {
    const findOne = active(config);
    await expect(imageUploader.uploadAvatar(PDF, 'me.pdf')).rejects.toBeInstanceOf(GraphQLError);
    await expect(imageUploader.uploadImage('https://evil.test/a.png', 'a.png')).rejects.toThrow(
      'Upload a file, not a link.',
    );
    expect(findOne).not.toHaveBeenCalled();
  });

  it('keeps a media folder inside the portal namespace', async () => {
    active(config);
    await imageUploader.uploadImage(PNG, 'a.png', '../../etc/branding');
    expect(uploadedTo()).toBe('/exyconn-portal/media/etcbranding');
  });

  it('uses the misc folder by default, and when nothing of the name survives', async () => {
    active(config);
    await imageUploader.uploadImage(PDF, 'a.pdf');
    await imageUploader.uploadImage(PNG, 'a.png', '../$$');
    const folders = mockUpload.mock.calls.map((call) => (call[0] as { folder: string }).folder);
    expect(folders).toEqual(['/exyconn-portal/media/misc', '/exyconn-portal/media/misc']);
  });

  it('uploads a résumé into the résumé folder', async () => {
    active(config);
    await imageUploader.uploadResume(PDF, 'cv.pdf');
    expect(uploadedTo()).toBe('/exyconn-portal/resumes');
    await expect(imageUploader.uploadResume(PNG, 'cv.png')).rejects.toThrow(
      'This type of file cannot be uploaded here.',
    );
  });

  it('uploads a web font into the given media folder', async () => {
    active(config);
    await imageUploader.uploadFont(WOFF2, 'brand.woff2', 'fonts');
    expect(uploadedTo()).toBe('/exyconn-portal/media/fonts');
  });

  it('uploads chat media into the website chat folder', async () => {
    active(config);
    await imageUploader.uploadChatMedia(PNG, 'photo.png');
    expect(uploadedTo()).toBe('/exyconn-portal/website-chat');
  });

  it('imports a remote URL without checking it as an upload', async () => {
    active(config);
    await imageUploader.uploadFromUrl('https://videos.pexels.com/clip.mp4', 'clip.mp4', 'stock');
    expect(mockUpload).toHaveBeenCalledWith({
      file: 'https://videos.pexels.com/clip.mp4',
      fileName: 'clip.mp4',
      folder: '/exyconn-portal/media/stock',
      useUniqueFileName: true,
    });
    await imageUploader.uploadFromUrl('https://videos.pexels.com/b.mp4', 'b.mp4');
    expect((mockUpload.mock.calls[1][0] as { folder: string }).folder).toBe(
      '/exyconn-portal/media/misc',
    );
  });

  it('folders a tracker screenshot per employee and returns its file id', async () => {
    active(config);
    await expect(imageUploader.uploadTrackerScreenshot(PNG, 'shot.png', 'user-7')).resolves.toEqual(
      { url: 'https://ik.test/acme/file.png', fileId: 'file-1' },
    );
    expect(uploadedTo()).toBe('/exyconn-portal/tracker/user-7');
    await expect(
      imageUploader.uploadTrackerScreenshot(PDF, 'shot.pdf', 'user-7'),
    ).rejects.toBeInstanceOf(GraphQLError);
  });
});

describe('deleteFile', () => {
  it('deletes by file id', async () => {
    active(config);
    await imageUploader.deleteFile('file-1');
    expect(mockDeleteFile).toHaveBeenCalledWith('file-1');
  });

  it('treats a file that is already gone as deleted', async () => {
    active(config);
    mockDeleteFile.mockRejectedValueOnce(new Error('The requested file Does Not Exist.'));
    await expect(imageUploader.deleteFile('gone')).resolves.toBeUndefined();
    mockDeleteFile.mockRejectedValueOnce('file does not exist');
    await expect(imageUploader.deleteFile('gone')).resolves.toBeUndefined();
  });

  it('passes on any other failure', async () => {
    active(config);
    const failure = new Error('Your request contains invalid fileId parameter.');
    mockDeleteFile.mockRejectedValueOnce(failure);
    await expect(imageUploader.deleteFile('bad')).rejects.toBe(failure);
    mockDeleteFile.mockRejectedValueOnce('network down');
    await expect(imageUploader.deleteFile('bad')).rejects.toBe('network down');
  });
});

describe('uploadTest', () => {
  it('uploads through the given configuration without reading the active one', async () => {
    const findOne = active(null);
    await expect(imageUploader.uploadTest(config, PNG, 'test.png')).resolves.toBe(
      'https://ik.test/acme/file.png',
    );
    expect(findOne).not.toHaveBeenCalled();
    expect(uploadedTo()).toBe('/exyconn-portal/tests');
  });

  it('refuses a document as a test image', async () => {
    await expect(imageUploader.uploadTest(config, PDF, 'test.pdf')).rejects.toBeInstanceOf(
      GraphQLError,
    );
    expect(mockUpload).not.toHaveBeenCalled();
  });
});
