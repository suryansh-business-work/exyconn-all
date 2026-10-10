import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import CustomSizesDialog from '../../tools/logo-set/components/CustomSizesDialog/CustomSizesDialog';
import { CustomSize } from '../../tools/logo-set/types';

afterEach(() => vi.restoreAllMocks());

const existing: CustomSize[] = [
  { id: 'a', width: 300, height: 200, label: 'Banner' },
  { id: 'b', width: 64, height: 64, label: 'Tiny' },
];

const setup = (customSizes: CustomSize[] = []) => {
  const onClose = vi.fn();
  const onSave = vi.fn();
  render(<CustomSizesDialog open onClose={onClose} customSizes={customSizes} onSave={onSave} />);
  return { onClose, onSave };
};

describe('CustomSizesDialog', () => {
  it('invites the user to add a first size and saves an empty list', async () => {
    const { onSave, onClose } = setup();
    expect(screen.getByText('No custom sizes added yet.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Save/ }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith([]));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('adds sizes from the three add buttons with distinct ids and counts them on Save', async () => {
    const { onSave } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Add Size' }));
    fireEvent.click(screen.getByRole('button', { name: '+ 1920×1080' }));
    fireEvent.click(screen.getByRole('button', { name: '+ 4K' }));
    expect(await screen.findByRole('button', { name: 'Save (3)' })).toBeInTheDocument();
    expect(screen.queryByText('No custom sizes added yet.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save (3)' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const saved = onSave.mock.calls[0][0] as CustomSize[];
    expect(saved.map(({ width, height, label }) => ({ width, height, label }))).toEqual([
      { width: 512, height: 512, label: 'Custom 1' },
      { width: 1920, height: 1080, label: 'HD Landscape' },
      { width: 3840, height: 2160, label: '4K' },
    ]);
    expect(new Set(saved.map((size) => size.id)).size).toBe(3);
    saved.forEach((size) => expect(size.id).toMatch(/^custom-/));
  });

  it('lists existing sizes, removes one, and saves the rest', async () => {
    const { onSave } = setup(existing);
    expect(screen.getByDisplayValue('Banner')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tiny')).toBeInTheDocument();
    expect(screen.getByText('300×200')).toBeInTheDocument();

    const first = screen.getByText('#1').closest('li') as HTMLElement;
    fireEvent.click(within(first).getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(screen.queryByDisplayValue('Banner')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Save (1)' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith([existing[1]]));
  });

  it('applies a quick preset to both dimensions', async () => {
    const { onSave } = setup([existing[0]]);
    fireEvent.click(screen.getByText('1280×720'));
    await waitFor(() => expect(screen.getByLabelText('Width (px)')).toHaveValue(1280));
    expect(screen.getByLabelText('Height (px)')).toHaveValue(720);
    fireEvent.click(screen.getByRole('button', { name: 'Save (1)' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith([{ ...existing[0], width: 1280, height: 720 }]));
  });

  it('validates the label and the dimensions, and does not save until they are valid', async () => {
    const { onSave } = setup([existing[0]]);
    const label = screen.getByLabelText('Label');
    const width = screen.getByLabelText('Width (px)');
    const height = screen.getByLabelText('Height (px)');

    fireEvent.change(label, { target: { value: '' } });
    fireEvent.blur(label);
    expect(await screen.findByText('Label is required')).toBeInTheDocument();

    fireEvent.change(width, { target: { value: '0' } });
    fireEvent.blur(width);
    expect(await screen.findByText('Min 1px')).toBeInTheDocument();

    fireEvent.change(height, { target: { value: '9000' } });
    fireEvent.blur(height);
    expect(await screen.findByText('Max 8192px')).toBeInTheDocument();

    fireEvent.change(width, { target: { value: '1.5' } });
    fireEvent.blur(width);
    expect(await screen.findByText('Must be integer')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save (1)' }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(label, { target: { value: 'Hero' } });
    fireEvent.change(width, { target: { value: '800' } });
    fireEvent.change(height, { target: { value: '600' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save (1)' }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith([{ ...existing[0], label: 'Hero', width: 800, height: 600 }])
    );
  });

  it('closes without saving from Cancel and from the header button', () => {
    const { onClose, onSave } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    const title = screen.getByText('Custom Sizes').parentElement as HTMLElement;
    fireEvent.click(within(title).getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onSave).not.toHaveBeenCalled();
  });
});
