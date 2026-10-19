import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { Bubble } from '../../../../src/widget/parts/Bubble';
import { renderPart } from '../widget.fixtures';

describe('Bubble', () => {
  it("draws the visitor's message in the business colour, on the right, with its time", () => {
    renderPart(
      <Bubble mine time="10:30">
        Hello
      </Bubble>,
    );
    const bubble = screen.getByText('Hello');
    expect(getComputedStyle(bubble).backgroundColor).toBe('rgb(6, 168, 138)');
    expect(getComputedStyle(bubble).color).toBe('rgb(17, 17, 17)');
    expect(getComputedStyle(bubble.parentElement as HTMLElement).alignSelf).toBe('flex-end');
    expect(screen.getByText('10:30')).toBeInTheDocument();
  });

  it("draws the agent's message on the left, on paper, without a sender by default", () => {
    renderPart(
      <Bubble mine={false} time="10:31">
        Hi there
      </Bubble>,
    );
    const bubble = screen.getByText('Hi there');
    expect(getComputedStyle(bubble).backgroundColor).not.toBe('rgb(6, 168, 138)');
    expect(getComputedStyle(bubble.parentElement as HTMLElement).alignSelf).toBe('flex-start');
    expect(getComputedStyle(bubble.parentElement as HTMLElement).maxWidth).toBe('86%');
  });

  it('labels a human agent after a handoff', () => {
    renderPart(
      <Bubble mine={false} time="10:32" sender="Priya">
        I can help
      </Bubble>,
    );
    expect(screen.getByText('Priya')).toBeInTheDocument();
  });

  it('lets a bare card use the full width without a bubble around it', () => {
    renderPart(
      <Bubble mine={false} time="10:33" bare>
        <article>Card</article>
      </Bubble>,
    );
    const column = screen.getByRole('article').parentElement as HTMLElement;
    expect(getComputedStyle(column).maxWidth).toBe('100%');
    expect(screen.getByText('10:33').parentElement).toBe(column);
  });
});
