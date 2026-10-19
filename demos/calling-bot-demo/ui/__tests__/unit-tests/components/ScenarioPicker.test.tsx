import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ScenarioPicker } from '../../../src/components/ScenarioPicker';
import { renderWithProviders } from '../test-utils';

const SCENARIOS = [
  { id: 's1', title: 'Clinic', description: 'Book a doctor visit', languageCode: 'en-IN' },
  { id: 's2', title: 'Bank', description: 'An EMI reminder', languageCode: 'hi-IN' },
];

describe('the example picker', () => {
  it('warns, and still lets the visitor call, when the examples failed to load', () => {
    renderWithProviders(
      <ScenarioPicker scenarios={SCENARIOS} selected={null} onSelect={vi.fn()} failed />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The examples could not be loaded. You can still call the bot.',
    );
  });

  it('shows nothing when there are no examples', () => {
    const { container } = renderWithProviders(
      <ScenarioPicker scenarios={[]} selected={null} onSelect={vi.fn()} failed={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('offers the general assistant and every example, and picks one', async () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <ScenarioPicker scenarios={SCENARIOS} selected={null} onSelect={onSelect} failed={false} />,
    );
    const picker = screen.getByRole('combobox', { name: 'Pick a call to try' });
    expect(picker).toHaveTextContent('General assistant');
    await userEvent.click(picker);
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'General assistant',
      'Clinic',
      'Bank',
    ]);
    await userEvent.click(screen.getByRole('option', { name: 'Bank' }));
    expect(onSelect).toHaveBeenCalledWith('s2');
  });

  it('describes the picked example and goes back to the general assistant', async () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <ScenarioPicker
        scenarios={SCENARIOS}
        selected={SCENARIOS[0]}
        onSelect={onSelect}
        failed={false}
      />,
    );
    expect(screen.getByText('Book a doctor visit')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox', { name: 'Pick a call to try' }));
    await userEvent.click(screen.getByRole('option', { name: 'General assistant' }));
    expect(onSelect).toHaveBeenCalledWith('');
  });
});
