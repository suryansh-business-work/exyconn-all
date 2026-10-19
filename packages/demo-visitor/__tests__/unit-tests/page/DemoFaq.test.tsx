import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DemoFaq } from '../../../src/page/DemoFaq';
import { renderWithProviders } from '../test-utils';

const items = [
  { question: 'Which language does it speak?', answer: 'It speaks {language}.' },
  { question: 'Is my data kept?', answer: 'No, demos run on sample data.' },
];

describe('DemoFaq', () => {
  it('opens each question to its answer, filling in facts from the live demo', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DemoFaq items={items} values={{ language: 'Hindi' }} />);
    const question = screen.getByRole('button', { name: 'Which language does it speak?' });
    expect(question).toHaveAttribute('aria-expanded', 'false');
    await user.click(question);
    expect(question).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('It speaks Hindi.')).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it('shows answers as written when no values are given', () => {
    renderWithProviders(<DemoFaq items={items.slice(1)} />);
    expect(screen.getByText('No, demos run on sample data.')).toBeInTheDocument();
  });
});
