import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './shared/context/ThemeContext';
import { OpenAIProvider } from './shared/context/OpenAIContext';
import AppRoutes from './routes';

const App: React.FC = () => (
  <ThemeProvider>
    <OpenAIProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </OpenAIProvider>
  </ThemeProvider>
);

export default App;
