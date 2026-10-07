/**
 * Shared Vitest setup. Adds the jest-dom matchers (toBeInTheDocument, toHaveValue, …) to
 * `expect` in every environment; React Testing Library unmounts after each test on its own
 * because `globals` is on.
 */
import "@testing-library/jest-dom/vitest";
