import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { BodyGate } from '../../../../../src/pages/legal/forms/BodyGate';
import { renderWithProviders } from '../../../test-utils';

const FAILED = 'The document text could not be loaded. Close this and try again.';

describe('BodyGate', () => {
  it('holds the form back with a spinner while the text loads', () => {
    renderWithProviders(
      <BodyGate loading>
        <p>The form</p>
      </BodyGate>,
    );
    expect(screen.getByRole('progressbar', { name: 'Loading the document' })).toBeInTheDocument();
    expect(screen.queryByText('The form')).not.toBeInTheDocument();
  });

  it('shows an error instead of an empty form when the text did not arrive', () => {
    renderWithProviders(
      <BodyGate loading={false} error={new Error('Network down')}>
        <p>The form</p>
      </BodyGate>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(FAILED);
    expect(screen.queryByText('The form')).not.toBeInTheDocument();
  });

  it('translates the error', () => {
    renderWithProviders(
      <BodyGate loading={false} error="boom">
        <p>The form</p>
      </BodyGate>,
      { messages: { [FAILED]: 'No se pudo cargar el texto.' } },
    );
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar el texto.');
  });

  it('lets the form through once the text is in hand', () => {
    renderWithProviders(
      <BodyGate loading={false}>
        <p>The form</p>
      </BodyGate>,
    );
    expect(screen.getByText('The form')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
