import { Types } from 'mongoose';
import { ActivityModel } from '../../../../../src/modules/crm/activity.model';
import { ColdEmailDraftModel } from '../../../../../src/modules/crm/cold-email/cold-email.model';
import { ContactModel } from '../../../../../src/modules/crm/contact.model';
import { crmTimeline } from '../../../../../src/modules/crm/timeline/crm.timeline';
import { coldEmailDraftPaths } from '../../../../../src/modules/crm/timeline/crm.timeline.cold-email';

const DRAFTED = 'Cold email drafted';

const draft = (
  recordId: string,
  subjects: string[],
  toEmail = 'asha@acme.com',
  object: 'CONTACT' | 'COMPANY' = 'CONTACT',
) =>
  ColdEmailDraftModel.create({
    object,
    recordId,
    toEmail,
    variants: subjects.map((subject) => ({ subject, body: 'b', tone: 'FRIENDLY' })),
    createdById: 'u1',
  });

/** The activity the cold-email service logs when a draft is written. */
const logged = (relatedId: string, notes: string, subject = DRAFTED) => ({
  _id: new Types.ObjectId(),
  subject,
  notes,
  relatedId,
});

describe('coldEmailDraftPaths', () => {
  it('links each drafted line to the draft of that record with that first subject', async () => {
    const asha = new Types.ObjectId().toHexString();
    const ravi = new Types.ObjectId().toHexString();
    const ashaDraft = await draft(asha, ['Faster checkouts', 'Second take']);
    // Another record's draft with the very same line must not be picked.
    await draft(ravi, ['Faster checkouts']);
    const row = logged(asha, 'To asha@acme.com: Faster checkouts');

    const paths = await coldEmailDraftPaths([row]);

    expect(paths).toEqual(
      new Map([
        [
          row._id.toHexString(),
          `/contacts/${asha}/cold-emails?coldEmail=${ashaDraft._id.toHexString()}`,
        ],
      ]),
    );
  });

  it("opens a company's draft on the company's Cold emails tab", async () => {
    const acme = new Types.ObjectId().toHexString();
    const saved = await draft(acme, ['Faster checkouts'], 'hello@acme.com', 'COMPANY');
    const row = logged(acme, 'To hello@acme.com: Faster checkouts');

    const paths = await coldEmailDraftPaths([row]);

    expect(paths.get(row._id.toHexString())).toBe(
      `/companies/${acme}/cold-emails?coldEmail=${saved._id.toHexString()}`,
    );
  });

  it('leaves a line unlinked when its draft is gone, and ignores other activities', async () => {
    const asha = new Types.ObjectId().toHexString();
    await draft(asha, ['Faster checkouts']);
    const deleted = logged(asha, 'To asha@acme.com: A draft since deleted');
    const otherNote = logged(asha, 'To asha@acme.com: Faster checkouts', 'Intro call');

    const paths = await coldEmailDraftPaths([deleted, otherNote]);

    expect(paths.size).toBe(0);
  });

  it('matches a draft left with no versions by its address alone', async () => {
    const asha = new Types.ObjectId().toHexString();
    const empty = await draft(asha, []);
    const row = logged(asha, 'To asha@acme.com: ');

    const paths = await coldEmailDraftPaths([row]);

    expect(paths.get(row._id.toHexString())).toBe(
      `/contacts/${asha}/cold-emails?coldEmail=${empty._id.toHexString()}`,
    );
  });

  it('reads nothing when no row is a drafted line', async () => {
    const find = jest.spyOn(ColdEmailDraftModel, 'find');

    await expect(coldEmailDraftPaths([logged('r1', 'x', 'Note')])).resolves.toEqual(new Map());
    expect(find).not.toHaveBeenCalled();
    find.mockRestore();
  });
});

describe('a cold email on the timeline', () => {
  it("opens the draft from the record's drafted activity", async () => {
    const asha = await ContactModel.create({ name: 'Asha', email: 'asha@acme.com', owner: 'A' });
    const saved = await draft(asha.id, ['Faster checkouts']);
    await ActivityModel.create({
      type: 'NOTE',
      subject: DRAFTED,
      notes: 'To asha@acme.com: Faster checkouts',
      relatedType: 'CONTACT',
      relatedId: asha.id,
      owner: 'Ravi',
      done: true,
    });

    const items = await crmTimeline('CONTACT', asha.id, 10);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      kind: 'NOTE',
      title: DRAFTED,
      url: `/contacts/${asha.id}/cold-emails?coldEmail=${saved._id.toHexString()}`,
    });
  });
});
