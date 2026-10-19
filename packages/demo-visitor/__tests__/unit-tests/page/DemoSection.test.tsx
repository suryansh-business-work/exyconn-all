import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { DemoSection } from '../../../src/page/DemoSection';
import { renderWithProviders } from '../test-utils';

describe('DemoSection', () => {
  it('labels the band by its heading and shows the line under it', () => {
    renderWithProviders(
      <DemoSection id="how" title="How it works" subtitle="Three steps." tinted>
        <p>content</p>
      </DemoSection>,
    );
    const section = screen.getByRole('region', { name: 'How it works' });
    expect(section).toHaveAttribute('id', 'how');
    expect(screen.getByRole('heading', { level: 2, name: 'How it works' })).toHaveAttribute(
      'id',
      'how-title',
    );
    expect(screen.getByText('Three steps.')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('renders without a subtitle, in the translated language', () => {
    renderWithProviders(
      <DemoSection id="faq" title="Questions">
        <p>answers</p>
      </DemoSection>,
      { messages: { Questions: 'Preguntas' } },
    );
    expect(screen.getByRole('region', { name: 'Preguntas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 }).nextElementSibling).toContainElement(
      screen.getByText('answers'),
    );
  });
});
