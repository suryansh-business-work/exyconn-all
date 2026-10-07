import { createRef } from 'react';
import { screen } from '@testing-library/react';
import type { TamaguiTextElement } from 'tamagui';
import { describe, expect, it } from 'vitest';
import {
  Body,
  Caption,
  Display,
  Figure,
  Heading,
  Title,
} from '../../../../src/components/ui/Typography';
import { renderWithProviders } from '../../test-utils';

describe('Typography', () => {
  it('draws every kind of text the app names', () => {
    renderWithProviders(
      <>
        <Display>Dashboard</Display>
        <Figure>7h 30m</Figure>
        <Title>Settings</Title>
        <Heading>Today</Heading>
        <Body>Tracking runs as normal.</Body>
        <Caption>Synced a minute ago</Caption>
      </>,
    );
    for (const text of [
      'Dashboard',
      '7h 30m',
      'Settings',
      'Today',
      'Tracking runs as normal.',
      'Synced a minute ago',
    ]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  });

  it("hands a heading's and a body's ref to the text, so a pop-up can move focus there", () => {
    const heading = createRef<TamaguiTextElement>();
    const body = createRef<TamaguiTextElement>();
    renderWithProviders(
      <>
        <Heading ref={heading}>Sign out?</Heading>
        <Body ref={body}>You will need your password.</Body>
      </>,
    );
    expect(heading.current).toHaveTextContent('Sign out?');
    expect(body.current).toHaveTextContent('You will need your password.');
  });
});
