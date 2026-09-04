import ImageKit from 'imagekit';
import { ImageConfigModel, type ImageConfigDocument } from '../modules/tech/image-config.model';

const AVATAR_FOLDER = '/exyconn-portal/avatars';
const TEST_FOLDER = '/exyconn-portal/tests';
const TRACKER_FOLDER = '/exyconn-portal/tracker';
const MEDIA_FOLDER = '/exyconn-portal/media';

/**
 * Server-side image uploader (singleton). The provider credentials are loaded
 * from the active Image config in the Tech module (DB-backed, no env dependency).
 */
class ImageUploader {
  /** Builds an ImageKit client from an explicit Image config document. */
  private buildClient(config: ImageConfigDocument): ImageKit {
    return new ImageKit({
      publicKey: config.publicKey,
      privateKey: config.privateKey,
      urlEndpoint: config.urlEndpoint,
    });
  }

  /** Builds an ImageKit client from the single active Image config, or throws. */
  private async getClient(): Promise<ImageKit> {
    const config = await ImageConfigModel.findOne({ isActive: true }).lean();
    if (!config) {
      throw new Error('No active image configuration. Add one in the Tech module.');
    }
    return this.buildClient(config);
  }

  /** Uploads a base64/data-URL image and returns its hosted URL. */
  async uploadAvatar(file: string, fileName: string): Promise<string> {
    const client = await this.getClient();
    const result = await client.upload({
      file,
      fileName,
      folder: AVATAR_FOLDER,
      useUniqueFileName: true,
    });
    return result.url;
  }

  /** Keeps a caller-supplied folder inside the portal's media namespace. */
  private mediaFolder(folder: string): string {
    return `${MEDIA_FOLDER}/${folder.replaceAll(/[^a-zA-Z0-9_-]/g, '') || 'misc'}`;
  }

  /**
   * Uploads any base64/data-URL image and returns its hosted URL. This is the single path
   * behind the portal's shared ImageUploadDialog — `folder` just groups the uploads
   * (branding, blog, tools…). Sanitised so a caller cannot escape the portal's namespace.
   */
  async uploadImage(file: string, fileName: string, folder = 'misc'): Promise<string> {
    const client = await this.getClient();
    const result = await client.upload({
      file,
      fileName,
      folder: this.mediaFolder(folder),
      useUniqueFileName: true,
    });
    return result.url;
  }

  /**
   * Imports a remote media URL (a Pexels clip, which is far too big to round-trip through
   * the browser as base64) — ImageKit fetches it itself — and returns the hosted URL, so
   * nothing the portal stores points at a third-party CDN.
   */
  async uploadFromUrl(url: string, fileName: string, folder = 'misc'): Promise<string> {
    const client = await this.getClient();
    const result = await client.upload({
      file: url,
      fileName,
      folder: this.mediaFolder(folder),
      useUniqueFileName: true,
    });
    return result.url;
  }

  /**
   * Uploads a desktop-tracker screenshot. Screenshots are foldered per employee so they can
   * be found (and purged) per person.
   *
   * Returns the provider's `fileId` alongside the URL because a URL cannot be deleted —
   * ImageKit only removes a file by its id. Retention is what needs that: without the id
   * stored next to the row, expiring a screenshot would delete our record and leave the
   * image on the CDN forever.
   */
  async uploadTrackerScreenshot(
    file: string,
    fileName: string,
    userId: string,
  ): Promise<{ url: string; fileId: string }> {
    const client = await this.getClient();
    const result = await client.upload({
      file,
      fileName,
      folder: `${TRACKER_FOLDER}/${userId}`,
      useUniqueFileName: true,
    });
    return { url: result.url, fileId: result.fileId };
  }

  /**
   * Permanently deletes one uploaded file. Used by screenshot retention; a file that is
   * already gone is treated as success, since the caller's goal is that it no longer exists.
   */
  async deleteFile(fileId: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.deleteFile(fileId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.toLowerCase().includes('does not exist')) {
        throw error;
      }
    }
  }

  /**
   * Uploads a file through an explicit config (not necessarily the active one)
   * so an admin can validate provider credentials before activating.
   */
  async uploadTest(config: ImageConfigDocument, file: string, fileName: string): Promise<string> {
    const client = this.buildClient(config);
    const result = await client.upload({
      file,
      fileName,
      folder: TEST_FOLDER,
      useUniqueFileName: true,
    });
    return result.url;
  }
}

export const imageUploader = new ImageUploader();
