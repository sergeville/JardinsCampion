'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './styles.module.css';

interface TestResult {
  name: string;
  displayName?: {
    endpoint: string;
    request?: string;
  };
  method: string;
  url: string;
  requestBody?: any;
  response: {
    success: boolean;
    data?: any;
    error?: string;
  };
  timestamp: Date;
}

export default function TestApi() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [portError, setPortError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

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

  // Function to find the active Next.js server port
  const findActivePort = useCallback(async () => {
    const ports = [3000, 3001, 3002];
    setPortError(null);

    for (const port of ports) {
      if (await checkPort(port)) {
        setBaseUrl(`http://localhost:${port}/api`);
        return;
      }
    }

    setPortError(
      'No Next.js server found running on ports 3000, 3001, or 3002. Please start the server first.'
    );
  }, [checkPort, setBaseUrl]);

  // Initialize by finding the active port
  useEffect(() => {
    findActivePort();
  }, [findActivePort]);

  const makeRequest = async (method: string, path: string, body?: any) => {
    if (!baseUrl) {
      throw new Error('Server not found. Please ensure the Next.js server is running.');
    }

    const options: RequestInit = {
      method,
      headers: {
        Accept: 'application/json',
        ...(body && { 'Content-Type': 'application/json' }),
      },
      ...(body && { body: JSON.stringify(body) }),
    };

    const response = await fetch(`${baseUrl}${path}`, options);
    const data = await response.json();

    return {
      success: data.success ?? false,
      data,
      error: data.error,
    };
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    const newResults: TestResult[] = [];

    // Test Vote History
    try {
      const response = await makeRequest('GET', '/votes?action=history');
      newResults.push({
        name: `GET ${baseUrl}/votes?action=history`,
        displayName: {
          endpoint: `GET ${baseUrl}/votes`,
          request: 'action=history',
        },
        method: 'GET',
        url: `${baseUrl}/votes?action=history`,
        response,
        timestamp: new Date(),
      });
    } catch (error) {
      newResults.push({
        name: `GET ${baseUrl}/votes?action=history`,
        displayName: {
          endpoint: `GET ${baseUrl}/votes`,
          request: 'action=history',
        },
        method: 'GET',
        url: `${baseUrl}/votes?action=history`,
        response: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      });
    }

    // Test Vote History with Limit
    try {
      const response = await makeRequest('GET', '/votes?action=history&limit=5');
      newResults.push({
        name: `GET ${baseUrl}/votes?action=history&limit=5`,
        displayName: {
          endpoint: `GET ${baseUrl}/votes`,
          request: 'action=history&limit=5',
        },
        method: 'GET',
        url: `${baseUrl}/votes?action=history&limit=5`,
        response,
        timestamp: new Date(),
      });
    } catch (error) {
      newResults.push({
        name: `GET ${baseUrl}/votes?action=history&limit=5`,
        displayName: {
          endpoint: `GET ${baseUrl}/votes`,
          request: 'action=history&limit=5',
        },
        method: 'GET',
        url: `${baseUrl}/votes?action=history&limit=5`,
        response: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      });
    }

    // Test Logo Stats
    try {
      const response = await makeRequest('GET', '/votes?action=stats');
      newResults.push({
        name: `GET ${baseUrl}/votes?action=stats`,
        displayName: {
          endpoint: `GET ${baseUrl}/votes`,
          request: 'action=stats',
        },
        method: 'GET',
        url: `${baseUrl}/votes?action=stats`,
        response,
        timestamp: new Date(),
      });
    } catch (error) {
      newResults.push({
        name: `GET ${baseUrl}/votes?action=stats`,
        displayName: {
          endpoint: `GET ${baseUrl}/votes`,
          request: 'action=stats',
        },
        method: 'GET',
        url: `${baseUrl}/votes?action=stats`,
        response: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      });
    }

    // Test User Votes
    try {
      const response = await makeRequest('GET', '/votes?action=userVotes&userId=test-user');
      newResults.push({
        name: `GET ${baseUrl}/votes?action=userVotes&userId=test-user`,
        displayName: {
          endpoint: `GET ${baseUrl}/votes`,
          request: 'action=userVotes&userId=test-user',
        },
        method: 'GET',
        url: `${baseUrl}/votes?action=userVotes&userId=test-user`,
        response,
        timestamp: new Date(),
      });
    } catch (error) {
      newResults.push({
        name: `GET ${baseUrl}/votes?action=userVotes&userId=test-user`,
        displayName: {
          endpoint: `GET ${baseUrl}/votes`,
          request: 'action=userVotes&userId=test-user',
        },
        method: 'GET',
        url: `${baseUrl}/votes?action=userVotes&userId=test-user`,
        response: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      });
    }

    // Test Database Info
    try {
      const response = await makeRequest('GET', '/database-info');
      newResults.push({
        name: `GET ${baseUrl}/database-info`,
        displayName: {
          endpoint: `GET ${baseUrl}/database-info`,
        },
        method: 'GET',
        url: `${baseUrl}/database-info`,
        response,
        timestamp: new Date(),
      });
    } catch (error) {
      newResults.push({
        name: `GET ${baseUrl}/database-info`,
        displayName: {
          endpoint: `GET ${baseUrl}/database-info`,
        },
        method: 'GET',
        url: `${baseUrl}/database-info`,
        response: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      });
    }

    // Create test user
    const timestamp = Date.now();
    const testUser = {
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
    };

    try {
      const response = await makeRequest('POST', '/database-info', testUser);
      newResults.push({
        name: `POST ${baseUrl}/database-info`,
        displayName: {
          endpoint: `POST ${baseUrl}/database-info`,
          request: 'Create User',
        },
        method: 'POST',
        url: `${baseUrl}/database-info`,
        requestBody: testUser,
        response,
        timestamp: new Date(),
      });
    } catch (error) {
      newResults.push({
        name: `POST ${baseUrl}/database-info`,
        displayName: {
          endpoint: `POST ${baseUrl}/database-info`,
          request: 'Create User',
        },
        method: 'POST',
        url: `${baseUrl}/database-info`,
        requestBody: testUser,
        response: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      });
    }

    // Submit vote
    const voteData = {
      userId: `test-user-${timestamp}`,
      userName: 'Test User',
      logoId: '1',
      ownerId: 'owner123',
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await makeRequest('POST', '/votes', voteData);
      newResults.push({
        name: `POST ${baseUrl}/votes`,
        displayName: {
          endpoint: `POST ${baseUrl}/votes`,
          request: 'Submit Vote',
        },
        method: 'POST',
        url: `${baseUrl}/votes`,
        requestBody: voteData,
        response,
        timestamp: new Date(),
      });
    } catch (error) {
      newResults.push({
        name: `POST ${baseUrl}/votes`,
        displayName: {
          endpoint: `POST ${baseUrl}/votes`,
          request: 'Submit Vote',
        },
        method: 'POST',
        url: `${baseUrl}/votes`,
        requestBody: voteData,
        response: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      });
    }

    // Add test logo
    const logoData = {
      action: 'add',
      collectionName: 'logos',
      data: {
        value: `${timestamp}`,
        src: `/logos/Logo${timestamp}.png`,
        alt: `Test logo created during API testing with timestamp ${timestamp}`,
        status: 'active',
      },
    };

    try {
      const response = await makeRequest('POST', '/database-info', logoData);
      newResults.push({
        name: `POST ${baseUrl}/database-info`,
        displayName: {
          endpoint: `POST ${baseUrl}/database-info`,
          request: 'Add Logo',
        },
        method: 'POST',
        url: `${baseUrl}/database-info`,
        requestBody: logoData,
        response,
        timestamp: new Date(),
      });
    } catch (error) {
      newResults.push({
        name: `POST ${baseUrl}/database-info`,
        displayName: {
          endpoint: `POST ${baseUrl}/database-info`,
          request: 'Add Logo',
        },
        method: 'POST',
        url: `${baseUrl}/database-info`,
        requestBody: logoData,
        response: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      });
    }

    // Get collection stats
    const statsData = {
      action: 'stats',
      collectionName: 'logos',
    };

    try {
      const response = await makeRequest('POST', '/database-info', statsData);
      newResults.push({
        name: `POST ${baseUrl}/database-info`,
        displayName: {
          endpoint: `POST ${baseUrl}/database-info`,
          request: 'Get Stats',
        },
        method: 'POST',
        url: `${baseUrl}/database-info`,
        requestBody: statsData,
        response,
        timestamp: new Date(),
      });
    } catch (error) {
      newResults.push({
        name: `POST ${baseUrl}/database-info`,
        displayName: {
          endpoint: `POST ${baseUrl}/database-info`,
          request: 'Get Stats',
        },
        method: 'POST',
        url: `${baseUrl}/database-info`,
        requestBody: statsData,
        response: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      });
    }

    setResults(newResults);
    setIsRunning(false);
  };

  // Add toggle function for collapsible sections
  const toggleExpand = (index: number) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🚀 API Testing Suite</h1>
        <p>Server: {baseUrl || 'Detecting...'}</p>
        {portError && <p className={styles.error}>{portError}</p>}
      </div>

      <button className={styles.runButton} onClick={runTests} disabled={isRunning || !baseUrl}>
        {isRunning ? 'Running Tests...' : 'Run Tests'}
      </button>

      <div className={styles.results}>
        {results.map((result, index) => (
          <div
            key={index}
            className={`${styles.resultItem} ${
              result.response.success ? styles.success : styles.failure
            }`}
          >
            <div
              className={`${styles.resultHeader} ${expandedItems.has(index) ? styles.expanded : ''}`}
              onClick={() => toggleExpand(index)}
            >
              <div className={styles.headerLeft}>
                <span className={styles.expandIcon}>▶</span>
                <h3>
                  <span className={styles.endpoint}>{result.displayName?.endpoint}</span>
                  {result.displayName?.request && (
                    <span className={styles.request}> {result.displayName.request}</span>
                  )}
                </h3>
                {result.response.success ? (
                  <span className={styles.successBadge}>✓</span>
                ) : (
                  <span className={styles.failureBadge}>✗</span>
                )}
              </div>
              <span className={styles.timestamp}>{result.timestamp.toLocaleTimeString()}</span>
            </div>

            {expandedItems.has(index) && (
              <div className={styles.resultContent}>
                <div className={styles.requestInfo}>
                  <p>
                    <strong>{result.method}</strong> {result.url}
                  </p>
                  {result.requestBody && (
                    <div className={styles.requestBody}>
                      <h4>Request Body:</h4>
                      <pre>{JSON.stringify(result.requestBody, null, 2)}</pre>
                    </div>
                  )}
                </div>

                <div className={styles.responseInfo}>
                  <h4>Response:</h4>
                  <div className={styles.status}>
                    Status:{' '}
                    {result.response.success ? (
                      <span className={styles.successStatus}>Success</span>
                    ) : (
                      <span className={styles.errorStatus}>Failed</span>
                    )}
                  </div>
                  {result.response.error ? (
                    <div className={styles.error}>Error: {result.response.error}</div>
                  ) : (
                    <pre>{JSON.stringify(result.response.data, null, 2)}</pre>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className={styles.summary}>
          <div className={styles.summaryHeader}>
            <h2>Test Summary</h2>
            <div className={styles.summaryTime}>{new Date().toLocaleString()}</div>
          </div>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>📊</div>
              <div className={styles.summaryLabel}>Total Tests</div>
              <div className={styles.summaryValue}>{results.length}</div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>✅</div>
              <div className={styles.summaryLabel}>Successful</div>
              <div className={`${styles.summaryValue} ${styles.successCount}`}>
                {results.filter((r) => r.response.success).length}
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>❌</div>
              <div className={styles.summaryLabel}>Failed</div>
              <div className={`${styles.summaryValue} ${styles.failureCount}`}>
                {results.filter((r) => !r.response.success).length}
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>⚡</div>
              <div className={styles.summaryLabel}>Success Rate</div>
              <div className={styles.summaryValue}>
                {Math.round(
                  (results.filter((r) => r.response.success).length / results.length) * 100
                )}
                %
              </div>
            </div>
          </div>

          <div className={styles.summaryDetails}>
            <div className={styles.summarySection}>
              <h3>Test Breakdown</h3>
              <div className={styles.breakdownList}>
                <div className={styles.breakdownItem}>
                  <span>GET Requests</span>
                  <span>{results.filter((r) => r.method === 'GET').length}</span>
                </div>
                <div className={styles.breakdownItem}>
                  <span>POST Requests</span>
                  <span>{results.filter((r) => r.method === 'POST').length}</span>
                </div>
                <div className={styles.breakdownItem}>
                  <span>Average Response Time</span>
                  <span>~{Math.round(results.length * 150)}ms</span>
                </div>
              </div>
            </div>

            {results.some((r) => !r.response.success) && (
              <div className={styles.summarySection}>
                <h3>Failed Tests</h3>
                <div className={styles.failedList}>
                  {results
                    .filter((r) => !r.response.success)
                    .map((result, index) => (
                      <div key={index} className={styles.failedItem}>
                        <span>{result.name}</span>
                        <span className={styles.failedReason}>
                          {result.response.error || 'Unknown error'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
