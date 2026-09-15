import { importInboundMessage } from '../../src/modules/support/inbound-mail';
import { ensureSupportSlaPolicies } from '../../src/modules/support/sla.service';
import { imageUploader } from '../../src/utils/imagekit';
import type { InboundMessage } from '../../src/utils/inboundMail';

jest.mock('../../src/utils/imagekit', () => ({
  imageUploader: { uploadImage: jest.fn().mockResolvedValue('https://cdn.test/file') },
}));
jest.mock('../../src/modules/email', () => ({ emailer: { send: jest.fn() } }));

const uploadImage = imageUploader.uploadImage as jest.Mock;
const MB = 1024 * 1024;

const arriving = (attachments: InboundMessage['attachments']): InboundMessage => ({
  from: 'dana@acme.test',
  fromName: 'Dana Reyes',
  subject: 'Portal will not load',
  body: 'Every page hangs on the spinner since this morning.',
  inReplyTo: '',
  references: '',
  autoSubmitted: '',
  autoReply: false,
  attachments,
});

describe('inbound mail attachments', () => {
  it('hosts only images and PDFs within the per-file and per-email caps', async () => {
    await ensureSupportSlaPolicies();

    await importInboundMessage(
      arriving([
        { filename: 'shot.png', contentType: 'image/png', content: Buffer.alloc(10) },
        { filename: 'run.exe', contentType: 'application/x-msdownload', content: Buffer.alloc(10) },
        { filename: 'page.html', contentType: 'text/html', content: Buffer.alloc(10) },
        { filename: 'logo.svg', contentType: 'image/svg+xml', content: Buffer.alloc(10) },
        { filename: 'huge.pdf', contentType: 'application/pdf', content: Buffer.alloc(11 * MB) },
        { filename: 'a.pdf', contentType: 'application/pdf', content: Buffer.alloc(9 * MB) },
        { filename: 'b.pdf', contentType: 'application/pdf', content: Buffer.alloc(9 * MB) },
        { filename: 'c.pdf', contentType: 'application/pdf', content: Buffer.alloc(9 * MB) },
      ]),
    );

    expect(uploadImage.mock.calls.map((call) => call[1])).toEqual(['shot.png', 'a.pdf', 'b.pdf']);
  });
});
