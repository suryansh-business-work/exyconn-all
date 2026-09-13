import mongoose, { type Schema } from 'mongoose';
import { PLATFORM_MODELS } from './platform-models';
import { ORGANIZATION_FIELD, tenantPlugin } from './tenant-plugin';

/**
 * Puts every model under its organization, at the moment the model is defined.
 *
 * `mongoose.model(name, schema)` is wrapped rather than using `mongoose.plugin()` because the
 * plugin form never learns the model's NAME, and the name is what decides whether a model is
 * one company's data or the platform's own (see platform-models.ts).
 *
 * IMPORT THIS FIRST — before anything that defines a model. `assertTenantCoverage()` below is
 * the guard that says so out loud if that ever stops being true.
 */
function installTenantScope(): void {
  const original = mongoose.model.bind(mongoose);
  const patched = (name: string, schema?: Schema, ...rest: unknown[]): unknown => {
    if (schema !== undefined && !PLATFORM_MODELS.has(name)) {
      schema.plugin(tenantPlugin, { name });
    }
    return (original as (...args: unknown[]) => unknown)(name, schema, ...rest);
  };
  mongoose.model = patched as unknown as typeof mongoose.model;
}

installTenantScope();

/**
 * Every model is either one company's data or deliberately the platform's. Checked at boot
 * (and in the tests) so a model defined before this installs — or one nobody classified —
 * stops the server instead of quietly serving every company's records to whoever asks.
 */
export function assertTenantCoverage(): void {
  const unscoped = Object.entries(mongoose.models)
    .filter(([name]) => !PLATFORM_MODELS.has(name))
    .filter(([, registered]) => registered.schema.path(ORGANIZATION_FIELD) === undefined)
    .map(([name]) => name);

  if (unscoped.length > 0) {
    throw new Error(
      `These models carry no organization: ${unscoped.join(', ')}. Either they were defined ` +
        'before lib/tenant/install was imported, or they belong in PLATFORM_MODELS.',
    );
  }
}
