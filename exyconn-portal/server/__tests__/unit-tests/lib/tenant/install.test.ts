import mongoose, { Schema } from 'mongoose';
import {
  ORGANIZATION_FIELD,
  PLATFORM_MODELS,
  assertTenantCoverage,
} from '../../../../src/lib/tenant';

describe('installing the organization scope', () => {
  it('scopes every model that is not the platform’s own', () => {
    const Scoped = mongoose.model('InstallProbe', new Schema({ name: String }));
    expect(Scoped.schema.path(ORGANIZATION_FIELD)).toBeDefined();
  });

  it('leaves a platform model unscoped', () => {
    expect(PLATFORM_MODELS.has('Gig')).toBe(true);
    const Platform = mongoose.model('Gig', new Schema({ title: String }));
    expect(Platform.schema.path(ORGANIZATION_FIELD)).toBeUndefined();
  });

  it('still looks up a model by name alone', () => {
    const Scoped = mongoose.model('InstallLookupProbe', new Schema({ name: String }));
    expect(mongoose.model('InstallLookupProbe')).toBe(Scoped);
  });
});

describe('assertTenantCoverage', () => {
  it('passes while every model is classified', () => {
    expect(() => assertTenantCoverage()).not.toThrow();
  });

  it('names a model defined around the scope, and passes again once it is gone', () => {
    const unpatchedModel = mongoose.Mongoose.prototype.model as unknown as (
      this: typeof mongoose,
      name: string,
      schema: Schema,
    ) => unknown;
    unpatchedModel.call(mongoose, 'UnscopedProbe', new Schema({ a: String }));
    try {
      expect(() => assertTenantCoverage()).toThrow(
        /These models carry no organization: UnscopedProbe\./,
      );
    } finally {
      mongoose.deleteModel('UnscopedProbe');
    }
    expect(() => assertTenantCoverage()).not.toThrow();
  });
});
