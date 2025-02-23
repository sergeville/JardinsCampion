import { NextRequest } from 'next/server';
import { DatabaseService } from '@/lib/services/databaseService';

interface ErrorPattern {
  pattern: RegExp;
  suggestion: string;
  codeExample?: string;
}

const ERROR_PATTERNS: ErrorPattern[] = [
  {
    pattern: /missing required fields/i,
    suggestion:
      'Check if all required fields are included in your request. The following fields are required: userId, logoId, timestamp, userName, and ownerId.',
    codeExample: `// Example of a complete vote submission
const voteData = {
  userId: "user123",      // Required: User's unique identifier
  logoId: "logo123",      // Required: Logo's unique identifier
  userName: "Test User",  // Required: Name of the user
  ownerId: "owner123",   // Required: Owner's unique identifier
  timestamp: new Date().toISOString()  // Required: Time of vote
};`,
  },
  {
    pattern: /already voted/i,
    suggestion:
      "A user can only vote once for each logo. You may want to clear the user's previous votes for testing.",
    codeExample: `// Clear user's votes
await makeRequest('/database-info', {
  method: 'POST',
  body: JSON.stringify({
    action: 'update',
    collectionName: 'users',
    query: { userId: testUserId },
    data: { $set: { votedLogos: [], voteCount: 0 } }
  })
});`,
  },
  {
    pattern: /token|authentication|unauthorized/i,
    suggestion:
      "This appears to be an authentication error. Make sure you're using valid credentials and your token hasn't expired.",
    codeExample: `// Get a fresh token
const loginResponse = await makeRequest('/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    username: 'test',
    password: 'password'
  })
});
const token = loginResponse.accessToken;`,
  },
  {
    pattern: /database|mongodb|connection/i,
    suggestion: 'Check your database connection and make sure your MongoDB instance is running.',
    codeExample: `// Verify database connection
const dbInfo = await makeRequest('/database-info', {
  method: 'POST',
  body: JSON.stringify({
    action: 'stats'
  })
});`,
  },
  {
    pattern: /Expected server error but got success response/i,
    suggestion:
      'The validation test expected a 400 or 500 error response, but the server accepted the invalid request. This indicates that the server-side validation is not properly checking for required fields.',
    codeExample: `// In your vote route handler (src/app/api/votes/route.ts), add this validation:
export async function POST(request: Request) {
  try {
    const { userId, logoId, userName, ownerId, timestamp } = await request.json();
    
    // Validate required fields
    if (!userId || !logoId || !userName || !ownerId || !timestamp) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          invalidFields: {
            userId: !userId,
            logoId: !logoId,
            userName: !userName,
            ownerId: !ownerId,
            timestamp: !timestamp
          }
        },
        { status: 400 }
      );
    }
    // ... rest of your code
  } catch (error) {
    // ... error handling
  }
}`,
  },
];

function analyzeError(error: string): { suggestion: string; codeExample?: string } {
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.pattern.test(error)) {
      return {
        suggestion: pattern.suggestion,
        codeExample: pattern.codeExample,
      };
    }
  }

  return {
    suggestion:
      "I couldn't identify this specific error. Please provide more details about what you were trying to do when the error occurred.",
  };
}

// Configure route for static export
export const dynamic = 'error';
export const dynamicParams = false;

export async function POST(request: NextRequest) {
  return new Response(
    'This API route is not available in static export. Please use client-side data management.',
    { status: 404 }
  );
}
