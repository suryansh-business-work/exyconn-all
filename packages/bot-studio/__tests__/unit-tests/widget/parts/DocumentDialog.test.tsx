import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentDialog } from '../../../../src/widget/parts/DocumentDialog';
import { renderWithProviders } from '../../test-utils';
import { documentAttachment } from '../widget.fixtures';

describe('DocumentDialog', () => {
  it('stays closed with no document', () => {
    renderWithProviders(<DocumentDialog document={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('previews every kind of section with its heading, subtitle and footer', () => {
    const document = documentAttachment({
      subtitle: 'Valid for 7 days',
      footer: 'Prices include tax',
      sections: [
        { kind: 'text', heading: 'Summary', text: 'Brake pads worn.' },
        {
          kind: 'fields',
          heading: 'Vehicle',
          fields: [{ label: 'Model', value: 'Swift' }],
        },
        {
          kind: 'table',
          columns: ['Part', 'Cost'],
          rows: [
            { id: 'r-1', cells: ['Pads', '₹900'] },
            { id: 'r-2', cells: ['Labour'] },
          ],
        },
      ],
    });
    renderWithProviders(<DocumentDialog document={document} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Repair estimate')).toBeInTheDocument();
    expect(within(dialog).getByText('Valid for 7 days')).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'Summary' })).toBeInTheDocument();
    expect(within(dialog).getByText('Brake pads worn.')).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'Vehicle' })).toBeInTheDocument();
    expect(within(dialog).getByText('Model').tagName).toBe('DT');
    expect(within(dialog).getByText('Swift').tagName).toBe('DD');
    const rows = within(dialog).getAllByRole('row');
    expect(rows.map((row) => row.textContent)).toEqual(['PartCost', 'Pads₹900', 'Labour']);
    // A row with fewer cells than columns still draws the missing cell, empty.
    expect(within(rows[2]).getAllByRole('cell')).toHaveLength(2);
    expect(within(dialog).getByText('Prices include tax')).toBeInTheDocument();
  });

  it('leaves out the subtitle, headings and footer the document does not have', () => {
    const document = documentAttachment({
      sections: [{ kind: 'text', text: 'Just text.' }],
    });
    renderWithProviders(<DocumentDialog document={document} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    expect(within(dialog).getByText('Just text.')).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { level: 2 }).textContent).toBe(
      'Repair estimate',
    );
  });

  it('closes from its Close button', async () => {
    const onClose = vi.fn();
    renderWithProviders(<DocumentDialog document={documentAttachment()} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
