import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { InfraDetailCard } from '../../../../src/pages/infrastructure/InfraDetailCard';
import { renderWithProviders } from '../../test-utils';

describe('InfraDetailCard', () => {
  it('titles the card and lists every fact as label and value', () => {
    renderWithProviders(
      <InfraDetailCard
        title="Docker host"
        icon={<span data-testid="icon" />}
        facts={[
          { label: 'Engine', value: '27.1.0' },
          { label: 'Kernel', value: '6.8.0' },
        ]}
      />,
    );

    expect(screen.getByText('Docker host')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Engine')).toBeInTheDocument();
    expect(screen.getByText('27.1.0')).toBeInTheDocument();
    expect(screen.getByText('Kernel')).toBeInTheDocument();
    expect(screen.getByText('6.8.0')).toBeInTheDocument();
  });

  it('renders a fact’s own node in place of its text value', () => {
    renderWithProviders(
      <InfraDetailCard
        title="MongoDB"
        icon={null}
        facts={[{ label: 'State', value: 'hidden text', node: <strong>Healthy</strong> }]}
      />,
    );

    expect(screen.getByText('Healthy').tagName).toBe('STRONG');
    expect(screen.queryByText('hidden text')).not.toBeInTheDocument();
  });

  it('renders an empty card when there are no facts', () => {
    renderWithProviders(<InfraDetailCard title="Empty" icon={null} facts={[]} />);

    expect(screen.getByText('Empty')).toBeInTheDocument();
  });
});
