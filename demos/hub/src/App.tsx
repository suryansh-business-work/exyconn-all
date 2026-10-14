import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from '@exyconn/shell/config/apolloClient';
import { ColorModeProvider } from '@exyconn/shell/theme/ColorModeContext';
import { PageErrorBoundary } from '@exyconn/shell/logging/PageErrorBoundary';
import { HubPage } from './HubPage';

/**
 * demos.exyconn.com — the public landing page that lists every demo. Like the status site it
 * does not use `PortalApp`: there is no sign-in here; each demo asks for its own pass.
 */
export function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <ColorModeProvider>
        <PageErrorBoundary>
          <HubPage />
        </PageErrorBoundary>
      </ColorModeProvider>
    </ApolloProvider>
  );
}
