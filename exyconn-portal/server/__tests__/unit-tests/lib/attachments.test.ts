import mongoose, { Schema } from 'mongoose';
import { attachmentSchema, toAttachments } from '../../../src/lib/attachments';

describe('toAttachments', () => {
  it('keeps only the URL, name and type from the client, stamping who and when', () => {
    const before = Date.now();
    const [file] = toAttachments(
      [{ url: ' https://cdn.test/a.pdf ', name: ' a.pdf ', contentType: ' application/pdf ' }],
      'Ada',
    );
    expect(file).toMatchObject({
      url: 'https://cdn.test/a.pdf',
      name: 'a.pdf',
      contentType: 'application/pdf',
      uploadedBy: 'Ada',
    });
    expect(file.uploadedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('stores an unknown type as empty', () => {
    const files = toAttachments(
      [
        { url: 'u1', name: 'n1', contentType: null },
        { url: 'u2', name: 'n2' },
      ],
      'Ada',
    );
    expect(files.map((file) => file.contentType)).toEqual(['', '']);
  });

  it('treats a missing list as no attachments', () => {
    expect(toAttachments(null, 'Ada')).toEqual([]);
    expect(toAttachments(undefined, 'Ada')).toEqual([]);
  });
});

describe('attachmentSchema', () => {
  const Probe = mongoose.model(
    'AttachmentProbe',
    new Schema({ files: { type: [attachmentSchema], default: [] } }),
  );

  it('trims, defaults the optional fields and stamps the time', () => {
    const doc = new Probe({ files: [{ url: ' https://cdn.test/x.png ', name: ' x.png ' }] });
    const [file] = doc.files;
    expect(file.url).toBe('https://cdn.test/x.png');
    expect(file.name).toBe('x.png');
    expect(file.contentType).toBe('');
    expect(file.uploadedBy).toBe('');
    expect(file.uploadedAt).toBeInstanceOf(Date);
    expect(doc.validateSync()).toBeUndefined();
  });

  it('requires a URL and a name, and carries no id of its own', () => {
    const doc = new Probe({ files: [{ contentType: 'image/png' }] });
    const errors = doc.validateSync()?.errors ?? {};
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(['files.0.url', 'files.0.name']));
    expect(doc.files[0]._id).toBeUndefined();
  });
});
