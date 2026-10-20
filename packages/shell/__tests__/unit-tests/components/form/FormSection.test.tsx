import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { FormSection } from '@/components/form/FormSection';
import { renderWithProviders } from '../../test-utils';

describe('FormSection', () => {
  it('titles its fields and says what they are for', () => {
    renderWithProviders(
      <FormSection title="Contact" hint="Who you deal with.">
        <input aria-label="Name" />
      </FormSection>,
    );
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Who you deal with.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
  });

  it('shows only the title when there is no hint', () => {
    renderWithProviders(
      <FormSection title="Location">
        <input aria-label="City" />
      </FormSection>,
    );
    const title = screen.getByText('Location');
    expect(title.parentElement?.childElementCount).toBe(1);
  });
});
