import { defineConfig } from 'cypress';
import { registerA11yTasks } from '@exyconn/config/cypress';

export default defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'src/**/*.cy.{ts,tsx}',
    supportFile: 'cypress/support/component.tsx',
  },
  e2e: {
    baseUrl: 'http://localhost:4003',
    specPattern: '__tests__/e2e/**/*.cy.{ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents: registerA11yTasks,
  },
});
