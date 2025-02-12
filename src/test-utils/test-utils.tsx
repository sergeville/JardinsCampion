import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';

// Custom render function that could include providers, context, etc.
function render(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return rtlRender(ui, { ...options });
}

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { render };

// Mock localStorage
export const mockLocalStorage = () => {
  const storage: { [key: string]: string } = {};
  return {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach((key) => {
        delete storage[key];
      });
    },
  };
};

// Mock window.matchMedia
export const mockMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Helper to simulate user votes
export const simulateVote = async (
  user: { name: string; id: string },
  logoId: string,
  fireEvent: typeof import('@testing-library/react').fireEvent,
  screen: typeof import('@testing-library/react').screen
) => {
  // Click on a logo
  const logos = screen.getAllByRole('img');
  fireEvent.click(logos[parseInt(logoId) - 1]);

  // Enter name
  const nameInput = screen.getByPlaceholderText('Your name');
  fireEvent.change(nameInput, { target: { value: user.name } });

  // Submit vote
  const submitButton = screen.getByText('Submit Vote');
  fireEvent.click(submitButton);
};
