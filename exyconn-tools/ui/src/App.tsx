import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './shared/context/ThemeContext';
import { OpenAIProvider } from './shared/context/OpenAIContext';
import { SecretsProvider } from './shared/context/SecretsContext';
import ScrollToTop from './shared/components/ScrollToTop/ScrollToTop';
import ScrollTopButton from './shared/components/ScrollToTop/ScrollTopButton';
import AppRoutes from './routes';

const App: React.FC = () => (
  <ThemeProvider>
    <OpenAIProvider>
      <BrowserRouter>
        {/* Inside the router: both read the current location / window scroll. */}
        <ScrollToTop />
        <SecretsProvider>
          <AppRoutes />
        </SecretsProvider>
        <ScrollTopButton />
      </BrowserRouter>
    </OpenAIProvider>
  </ThemeProvider>
);

export default App;
