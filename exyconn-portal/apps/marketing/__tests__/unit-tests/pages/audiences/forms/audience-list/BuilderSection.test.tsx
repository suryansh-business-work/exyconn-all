import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { BuilderSection } from '../../../../../../src/pages/audiences/forms/audience-list/BuilderSection';
import { renderWithProviders } from '../../../../test-utils';

describe('BuilderSection', () => {
  it('is a region named by its heading, with its hint and fields', () => {
    renderWithProviders(
      <BuilderSection title="Recipient source" hint="Pick a register." aside={<span>AND</span>}>
        <p>Fields</p>
      </BuilderSection>,
    );

    const section = screen.getByRole('region', { name: 'Recipient source' });
    expect(section.tagName).toBe('SECTION');
    expect(screen.getByRole('heading', { level: 3, name: 'Recipient source' })).toBeInTheDocument();
    expect(section).toHaveTextContent('Pick a register.');
    expect(section).toHaveTextContent('AND');
    expect(section).toHaveTextContent('Fields');
  });

  it('translates the title and hint', () => {
    renderWithProviders(
      <BuilderSection title="Audience" hint="Who it is for">
        <p>Fields</p>
      </BuilderSection>,
      { messages: { Audience: 'Publikum', 'Who it is for': 'Für wen' } },
    );

    expect(screen.getByRole('region', { name: 'Publikum' })).toHaveTextContent('Für wen');
  });

  it('leaves the hint out when there is none', () => {
    renderWithProviders(
      <BuilderSection title="Audience">
        <p>Fields</p>
      </BuilderSection>,
    );

    const section = screen.getByRole('region', { name: 'Audience' });
    expect(section.querySelectorAll('p')).toHaveLength(1);
  });
});
