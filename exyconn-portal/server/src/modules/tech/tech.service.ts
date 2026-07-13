import { EmailConfigModel } from './email-config.model';
import { ImageConfigModel } from './image-config.model';
import { notFound } from '../../utils/errors';
import { mailer } from '../../utils/mailer';
import { imageUploader } from '../../utils/imagekit';

export interface EmailConfigInput {
  label: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromAddress: string;
  isActive?: boolean;
}

export interface ImageConfigInput {
  label: string;
  provider?: string;
  publicKey: string;
  privateKey: string;
  urlEndpoint: string;
  isActive?: boolean;
}

/**
 * Tech-module integration configs (email & image upload). Enforces a single
 * active config per type so the mailer/uploader have an unambiguous choice.
 */
class TechService {
  listEmailConfigs() {
    return EmailConfigModel.find().sort({ createdAt: -1 }).lean();
  }

  async createEmailConfig(input: EmailConfigInput) {
    if (input.isActive) await EmailConfigModel.updateMany({}, { isActive: false });
    return (await EmailConfigModel.create(input)).toObject();
  }

  async updateEmailConfig(id: string, input: EmailConfigInput) {
    if (input.isActive) {
      await EmailConfigModel.updateMany({ _id: { $ne: id } }, { isActive: false });
    }
    const doc = await EmailConfigModel.findByIdAndUpdate(id, input, { new: true }).lean();
    if (!doc) notFound('Email config');
    return doc;
  }

  async deleteEmailConfig(id: string) {
    const doc = await EmailConfigModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('Email config');
    return true;
  }

  /** Sends a verification email through a specific config to validate it. */
  async sendTestEmail(id: string, to: string) {
    const config = await EmailConfigModel.findById(id);
    if (!config) notFound('Email config');
    await mailer.sendTestEmail(config, to);
    return true;
  }

  listImageConfigs() {
    return ImageConfigModel.find().sort({ createdAt: -1 }).lean();
  }

  async createImageConfig(input: ImageConfigInput) {
    if (input.isActive) await ImageConfigModel.updateMany({}, { isActive: false });
    return (await ImageConfigModel.create(input)).toObject();
  }

  async updateImageConfig(id: string, input: ImageConfigInput) {
    if (input.isActive) {
      await ImageConfigModel.updateMany({ _id: { $ne: id } }, { isActive: false });
    }
    const doc = await ImageConfigModel.findByIdAndUpdate(id, input, { new: true }).lean();
    if (!doc) notFound('Image config');
    return doc;
  }

  async deleteImageConfig(id: string) {
    const doc = await ImageConfigModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('Image config');
    return true;
  }

  /** Uploads a file through a specific config and returns the hosted URL. */
  async testImageUpload(id: string, file: string, fileName: string) {
    const config = await ImageConfigModel.findById(id);
    if (!config) notFound('Image config');
    return imageUploader.uploadTest(config, file, fileName);
  }
}

export const techService = new TechService();
