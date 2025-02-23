# Debugging Guide for Jardins-Campion Tests

## Prerequisites
- VS Code IDE
- Node.js installed
- Project dependencies installed (`npm install`)

## Debug Configuration ✅
Your `.vscode/launch.json` includes two powerful configurations for debugging tests:

### 1. "Debug Tests" Configuration
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "--runInBand",
    "--watchAll=false",
    "--testTimeout=100000",
    "--detectOpenHandles"
  ],
  "console": "integratedTerminal",
  "windows": {
    "program": "${workspaceFolder}/node_modules/jest/bin/jest"
  }
}
```
This configuration:
- Runs all tests in debug mode
- `--runInBand`: Executes tests sequentially (better for debugging)
- `--watchAll=false`: Runs tests once without watching for changes
- `--testTimeout=100000`: Sets a longer timeout for debugging sessions
- `--detectOpenHandles`: Helps identify hanging test processes
- Uses integrated terminal for better visibility

### 2. "Debug Current Test File" Configuration
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Current Test File",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "${fileBasename}",
    "--runInBand",
    "--watchAll=false",
    "--testTimeout=100000",
    "--detectOpenHandles"
  ],
  "console": "integratedTerminal",
  "windows": {
    "program": "${workspaceFolder}/node_modules/jest/bin/jest"
  }
}
```
This configuration:
- Runs only the currently open test file
- `${fileBasename}`: Automatically uses the active file
- Same performance options as "Debug Tests"
- Perfect for focused debugging sessions

### How to Use These Configurations:

1. **Starting a Debug Session**:
   - Press `Ctrl/Cmd + Shift + D` to open the Debug view
   - Select the desired configuration from the dropdown
   - Press `F5` or click the green play button

2. **Configuration Features**:
   - Breakpoint support
   - Variable inspection
   - Call stack examination
   - Watch expressions
   - Console debugging

3. **Keyboard Shortcuts**:
   - `F5`: Start/Continue debugging
   - `F9`: Toggle breakpoint
   - `F10`: Step over
   - `F11`: Step into
   - `Shift + F11`: Step out
   - `Shift + F5`: Stop debugging

4. **Debug Console Commands**:
   ```javascript
   // Available while debugging:
   debug> repl    // Enter REPL mode
   debug> restart // Restart debugging session
   debug> list    // List source code
   ```

## Debugging Steps

### 1. Running Tests in Debug Mode
- [ ] Open VS Code
- [ ] Choose a test file to debug (e.g., `src/__tests__/auth/AuthManager.test.ts`)
- [ ] Set breakpoints by clicking on the line number where you want to pause execution
- [ ] Start debugging:
  ```bash
  # Method 1: Using VS Code UI
  - Press F5 or click the "Run and Debug" icon
  - Select "Debug Current Test File"

  # Method 2: Using CLI with --inspect flag
  npm test -- --inspect-brk src/__tests__/auth/AuthManager.test.ts
  ```

### 2. Using Breakpoints Effectively
- [ ] Strategic places to add breakpoints:
  ```typescript
  // Example from AuthManager.test.ts
  it('should validate tokens correctly', async () => {
    // Breakpoint here to check initial setup
    mockFetch.mockImplementationOnce((url) => {
      // Breakpoint here to verify mock behavior
      if (url === '/api/auth/verify') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ valid: true }),
        });
      }
    });
  });
  ```

### 3. Debugging Test Failures
- [ ] Common test failure points to check:
  ```typescript
  // Mock setup issues
  beforeEach(() => {
    mockFetch.mockReset(); // Breakpoint here
    authManager['accessToken'] = null; // Breakpoint here
  });

  // Async operation issues
  await authManager.login({ username: 'test', password: 'password' }); // Breakpoint here
  ```

### 4. Using Watch Mode
- [ ] Run tests in watch mode for continuous feedback:
  ```bash
  # Start watch mode
  npm test -- --watch src/__tests__/auth/AuthManager.test.ts
  ```

### 5. Debug Console Commands
- [ ] Useful commands while debugging:
  ```javascript
  // In the debug console:
  console.log(authManager.getCurrentUser()); // Check current user
  console.log(mockFetch.mock.calls); // Check mock function calls
  console.log(authManager['accessToken']); // Check private variables
  ```

### 6. Troubleshooting Common Issues
- [ ] Authentication Flow:
  ```typescript
  // Check token validation
  it('should validate tokens correctly', async () => {
    const isValid = await authManager['validateToken']('valid.jwt.token');
    // Add watch expression for isValid
  });
  ```

- [ ] Network Mocks:
  ```typescript
  // Verify network mock responses
  mockFetch.mockImplementation((url) => {
    // Add breakpoint here to debug URL handling
    switch (url) {
      case '/api/auth/login':
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ accessToken: 'valid.jwt.token' }),
        });
    }
  });
  ```

### 7. Test Environment Setup
- [ ] Verify test environment:
  ```typescript
  // Check global mocks
  global.fetch = mockFetch;
  global.Headers = jest.fn().mockImplementation(() => Object.create(mockHeadersProto));
  ```

### 8. Using Jest Test Explorer
- [ ] Install Jest Test Explorer VS Code extension
- [ ] Run individual tests directly from the Test Explorer panel
- [ ] View test results and error messages in a structured way

### 9. Debug Output
- [ ] Enable verbose test output:
  ```bash
  npm test -- --verbose src/__tests__/auth/AuthManager.test.ts
  ```

### 10. Test Isolation
- [ ] Debug test isolation issues:
  ```typescript
  // Check cleanup after each test
  afterEach(() => {
    // Add breakpoint here
    jest.clearAllMocks();
    // Verify state reset
  });
  ```

## Additional Tips
1. Use `console.time()` and `console.timeEnd()` to measure performance
2. Add `debugger;` statements in your code for automatic breakpoints
3. Use Jest's `--detectOpenHandles` flag to find hanging promises
4. Check the Jest configuration in your `package.json` for test timeouts 