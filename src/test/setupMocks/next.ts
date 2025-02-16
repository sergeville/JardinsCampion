const mockNextResponse = {
  json: jest.fn((data) => ({
    json: () => Promise.resolve(data),
  })),
};

const mockNextRequest = jest.fn((url: string, init?: RequestInit) => ({
  url,
  method: init?.method || 'GET',
  headers: new Headers(init?.headers),
  nextUrl: new URL(url),
  json: () => Promise.resolve(init?.body ? JSON.parse(init.body.toString()) : null),
}));

jest.mock('next/server', () => ({
  NextResponse: mockNextResponse,
  NextRequest: mockNextRequest,
}));

export { mockNextResponse, mockNextRequest };
