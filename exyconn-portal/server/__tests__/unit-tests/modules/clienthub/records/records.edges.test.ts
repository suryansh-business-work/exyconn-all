import { linksService } from '../../../../../src/modules/clienthub/records/links.service';
import { sharesService } from '../../../../../src/modules/clienthub/records/shares.service';
import {
  clientLabel,
  clientOrThrow,
  staffName,
} from '../../../../../src/modules/clienthub/records/records.client';
import { LegalDocumentModel } from '../../../../../src/modules/legal/document.model';
import { useTestOrganization } from '../../../../helpers';
import { codeOf } from '../../codeOf';
import { seedClient, staffContext } from './fixtures';

const organizationId = useTestOrganization();
const MISSING = '64b000000000000000000099';
const LINK = { title: 'Site', url: 'https://acme.test' };

describe('records that are not there', () => {
  it('says not found for a link that is gone', async () => {
    expect(await codeOf(linksService.update(MISSING, LINK))).toBe('NOT_FOUND');
    expect(await codeOf(linksService.remove(MISSING))).toBe('NOT_FOUND');
  });

  it('says not found for a client id that is not an id', async () => {
    expect(await codeOf(clientOrThrow('acme'))).toBe('NOT_FOUND');
  });

  it('refuses to share a record that does not exist or is not an id', async () => {
    const acme = await seedClient('Acme', 'dana@acme.test');

    expect(await codeOf(sharesService.share(acme, { kind: 'CONTRACT', refId: MISSING }, 'A'))).toBe(
      'NOT_FOUND',
    );
    expect(await codeOf(sharesService.share(acme, { kind: 'POLICY', refId: 'nope' }, 'A'))).toBe(
      'NOT_FOUND',
    );
  });

  it('reads the empty text of a shared record that was deleted', async () => {
    const acme = await seedClient('Acme', 'dana@acme.test');
    const doc = await LegalDocumentModel.create({ title: 'Brief', status: 'FINAL' });
    const item = await sharesService.share(
      acme,
      { kind: 'DOCUMENT', refId: doc._id.toHexString() },
      'A',
    );
    await LegalDocumentModel.deleteOne({ _id: doc._id });

    expect(await sharesService.hubContent(acme, item.id)).toBe('');
  });
});

describe('how a client is named in an email', () => {
  it('is the company, or the person when there is no company', () => {
    expect(clientLabel({ name: 'Dana', company: 'Acme' })).toBe('Acme');
    expect(clientLabel({ name: 'Dana', company: '' })).toBe('Dana');
  });
});

describe('who a staff write is filed under', () => {
  it('falls back to the account email when the user is not on file', async () => {
    expect(await staffName(staffContext(organizationId, undefined, MISSING))).toBe(
      'staff@exyconn.test',
    );
  });

  it('is nobody when there is no signed-in user', async () => {
    expect(await staffName({ user: null })).toBe('');
  });
});
