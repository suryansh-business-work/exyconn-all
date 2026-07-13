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

  /**
   * Uploads any base64/data-URL image and returns its hosted URL. This is the single path
   * behind the portal's shared ImageUploadDialog — `folder` just groups the uploads
   * (branding, blog, tools…). Sanitised so a caller cannot escape the portal's namespace.
   */
  async uploadImage(file: string, fileName: string, folder = 'misc'): Promise<string> {
    const client = await this.getClient();
    const safeFolder = folder.replaceAll(/[^a-zA-Z0-9_-]/g, '') || 'misc';
    const result = await client.upload({
      file,
      fileName,
      folder: `${MEDIA_FOLDER}/${safeFolder}`,
      useUniqueFileName: true,
    });
    return result.url;
  }

  /**
   * Uploads a desktop-tracker screenshot and returns its hosted URL. Screenshots are
   * foldered per employee so they can be found (and purged) per person.
   */
  async uploadTrackerScreenshot(file: string, fileName: string, userId: string): Promise<string> {
    const client = await this.getClient();
    const result = await client.upload({
      file,
      fileName,
      folder: `${TRACKER_FOLDER}/${userId}`,
      useUniqueFileName: true,
    });
    return result.url;
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
