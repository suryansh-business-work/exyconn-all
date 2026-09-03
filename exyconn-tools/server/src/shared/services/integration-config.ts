import type { Model } from "mongoose";

/**
 * Read-only access to the integration credentials the portal owns.
 *
 * SMTP and ImageKit credentials are managed in the portal at
 * Admin > Environment Variables and stored in MongoDB, so they can be rotated
 * without redeploying anything. The shapes below MIRROR the portal's
 * `EmailConfig` / `ImageConfig` models (portal server:
 * `src/modules/tech/*-config.model.ts`) — this service never writes to them.
 * They are mirrored rather than imported because this server builds from its own
 * Docker context and cannot reach the workspace packages.
 *
 * Mongoose is imported lazily so it stays out of the app's startup import graph:
 * only a request that actually needs a credential pays for the driver.
 */

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromAddress: string;
}

export interface ImageConfig {
  publicKey: string;
  privateKey: string;
  urlEndpoint: string;
}

interface ConfigModels {
  email: Model<EmailConfig>;
  image: Model<ImageConfig>;
}

let models: Promise<ConfigModels> | null = null;

/** Connects once, defines the read-only models once, and reuses both thereafter. */
async function getModels(): Promise<ConfigModels> {
  models ??= buildModels().catch((error) => {
    // Do not cache a failed connection: the next call should try again.
    models = null;
    throw error;
  });
  return models;
}

async function buildModels(): Promise<ConfigModels> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set — integration credentials cannot be read.",
    );
  }
  const { default: mongoose, Schema } = await import("mongoose");
  await mongoose.connect(uri);

  const emailSchema = new Schema<EmailConfig>(
    {
      host: String,
      port: Number,
      secure: Boolean,
      username: String,
      password: String,
      fromAddress: String,
    },
    { collection: "emailconfigs", strict: false },
  );
  const imageSchema = new Schema<ImageConfig>(
    { publicKey: String, privateKey: String, urlEndpoint: String },
    { collection: "imageconfigs", strict: false },
  );

  return {
    email:
      mongoose.models.EmailConfig ?? mongoose.model("EmailConfig", emailSchema),
    image:
      mongoose.models.ImageConfig ?? mongoose.model("ImageConfig", imageSchema),
  };
}

/**
 * Caches the active config for a short window so a burst of uploads does not
 * become a burst of queries, while an admin's change still takes effect quickly.
 */
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: unknown; expiresAt: number }>();

async function activeConfig<T>(
  name: string,
  pick: (m: ConfigModels) => Model<T>,
): Promise<T> {
  const cached = cache.get(name);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }
  const doc = await pick(await getModels())
    .findOne({ isActive: true })
    .lean<T>();
  if (!doc) {
    throw new Error(
      `No active ${name} configuration. Add one in the portal under Admin > Environment Variables.`,
    );
  }
  cache.set(name, { value: doc, expiresAt: Date.now() + CACHE_TTL_MS });
  return doc;
}

/** The SMTP account the portal marks active. */
export function getActiveEmailConfig(): Promise<EmailConfig> {
  return activeConfig<EmailConfig>("email", (m) => m.email);
}

/** The ImageKit account the portal marks active. */
export function getActiveImageConfig(): Promise<ImageConfig> {
  return activeConfig<ImageConfig>("image", (m) => m.image);
}
