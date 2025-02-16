# Authentication System Documentation

## Overview

This document describes the authentication system implemented in the Jardins Campion application. The system uses JWT (JSON Web Tokens) for authentication and includes CSRF protection.

## Environment Setup

### Required Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database Configuration
MONGODB_URI_DEV=mongodb://admin:devpassword@localhost:27019/jardins-campion-dev?authSource=admin
MONGODB_URI_PROD=mongodb://admin:prodpassword@localhost:27020/jardins-campion-prod?authSource=admin

# Environment
NODE_ENV=development

# JWT Secret
JWT_SECRET=your-super-secret-key-for-development-only
```

### Dependencies

The authentication system requires the following npm packages:

```json
{
  "dependencies": {
    "jsonwebtoken": "^latest",
    "jwt-decode": "^latest"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^latest"
  }
}
```

## API Endpoints

### 1. Login

- **Endpoint**: `/api/auth/login`
- **Method**: POST
- **Headers**:
  - `Content-Type: application/json`
  - `X-CSRF-Token: <csrf-token>`
- **Request Body**:

  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

- **Success Response** (200):

  ```json
  {
    "accessToken": "string"
  }
  ```

- **Error Response** (401):

  ```json
  {
    "error": "Invalid credentials"
  }
  ```

### 2. Refresh Token

- **Endpoint**: `/api/auth/refresh`
- **Method**: POST
- **Headers**:
  - `X-CSRF-Token: <csrf-token>`
- **Success Response** (200):

  ```json
  {
    "accessToken": "string"
  }
  ```

- **Error Response** (401):

  ```json
  {
    "error": "Token refresh failed"
  }
  ```

### 3. Verify Token

- **Endpoint**: `/api/auth/verify`
- **Method**: POST
- **Headers**:
  - `Content-Type: application/json`
  - `X-CSRF-Token: <csrf-token>`
- **Request Body**:

  ```json
  {
    "token": "string"
  }
  ```

- **Success Response** (200):

  ```json
  {
    "valid": true
  }
  ```

- **Error Response** (401):

  ```json
  {
    "error": "Invalid token"
  }
  ```

### 4. CSRF Token

- **Endpoint**: `/api/auth/csrf`
- **Method**: GET
- **Success Response** (200):

  ```json
  {
    "token": "string"
  }
  ```

- **Error Response** (500):

  ```json
  {
    "error": "Failed to generate CSRF token"
  }
  ```

## Token Structure

The JWT tokens contain the following claims:

```json
{
  "sub": "user ID",
  "name": "user name",
  "exp": "expiration timestamp",
  "iat": "issued at timestamp"
}
```

## Security Features

### CSRF Protection

- CSRF tokens are required for all authenticated requests
- Tokens are generated using cryptographically secure random bytes
- Tokens must be included in the `X-CSRF-Token` header

### JWT Security

- Tokens expire after 1 hour
- Tokens are signed using a secret key
- Token verification is performed on every protected request
- Automatic token refresh when approaching expiration

### Error Handling

- Proper error responses for invalid credentials
- Secure error messages that don't leak sensitive information
- Automatic token refresh on 401 responses

## Usage Example

```typescript
// 1. Get CSRF token
const csrfResponse = await fetch('/api/auth/csrf');
const { token: csrfToken } = await csrfResponse.json();

// 2. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify({
    username: 'test',
    password: 'password',
  }),
});
const { accessToken } = await loginResponse.json();

// 3. Make authenticated requests
const response = await fetch('/api/protected-route', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'X-CSRF-Token': csrfToken,
  },
});
```

## Development Testing

For development and testing purposes, the following credentials are available:

- Username: `test`
- Password: `password`

## Best Practices

1. Always use HTTPS in production
2. Never store sensitive information in the JWT payload
3. Keep the JWT secret key secure and unique per environment
4. Implement proper token refresh mechanisms
5. Include CSRF tokens in all state-changing requests
6. Use proper error handling and logging
7. Implement rate limiting for auth endpoints
8. Regular security audits and updates

## Error Codes

- `401`: Authentication failed (invalid credentials, expired token)
- `403`: Forbidden (missing or invalid CSRF token)
- `500`: Internal server error

## Future Improvements

1. Implement refresh token rotation
2. Add rate limiting
3. Add OAuth integration
4. Enhance security headers
5. Add session management
6. Implement password reset functionality
7. Add multi-factor authentication
8. Enhance logging and monitoring
