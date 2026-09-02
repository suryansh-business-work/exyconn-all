import { defineConfig } from 'cypress';

export default defineConfig({
  component: {
    devServer: { framework: 'react', bundler: 'vite' },
    specPattern: 'src/**/*.cy.{ts,tsx}',
    supportFile: '../../exyconn-portal/ui/cypress/support/component.tsx',
  },
});
