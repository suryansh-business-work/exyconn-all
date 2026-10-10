import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../shared/context/ThemeContext';
import { SecretsProvider } from '../../shared/context/SecretsContext';
import AppRoutes from '../../routes';

vi.mock('../../shared/data/toolsData', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../shared/data/toolsData')>();
  return {
    ...original,
    // A tool that is registered but has no src/tools/<id> folder.
    getAllTools: () => [
      ...original.getAllTools(),
      { id: 'registered-without-folder', name: 'Ghost', description: '', url: '', icon: 'span', color: '#000' },
    ],
  };
});

const at = (path: string) =>
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <SecretsProvider>
          <AppRoutes />
        </SecretsProvider>
      </MemoryRouter>
    </ThemeProvider>
  );

describe('AppRoutes', () => {
  it('makes no route for a registered tool whose folder does not exist', () => {
    at('/tools/registered-without-folder');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/isn.t here/i);
  });

  it('still routes the real tools', async () => {
    at('/tools/dns-lookup');
    expect(
      await screen.findByRole('heading', { name: /dns lookup/i, level: 1 }, { timeout: 20000 })
    ).toBeInTheDocument();
  });
});
