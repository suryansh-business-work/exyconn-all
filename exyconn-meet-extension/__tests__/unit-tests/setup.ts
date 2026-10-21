import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

// Whole pages mount with StrictMode and real module graphs; on a busy CI runner the default
// one-second wait for them to appear is too short to be a fair signal.
configure({ asyncUtilTimeout: 10_000 });
