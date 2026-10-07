import { Types } from 'mongoose';
import { organizationOf, setOrganizationOf } from '../../../../src/lib/tenant';

describe('organizationOf', () => {
  it('reads the organization as a string, whatever form it is stored in', () => {
    const id = new Types.ObjectId();
    expect(organizationOf({ organizationId: id })).toBe(id.toHexString());
    expect(organizationOf({ organizationId: 'abc' })).toBe('abc');
  });

  it('is null for a platform record', () => {
    expect(organizationOf({})).toBeNull();
    expect(organizationOf({ organizationId: null })).toBeNull();
    expect(organizationOf({ organizationId: undefined })).toBeNull();
  });
});

describe('setOrganizationOf', () => {
  it('moves a document into an organization as an ObjectId', () => {
    const id = new Types.ObjectId().toHexString();
    const doc: Record<string, unknown> = { name: 'x', organizationId: null };
    setOrganizationOf(doc, id);
    expect(doc.organizationId).toBeInstanceOf(Types.ObjectId);
    expect(organizationOf(doc)).toBe(id);
  });
});
