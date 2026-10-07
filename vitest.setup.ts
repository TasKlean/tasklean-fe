// Registers jest-dom matchers (toBeInTheDocument, etc.) on vitest's `expect`.
// Harmless under the node environment; needed once component tests run in jsdom.
import "@testing-library/jest-dom/vitest";
