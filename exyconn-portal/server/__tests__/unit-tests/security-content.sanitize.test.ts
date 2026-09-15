import { sanitizeRichHtml } from '../../src/utils/sanitizeHtml';
import { PolicyModel } from '../../src/modules/legal/policy.model';

describe('rich-text sanitising (policy bodies)', () => {
  it('keeps what the editor writes and drops scripts, handlers and unsafe links', () => {
    const out = sanitizeRichHtml(
      '<h2>T</h2><p style="text-align:center;position:fixed" onclick="x()">a<script>x()</script>' +
        '<a href="javascript:x()" target="_blank">l</a></p>',
    );
    expect(out).toBe(
      '<h2>T</h2><p style="text-align:center">a<a target="_blank" rel="noopener noreferrer">l</a></p>',
    );
  });

  it('cleans a policy body on create and on update', async () => {
    const policy = await PolicyModel.create({
      title: 'Code',
      slug: 'code',
      body: '<p>Be decent.</p><img src="https://x.test/a.png" onerror="steal()">',
      effectiveDate: new Date('2026-01-01'),
    });
    expect(policy.body).toBe('<p>Be decent.</p><img src="https://x.test/a.png" />');

    await PolicyModel.updateOne({ _id: policy._id }, { body: '<p>v2</p><script>x()</script>' });
    const updated = await PolicyModel.findById(policy._id).lean();
    expect(updated?.body).toBe('<p>v2</p>');
  });
});
