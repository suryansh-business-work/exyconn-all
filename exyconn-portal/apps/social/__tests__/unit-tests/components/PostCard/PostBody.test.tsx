import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostBody } from '../../../../src/components/PostCard';

describe('PostBody', () => {
  it('renders the text as plain text, never as markup', () => {
    const { container } = render(<PostBody body={'<b>bold</b>\nnext line'} imageUrl="" />);
    expect(container.querySelector('b')).toBeNull();
    expect(container).toHaveTextContent('<b>bold</b> next line');
  });

  it('shows the attached picture lazily, as decoration', () => {
    const { container } = render(
      <PostBody body="Team offsite" imageUrl="https://cdn.example.com/offsite.jpg" />,
    );
    const image = container.querySelector('img');
    expect(image).toHaveAttribute('src', 'https://cdn.example.com/offsite.jpg');
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(screen.getByText('Team offsite')).toBeInTheDocument();
  });

  it('renders nothing for an empty body and no picture', () => {
    const { container } = render(<PostBody body="" imageUrl="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders only the picture when there is no text', () => {
    const { container } = render(<PostBody body="" imageUrl="https://cdn.example.com/only.jpg" />);
    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(container.querySelector('p')).toBeNull();
  });
});
