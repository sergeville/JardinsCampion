import { NextResponse } from 'next/server';
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

export async function POST(request: Request) {
  try {
    const { message, error, logs } = await request.json();

    // Log the agent request
    DatabaseService.addLog({
      operation: 'agentRequest',
      details: `Processing agent request: ${message}`,
      success: true,
    });

    let response = '';

    // If there's an error to analyze
    if (error) {
      const analysis = analyzeError(error);
      response =
        `I've analyzed the error and here's what I found:\n\n` +
        `🔍 Error: ${error}\n\n` +
        `💡 Suggestion: ${analysis.suggestion}\n\n` +
        (analysis.codeExample
          ? `📝 Here's an example of the correct implementation:\n\`\`\`typescript\n${analysis.codeExample}\n\`\`\``
          : '');
    }
    // Handle other types of messages
    else if (message.toLowerCase().includes('test')) {
      response =
        'I can help you with testing. Here are some available tests:\n' +
        '- Vote History: Tests the vote history retrieval\n' +
        '- Logo Stats: Checks logo statistics and counts\n' +
        '- User Votes: Verifies user voting functionality\n' +
        '- Database Info: Shows database status and records\n' +
        '- Upload Logo: Tests logo upload functionality\n\n' +
        'Which test would you like to run?';
    } else if (message.toLowerCase().includes('help')) {
      response =
        "I'm here to help! I can assist with:\n" +
        '- Analyzing and fixing errors\n' +
        '- Running specific tests\n' +
        '- Explaining test results\n' +
        '- Providing code examples\n' +
        '- Checking database logs\n\n' +
        'What would you like help with?';
    } else {
      response =
        "I'm your test assistant. I can help analyze errors, run tests, and provide suggestions. " +
        "If you're encountering an error, please share the error message, and I'll help you resolve it.";
    }

    // Log the agent response
    DatabaseService.addLog({
      operation: 'agentResponse',
      details: `Agent response generated for ${error ? 'error analysis' : 'general inquiry'}`,
      success: true,
    });

    return NextResponse.json({ success: true, response });
  } catch (error) {
    // Log the error
    DatabaseService.addLog({
      operation: 'agentError',
      details: error instanceof Error ? error.message : 'Unknown error in agent processing',
      success: false,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to process agent request' },
      { status: 500 }
    );
  }
}
