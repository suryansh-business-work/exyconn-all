import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrowserFrame } from '../../../src/components/BrowserFrame';
import { renderWithProviders } from '../test-utils';

describe('the browser frame', () => {
  it('shows the address bar above the site it frames', () => {
    renderWithProviders(
      <BrowserFrame address="northwind.example">
        <p>Site body</p>
      </BrowserFrame>,
    );
    const address = screen.getByText('northwind.example');
    const body = screen.getByText('Site body');
    expect(address.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
