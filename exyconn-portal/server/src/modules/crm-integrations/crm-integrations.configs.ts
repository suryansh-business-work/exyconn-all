import type { Model } from 'mongoose';
import { badRequest, notFound } from '../../utils/errors';
import { open, seal } from '../../utils/secretBox';
import { secretHint } from '../tech/tech.secrets';
import {
  CrmCallConfigModel,
  CrmSmsConfigModel,
  type CrmCallConfigDocument,
  type CrmSmsConfigDocument,
} from './crm-integrations.models';
import {
  parseCallConfig,
  parseSmsConfig,
  type CallConfigValues,
  type SmsConfigValues,
} from './crm-integrations.validation';

interface StoredConfig {
  _id: unknown;
  label: string;
  provider: string;
  authToken: string;
  authTokenHint?: string | null;
  isActive: boolean;
}

/** A config as the server uses it: the token opened, ready for the provider's API. */
export type Usable<T> = T & { id: string; authToken: string };

/** What a screen sees of a config: never the token, only whether one is stored and its tail. */
const present = <T extends StoredConfig>({ authToken, ...row }: T) => ({
  ...row,
  id: String(row._id),
  hasAuthToken: authToken !== '',
  authTokenHint: row.authTokenHint ?? null,
});

/**
 * Create, edit, delete and pick the active one of a company's provider configs (calls or SMS).
 * The tenant plugin keeps every query inside the caller's company. A blank token on an edit
 * keeps the stored one; a config switched on switches the others off.
 */
function configStore<
  Doc extends StoredConfig,
  Values extends { authToken: string; isActive: boolean },
>(M: Model<Doc>, parse: (input: unknown) => Values, what: string) {
  const opened = (row: Doc): Usable<Doc> => ({
    ...row,
    id: String(row._id),
    authToken: open(row.authToken),
  });
  const sealedToken = (plain: string) =>
    plain === '' ? {} : { authToken: seal(plain), authTokenHint: secretHint(plain) };

  return {
    present,

    list: async () =>
      (await M.find().sort({ createdAt: -1 }).lean<Doc[]>()).map((row) => present(row)),

    async create(input: unknown, actorName: string) {
      const values = parse(input);
      if (values.authToken === '') {
        badRequest('Enter the auth token.');
      }
      if (values.isActive) {
        await M.updateMany({}, { isActive: false });
      }
      const row = await M.create({
        ...values,
        ...sealedToken(values.authToken),
        updatedByName: actorName,
      });
      return present(row.toObject() as unknown as Doc);
    },

    async update(id: string, input: unknown, actorName: string) {
      const { authToken, ...values } = parse(input);
      if (values.isActive) {
        await M.updateMany({ _id: { $ne: id } }, { isActive: false });
      }
      const row = await M.findByIdAndUpdate(
        id,
        { $set: { ...values, ...sealedToken(authToken), updatedByName: actorName } },
        { new: true },
      ).lean<Doc | null>();
      if (!row) notFound(what);
      return present(row);
    },

    async remove(id: string) {
      const row = await M.findByIdAndDelete(id).lean<Doc | null>();
      if (!row) notFound(what);
      return present(row);
    },

    /** One config with its token opened, for a test or a send. */
    async usable(id: string): Promise<Usable<Doc>> {
      const row = await M.findById(id).lean<Doc | null>();
      if (!row) notFound(what);
      return opened(row);
    },

    /** The active config with its token opened, or null when the company has none. */
    async active(): Promise<Usable<Doc> | null> {
      const row = await M.findOne({ isActive: true }).lean<Doc | null>();
      return row ? opened(row) : null;
    },
  };
}

export const callConfigs = configStore<CrmCallConfigDocument & { _id: unknown }, CallConfigValues>(
  CrmCallConfigModel as never,
  parseCallConfig,
  'Call integration',
);

export const smsConfigs = configStore<CrmSmsConfigDocument & { _id: unknown }, SmsConfigValues>(
  CrmSmsConfigModel as never,
  parseSmsConfig,
  'SMS integration',
);

export type UsableCallConfig = Usable<CrmCallConfigDocument>;
export type UsableSmsConfig = Usable<CrmSmsConfigDocument>;
