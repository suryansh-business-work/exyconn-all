import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ScreenshotsApp from './ScreenshotsApp';

/** The gallery window's entry point — a second renderer, built by electron-vite alongside the app. */
const container = document.getElementById('root');
if (container === null) {
  throw new Error('Root container #root was not found');
}

createRoot(container).render(
  <StrictMode>
    <ScreenshotsApp />
  </StrictMode>,
);
