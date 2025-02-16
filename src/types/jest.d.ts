/// <reference types="@testing-library/jest-dom" />

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare global {
  namespace jest {
    interface Matchers<R> extends TestingLibraryMatchers<R, void> {}
  }
}

export {};
