import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { PermissionsPage } from '../../src/pages/permissions';

describe('PermissionsPage', () => {
  it('offers every role but ADMIN, the chosen one from the URL', () => {
    render(
      <MemoryRouter initialEntries={['/admin/permissions/hr']}>
        <MockedProvider mocks={[]}>
          <ThemeProvider theme={theme}>
            <NotificationProvider>
              <Routes>
                <Route path="/admin/permissions/:tab?" element={<PermissionsPage />} />
              </Routes>
            </NotificationProvider>
          </ThemeProvider>
        </MockedProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Roles & Permissions' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'HR' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('tab', { name: 'ADMIN' })).toBeNull();
  });
});
