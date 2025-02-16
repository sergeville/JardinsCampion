'use client';

import { useState, useCallback, useEffect } from 'react';
import styles from './styles.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TestResult {
  id: string;
  name: string;
  success: boolean;
  status: 'success' | 'failure' | 'pending';
  error?: string;
  details?: string;
  response?: any;
}

interface TestResponse {
  success: boolean;
  message?: string;
  details?: string;
  response?: any;
  error?: string;
}

export default function ApiTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set(['all']));
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [portError, setPortError] = useState<string | null>(null);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [databaseLogs, setDatabaseLogs] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);

  const allTestIds = [
    'voteHistory',
    'voteHistoryLimit',
    'logoStats',
    'userVotes',
    'databaseInfo',
    'duplicateVote',
    'serverErrorVote',
    'getAllLogos',
    'uploadLogo',
    'login',
    'verifyToken',
    'refreshToken',
    'getCsrfToken',
  ] as const;

  type TestId = (typeof allTestIds)[number];

  // Function to check if a port is in use
  const checkPort = useCallback(async (port: number): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:${port}/api/database-info`, {
        method: 'HEAD',
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  const findActivePort = useCallback(async () => {
    const ports = [3000, 3001, 3002];
    setPortError(null);

    for (const port of ports) {
      const isActive = await checkPort(port);
      if (isActive) {
        setBaseUrl(`http://localhost:${port}`);
        return;
      }
    }

    setPortError(
      'No Next.js server found running on ports 3000, 3001, or 3002. Please start the server first.'
    );
  }, [checkPort]);

  // Initialize by finding the active port
  useEffect(() => {
    findActivePort();
  }, [findActivePort]);

  const makeRequest = async (path: string, options?: RequestInit) => {
    if (!baseUrl) {
      throw new Error('Server not found. Please ensure the Next.js server is running.');
    }
    const response = await fetch(`${baseUrl}${path}`, options);
    return response.json();
  };

  const tests = {
    voteHistory: async () => {
      return makeRequest('/votes?action=history');
    },
    voteHistoryLimit: async () => {
      return makeRequest('/votes?action=history&limit=5');
    },
    logoStats: async () => {
      return makeRequest('/votes?action=stats');
    },
    userVotes: async () => {
      return makeRequest('/votes?action=userVotes&userId=test-user');
    },
    databaseInfo: async () => {
      return makeRequest('/database-info');
    },
    duplicateVote: async () => {
      // First create a test user
      const { userId } = await createTestUser();

      // Submit first vote (this should succeed)
      const firstVoteResponse = await submitVote(userId);
      if (!firstVoteResponse.success) {
        throw new Error(`First vote failed unexpectedly: ${firstVoteResponse.error}`);
      }

      // Try to submit duplicate vote - this should fail with a specific error
      const duplicateVoteResponse = await submitVote(userId);

      if (duplicateVoteResponse.success) {
        throw new Error('Duplicate vote succeeded when it should have failed');
      }

      // Verify the error message indicates a duplicate vote
      if (
        duplicateVoteResponse.error?.includes('already voted') ||
        duplicateVoteResponse.error?.includes('Vote submission failed')
      ) {
        return {
          success: true,
          message: 'Test passed: Server correctly prevented duplicate vote',
          details: `Error received: ${duplicateVoteResponse.error}`,
          response: duplicateVoteResponse,
        };
      }

      throw new Error(`Unexpected error response: ${duplicateVoteResponse.error}`);
    },
    serverErrorVote: async () => {
      // First create a test user
      const { userId } = await createTestUser();

      try {
        // Create a request with missing required fields
        const requestBody = {
          userId,
          logoId: '1',
          timestamp: new Date().toISOString(),
          // Intentionally omit required fields
          userName: undefined,
          ownerId: undefined,
        };

        // Attempt to submit a vote that should trigger a validation error
        const response = await makeRequest('/votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        // If we get here, the test failed because the server didn't validate properly
        throw new Error(
          `Expected server error but got success response.\n` +
            `Request body: ${JSON.stringify(requestBody, null, 2)}\n` +
            `Server response: ${JSON.stringify(response, null, 2)}`
        );
      } catch (error) {
        // Get AI assistant analysis for the error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const assistantResponse = await makeRequest('/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Analyze this error',
            error: errorMessage,
            logs: databaseLogs,
            context: {
              test: 'serverErrorVote',
              description: 'Testing server-side validation for missing userName and ownerId fields',
              expectedBehavior:
                'Server should return 400 error with userName and ownerId listed as missing fields',
            },
          }),
        });

        // Check if we got the expected error response with specific missing fields
        if (error instanceof Error) {
          const response = JSON.parse(error.message.split('Server response:')[1] || '{}');

          // Verify specific missing fields
          if (
            response.invalidFields &&
            response.invalidFields.userName === true &&
            response.invalidFields.ownerId === true
          ) {
            return {
              success: true,
              message:
                'Test passed: Server correctly identified missing userName and ownerId fields',
              details: `The server properly validated the request and identified the specific missing fields: userName, ownerId`,
              response: {
                error: error.message,
                assistantAnalysis: assistantResponse.response,
                validationTest: {
                  description: 'Testing server-side field validation',
                  expectedMissingFields: ['userName', 'ownerId'],
                  actualMissingFields: Object.keys(response.invalidFields).filter(
                    (key) => response.invalidFields[key]
                  ),
                  fullResponse: response,
                },
              },
            };
          }
        }

        // If the error response doesn't match our expectations
        throw new Error(
          `Unexpected validation response. Expected userName and ownerId to be identified as missing fields.\n\n` +
            `Test Context:\n` +
            `- Testing server-side validation\n` +
            `- Expected: 400 error with userName and ownerId listed as missing\n` +
            `- Actual: ${errorMessage}\n\n` +
            `AI Assistant Analysis:\n${assistantResponse.response}`
        );
      }
    },
    getAllLogos: async () => {
      return makeRequest('/logos');
    },
    uploadLogo: async () => {
      // Create a sample image data (1x1 pixel transparent PNG)
      const base64Data =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      const binaryData = Buffer.from(base64Data, 'base64');
      const blob = new Blob([binaryData], { type: 'image/png' });
      const file = new File([blob], 'test-logo.png', { type: 'image/png' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', 'Test Logo');
      formData.append('alt', 'This is a test logo for API testing');
      formData.append('value', `test-logo-${Date.now()}`);
      formData.append('status', 'active');

      try {
        const response = await makeRequest('/logos', {
          method: 'POST',
          body: formData,
        });

        if (!response.success) {
          throw new Error(response.error || 'Logo upload failed');
        }

        return {
          success: true,
          message: 'Logo uploaded successfully',
          details: 'Logo file was processed and stored',
          response,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          details: 'Failed to upload logo file',
        };
      }
    },
    login: async () => {
      return makeRequest('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'test',
          password: 'password',
        }),
      });
    },
    verifyToken: async () => {
      const loginResponse = await tests.login();
      if (!loginResponse.accessToken) {
        throw new Error('Failed to get token for verification test');
      }

      return makeRequest('/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: loginResponse.accessToken,
        }),
      });
    },
    refreshToken: async () => {
      return makeRequest('/auth/refresh', {
        method: 'POST',
      });
    },
    getCsrfToken: async () => {
      return makeRequest('/auth/csrf');
    },
  };

  const createTestUser = async () => {
    const timestamp = Date.now();
    const response = await makeRequest('/database-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        collectionName: 'users',
        data: {
          name: 'Test User',
          userId: `test-user-${timestamp}`,
          email: 'test@example.com',
          role: 'user',
          status: 'active',
          voteCount: 0,
          votedLogos: [],
        },
      }),
    });
    return { response, userId: `test-user-${timestamp}` };
  };

  const submitVote = async (userId: string) => {
    try {
      const timestamp = new Date().toISOString();
      const response = await makeRequest('/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName: 'Test User',
          logoId: '1',
          ownerId: 'owner123',
          timestamp,
          status: 'active',
        }),
      });

      if (!response.success) {
        const error = new Error(response.error || 'Vote submission failed');
        error.name = 'VoteError';
        throw error;
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.name === 'VoteError' ? 'Vote validation failed' : 'Network or server error',
        };
      }
      return {
        success: false,
        error: 'Unknown error occurred',
        details: 'An unexpected error occurred during vote submission',
      };
    }
  };

  const addLogo = async (timestamp: number) => {
    return makeRequest('/database-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        collectionName: 'logos',
        data: {
          value: `${timestamp}`,
          src: `/logos/Logo${timestamp}.png`,
          alt: `Test logo created during API testing with timestamp ${timestamp}`,
          status: 'active',
        },
      }),
    });
  };

  const getCollectionStats = async () => {
    return makeRequest('/database-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'stats',
        collectionName: 'logos',
      }),
    });
  };

  const updateTestStatus = (testId: string, status: 'pending' | 'success' | 'failure') => {
    setResults((prev) => {
      const existingTest = prev.find((r) => r.id === testId);
      if (existingTest) {
        return prev.map((r) => (r.id === testId ? { ...r, status } : r));
      }
      return [
        ...prev,
        {
          id: testId,
          name: getTestName(testId),
          success: status === 'success',
          status,
          error: undefined,
          details: undefined,
          response: undefined,
        },
      ];
    });
  };

  const runAllTests = async () => {
    if (selectedTests.size === 0) {
      setPortError('Please select at least one test to run');
      return;
    }

    setIsRunning(true);
    setResults([]);
    setPortError(null); // Clear any previous errors

    const testsToRun = selectedTests.has('all') ? allTestIds : Array.from(selectedTests);

    if (testsToRun.length === 0) {
      setPortError('Please select at least one test to run');
      setIsRunning(false);
      return;
    }

    const results: TestResult[] = [];
    for (const test of testsToRun) {
      updateTestStatus(test, 'pending');
      try {
        const testResponse = await tests[test as keyof typeof tests]();

        const result: TestResult = {
          id: test,
          name: getTestName(test),
          success: testResponse.success,
          status: testResponse.success ? 'success' : 'failure',
          error: testResponse.error || testResponse.message,
          details: testResponse.details,
          response: testResponse.response,
        };
        results.push(result);
        updateTestStatus(test, result.status);
      } catch (error) {
        const errorResult: TestResult = {
          id: test,
          name: getTestName(test),
          success: false,
          status: 'failure',
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
        results.push(errorResult);
        updateTestStatus(test, 'failure');
      }
    }
    setResults(results);
    setIsRunning(false);
  };

  const getTestName = (testId: string): string => {
    const names: Record<string, string> = {
      voteHistory: 'Vote History',
      voteHistoryLimit: 'Vote History (Limited)',
      logoStats: 'Logo Stats',
      userVotes: 'User Votes',
      databaseInfo: 'Database Info',
      duplicateVote: 'Duplicate Vote',
      serverErrorVote: 'Server Error Vote',
      getAllLogos: 'Get All Logos',
      uploadLogo: 'Upload Logo',
      login: 'User Login',
      verifyToken: 'Verify Token',
      refreshToken: 'Refresh Token',
      getCsrfToken: 'Get CSRF Token',
    };
    return names[testId] || testId;
  };

  const toggleExpand = (name: string) => {
    setExpandedTests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };

  const handleTestSelection = (testId: string) => {
    const newSelectedTests = new Set(selectedTests);

    if (testId === 'all') {
      if (selectedTests.has('all')) {
        newSelectedTests.clear();
      } else {
        newSelectedTests.clear();
        newSelectedTests.add('all');
      }
    } else {
      if (selectedTests.has('all')) {
        newSelectedTests.clear();
        newSelectedTests.add(testId);
      } else {
        if (selectedTests.has(testId)) {
          newSelectedTests.delete(testId);
        } else {
          newSelectedTests.add(testId);
        }
      }
    }

    setSelectedTests(newSelectedTests);
  };

  const getFixSuggestion = (error: string): string | null => {
    const errorMap: Record<string, string> = {
      'Expected server error but got success response': `Here's what to check:
1. In your route.ts file, look for validation logic
2. Add this code to test:

\`\`\`typescript
// Add proper validation
if (!userId || !logoId || !timestamp) {
  return NextResponse.json(
    { error: 'Missing required fields' },
    { status: 400 }
  );
}
\`\`\``,
      'User has already voted for this logo': `To fix duplicate vote issues:
1. Clear the test user's votes first:

\`\`\`typescript
await makeRequest('/database-info', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'update',
    collectionName: 'users',
    query: { userId: testUserId },
    data: { 
      $set: { 
        votedLogos: [],
        voteCount: 0
      }
    }
  })
});
\`\`\``,
      'Failed to get token for verification test': `Check your login response:
1. Ensure login endpoint returns:

\`\`\`typescript
return NextResponse.json({
  success: true,
  accessToken: 'your-jwt-token',
  // other fields...
});
\`\`\``,
      'No Next.js server found running': `Try these steps:
1. Run \`npm run dev\` in your terminal
2. Check if port 3000 is already in use
3. Try running on a different port:
   \`PORT=3001 npm run dev\``,
    };

    // Find matching error message
    const matchingError = Object.keys(errorMap).find((key) =>
      error.toLowerCase().includes(key.toLowerCase())
    );

    return matchingError ? errorMap[matchingError] : null;
  };

  const fetchDatabaseLogs = useCallback(async () => {
    if (!baseUrl) return;
    try {
      const response = await fetch(`${baseUrl}/database-logs`);
      const data = await response.json();
      if (data.success) {
        setDatabaseLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch database logs:', error);
    }
  }, [baseUrl]);

  // Fetch logs periodically
  useEffect(() => {
    if (!baseUrl) return;

    const fetchLogs = () => {
      fetchDatabaseLogs();
    };

    fetchLogs(); // Initial fetch
    const interval = setInterval(fetchLogs, 5000); // Fetch every 5 seconds

    return () => clearInterval(interval);
  }, [baseUrl, fetchDatabaseLogs]);

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isAgentThinking) return;

    const newUserMessage: Message = {
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setUserInput('');
    setIsAgentThinking(true);

    try {
      // Get the most recent error from results if it exists
      const latestError =
        results.length > 0 ? results.find((r) => r.status === 'failure')?.error : null;

      const response = await fetch(`${baseUrl}/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          error: latestError,
          logs: databaseLogs,
        }),
      });

      const data = await response.json();

      const agentResponse: Message = {
        role: 'assistant',
        content: data.response || 'Sorry, I could not process your request.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, agentResponse]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAgentThinking(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>API Test Interface</h1>
        <p>Server: {baseUrl || 'Detecting...'}</p>
        {portError && <p className={styles.error}>{portError}</p>}
      </div>

      <div className={styles.testSelection}>
        <div className={styles.testOption}>
          <label>
            <input
              type="checkbox"
              checked={selectedTests.has('all')}
              onChange={() => handleTestSelection('all')}
            />
            All Tests
          </label>
        </div>

        <div className={styles.testGrid}>
          {allTestIds.map((testId) => (
            <div key={testId} className={styles.testOption}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedTests.has(testId) || selectedTests.has('all')}
                  onChange={() => handleTestSelection(testId)}
                  disabled={selectedTests.has('all')}
                />
                {getTestName(testId)}
              </label>
            </div>
          ))}
        </div>
      </div>

      <button
        className={styles.runButton}
        onClick={runAllTests}
        disabled={isRunning || selectedTests.size === 0}
      >
        Run Tests
      </button>

      <div className={styles.results}>
        {results.map((result) => (
          <div key={result.id} className={`${styles.resultItem} ${styles[result.status]}`}>
            <div className={styles.resultHeader} onClick={() => toggleExpand(result.id)}>
              <span>{result.name}</span>
              <span className={styles.status}>{result.status}</span>
            </div>
            {expandedTests.has(result.id) && (
              <div className={styles.resultDetails}>
                {result.error && (
                  <>
                    <div className={styles.error}>Error: {result.error}</div>
                    {result.response?.assistantAnalysis ? (
                      <div className={styles.aiAnalysis}>
                        <h4>🤖 AI Assistant Analysis:</h4>
                        <div className={styles.aiContent}>{result.response.assistantAnalysis}</div>
                      </div>
                    ) : (
                      getFixSuggestion(result.error) && (
                        <div className={styles.fixSuggestion}>
                          <h4>📝 Suggested Fix:</h4>
                          <pre>{getFixSuggestion(result.error)}</pre>
                        </div>
                      )
                    )}
                  </>
                )}
                {result.details && <div className={styles.details}>{result.details}</div>}

                {/* Database Response Section */}
                {result.response && (
                  <div className={styles.dbResponse}>
                    <div className={styles.dbResponseHeader}>
                      <h4>💾 Database Response:</h4>
                      <div className={styles.dbResponseControls}>
                        {result.response.data && (
                          <span className={styles.recordCount}>
                            {Array.isArray(result.response.data)
                              ? `${result.response.data.length} records`
                              : '1 record'}
                          </span>
                        )}
                        <a
                          href="#db-logs"
                          className={styles.dbLogsLink}
                          onClick={(e) => {
                            e.preventDefault();
                            const dbLogs = document.getElementById('db-logs');
                            if (dbLogs) {
                              dbLogs.scrollIntoView({ behavior: 'smooth' });
                              dbLogs.classList.add(styles.highlight);
                              setTimeout(() => dbLogs.classList.remove(styles.highlight), 2000);
                            }
                          }}
                        >
                          View DB Logs 📋
                        </a>
                      </div>
                    </div>
                    <div className={styles.dbResponseContent}>
                      <pre className={styles.outputContent}>
                        {JSON.stringify(
                          {
                            success: result.response.success,
                            data: result.response.data,
                            error: result.response.error,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Database Logs Section */}
                <div id="db-logs" className={styles.dbLogs}>
                  <h4>Database Logs:</h4>
                  <pre className={styles.dbLogsContent}>
                    {(result.response?.trace || []).map((log: any, index: number) => (
                      <div key={index} className={`${styles.logLine} ${styles[log.type]}`}>
                        {/* Timestamp and Type Header */}
                        <div className={styles.logHeader}>
                          <span className={styles.timestamp}>
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className={styles.logType}>{log.type.toUpperCase()}</span>
                        </div>

                        {/* Request Details */}
                        {log.type === 'request' && (
                          <div className={styles.requestInfo}>
                            <div>Method: {log.method}</div>
                            <div>URL: {log.url}</div>
                            {log.params && (
                              <div>
                                Parameters:
                                <pre>{JSON.stringify(log.params, null, 2)}</pre>
                              </div>
                            )}
                            {log.body && (
                              <div>
                                Body:
                                <pre>{JSON.stringify(log.body, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Operation Details */}
                        {log.type === 'operation' && (
                          <div className={styles.operationInfo}>
                            <div>Operation: {log.name}</div>
                            {log.params && (
                              <div>
                                Parameters:
                                <pre>{JSON.stringify(log.params, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Result Details */}
                        {log.type === 'result' && (
                          <div className={styles.resultInfo}>
                            <div>Operation: {log.operation}</div>
                            {log.recordCount !== undefined && <div>Records: {log.recordCount}</div>}
                            {log.duration && <div>Duration: {log.duration}</div>}
                            {log.success !== undefined && (
                              <div>Success: {log.success.toString()}</div>
                            )}
                            {log.voteId && <div>Vote ID: {log.voteId}</div>}
                          </div>
                        )}

                        {/* Error Details */}
                        {log.type === 'error' && (
                          <div className={styles.errorInfo}>
                            <div>Error: {log.message}</div>
                            {log.code && <div>Code: {log.code}</div>}
                            {log.invalidFields && (
                              <div>
                                Invalid Fields:
                                <pre>{JSON.stringify(log.invalidFields, null, 2)}</pre>
                              </div>
                            )}
                            {log.receivedValue && <div>Received Value: {log.receivedValue}</div>}
                            {log.stack && (
                              <div>
                                Stack:
                                <pre>{log.stack}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <section className={styles.logsSection}>
        <h2>Database Logs</h2>
        {databaseLogs.length > 0 ? (
          <div className={styles.logsList}>
            {databaseLogs.map((log, index) => (
              <div
                key={index}
                className={`${styles.logEntry} ${
                  log.success ? styles.successLog : styles.errorLog
                }`}
              >
                <span className={styles.timestamp}>{new Date(log.timestamp).toLocaleString()}</span>
                <span className={styles.operation}>{log.operation}</span>
                {log.collection && <span className={styles.collection}>{log.collection}</span>}
                <span className={styles.details}>{log.details}</span>
                {log.error && <span className={styles.error}>{log.error}</span>}
              </div>
            ))}
          </div>
        ) : (
          <p>No database logs available</p>
        )}
      </section>

      <section className={styles.agentSection}>
        <h2>AI Test Assistant</h2>
        <div className={styles.chatContainer}>
          <div className={styles.messageList}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`${styles.message} ${
                  message.role === 'user' ? styles.userMessage : styles.assistantMessage
                }`}
              >
                <div className={styles.messageContent}>{message.content}</div>
                <div className={styles.messageTimestamp}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
            {isAgentThinking && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div className={styles.thinking}>Thinking...</div>
              </div>
            )}
          </div>
          <form onSubmit={handleAgentSubmit} className={styles.inputForm}>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask the AI agent for help with testing..."
              className={styles.inputField}
              disabled={isAgentThinking}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={isAgentThinking || !userInput.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
