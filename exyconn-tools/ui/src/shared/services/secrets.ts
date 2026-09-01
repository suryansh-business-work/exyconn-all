import { secretsConfig, type SecretField } from '../components/SecretsDrawer/secretsConfig';

/**
 * Single source of truth for reading and writing user-supplied API keys.
 *
 * Two of the Google keys are persisted inside the Lead Generator's own settings
 * blob rather than under their own localStorage entry. Before this module the
 * drawer wrote them into that blob while tools read a flat key that nothing
 * ever set, so a key entered in the drawer was invisible to the tool. Every
 * read and write now goes through here so both sides agree.
 */
const BLOB_FIELDS: Record<string, string> = {
  google_maps_api_key: 'googleMapsApiKey',
  google_places_api_key: 'googlePlacesApiKey',
};

function readBlob(storageKey: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function fieldFor(secretKey: string): SecretField | undefined {
  return secretsConfig.find((field) => field.key === secretKey);
}

/** Returns the stored value for a secret key, or '' when it is not set. */
export function readSecret(secretKey: string): string {
  const field = fieldFor(secretKey);
  if (!field) {
    return '';
  }
  const blobProp = BLOB_FIELDS[secretKey];
  if (blobProp) {
    return readBlob(field.storageKey)[blobProp] ?? '';
  }
  try {
    return localStorage.getItem(field.storageKey) ?? '';
  } catch {
    return '';
  }
}

/** Persists a secret, writing into the shared blob where that field uses one. */
export function writeSecret(secretKey: string, value: string): void {
  const field = fieldFor(secretKey);
  if (!field) {
    return;
  }
  const blobProp = BLOB_FIELDS[secretKey];
  try {
    if (blobProp) {
      const blob = readBlob(field.storageKey);
      blob[blobProp] = value;
      localStorage.setItem(field.storageKey, JSON.stringify(blob));
      return;
    }
    localStorage.setItem(field.storageKey, value);
  } catch {
    /* storage unavailable (private mode) — the in-memory value still applies */
  }
}

/** True when the secret has a non-empty stored value. */
export function hasSecret(secretKey: string): boolean {
  return readSecret(secretKey).trim().length > 0;
}
