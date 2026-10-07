import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import type { DocumentAttachment } from '@exyconn/wa-flow';
import { DocumentMessage } from '../../../../../src/components/wa/messages/DocumentMessage';
import { frame, renderMessage } from './messages.fixtures';

function attachment(overrides: Partial<DocumentAttachment> = {}): DocumentAttachment {
  return {
    fileName: 'Invoice-1042.pdf',
    fileType: 'PDF',
    pages: 3,
    sizeKb: 245,
    preview: { title: 'Invoice', sections: [] },
    ...overrides,
  };
}

describe('DocumentMessage', () => {
  it('shows a PDF with its pages, type and size, and opens its preview', async () => {
    const invoice = attachment();
    const { actions, user } = renderMessage(
      <DocumentMessage
        content={{ type: 'document', document: invoice, caption: 'Your invoice' }}
        frame={frame}
      />,
    );
    const open = screen.getByRole('button', { name: 'Open Invoice-1042.pdf' });
    expect(open).toHaveTextContent('3 pages · PDF · 245 kB');
    expect(screen.getByTestId('PictureAsPdfIcon')).toBeInTheDocument();
    expect(screen.getByText('Your invoice')).toBeInTheDocument();
    await user.click(open);
    expect(actions.openDocument).toHaveBeenCalledWith(invoice);
  });

  it('says "1 page" for a single page and uses a sheet icon for other files', () => {
    renderMessage(
      <DocumentMessage
        content={{
          type: 'document',
          document: attachment({ fileName: 'Plan.docx', fileType: 'DOCX', pages: 1, sizeKb: 12 }),
        }}
        frame={frame}
      />,
    );
    expect(screen.getByRole('button', { name: 'Open Plan.docx' })).toHaveTextContent(
      '1 page · DOCX · 12 kB',
    );
    expect(screen.getByTestId('DescriptionIcon')).toBeInTheDocument();
    expect(screen.queryByTestId('PictureAsPdfIcon')).not.toBeInTheDocument();
  });
});
