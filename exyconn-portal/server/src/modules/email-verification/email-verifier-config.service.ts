import { badRequest, notFound } from '../../utils/errors';
import { withoutBlankSecret } from '../tech/tech.service';
import { EmailVerifierConfigModel } from './email-verifier-config.model';
import { checkSocks5 } from './socks5.check';

export interface EmailVerifierConfigInput {
  label: string;
  proxyHost: string;
  proxyPort: number;
  proxyUsername: string;
  /** Empty when editing keeps the stored password. */
  proxyPassword: string;
  isActive?: boolean | null;
}

/** Tech > Environment Variables > Email verifier: one proxy config active at a time. */
export const emailVerifierConfigs = {
  list() {
    return EmailVerifierConfigModel.find().sort({ createdAt: -1 }).lean();
  },

  async create(input: EmailVerifierConfigInput) {
    if (input.isActive) {
      await EmailVerifierConfigModel.updateMany({}, { isActive: false });
    }
    return (await EmailVerifierConfigModel.create(input)).toObject();
  },

  async update(id: string, input: EmailVerifierConfigInput) {
    if (input.isActive) {
      await EmailVerifierConfigModel.updateMany({ _id: { $ne: id } }, { isActive: false });
    }
    const doc = await EmailVerifierConfigModel.findByIdAndUpdate(
      id,
      withoutBlankSecret(input, 'proxyPassword'),
      { new: true },
    ).lean();
    if (!doc) notFound('Email verifier config');
    return doc;
  },

  /** Connects to the config's proxy and signs in, without checking any address. */
  async test(id: string) {
    const config = await EmailVerifierConfigModel.findById(id).lean();
    if (!config) notFound('Email verifier config');
    if (!config.proxyHost) {
      badRequest('This config has no proxy; checks run straight from the server.');
    }
    return checkSocks5({
      host: config.proxyHost,
      port: config.proxyPort,
      username: config.proxyUsername,
      password: config.proxyPassword,
    });
  },

  async remove(id: string) {
    const doc = await EmailVerifierConfigModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('Email verifier config');
    return true;
  },
};
