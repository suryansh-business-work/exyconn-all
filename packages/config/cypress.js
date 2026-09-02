import { fileURLToPath, URL } from 'node:url';

const supportFile = fileURLToPath(
  new URL('../../exyconn-portal/ui/cypress/support/component.tsx', import.meta.url),
);

/** Cypress component-testing config shared by every portal package. */
export function portalCypressConfig() {
  return {
    component: {
      devServer: { framework: 'react', bundler: 'vite' },
      specPattern: 'src/**/*.cy.{ts,tsx}',
      supportFile,
    },
  };
}
