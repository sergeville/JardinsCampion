# Performance Debugging Guide

This guide explains how to interpret the debugging output and performance metrics in the application.

## Types of Timing Information

### 1. Database Connection Timing

```typescript
total-connection-time: 1234ms        // Total time to establish MongoDB connection
connection-operation: 567ms          // Time for the actual connection operation
close-existing-connection: 123ms     // Time to close any existing connection
mongoose-connect: 345ms              // Time for mongoose to connect
```

#### Interpretation Guidelines:

- `total-connection-time` > 5000ms: Connection is slow, might indicate network issues
- `close-existing-connection` > 1000ms: Might have hanging connections
- `mongoose-connect` > 2000ms: MongoDB might be overloaded or network latency issues

### 2. API Request Timing

```typescript
total-request-time: 2345ms          // Total API request processing time
model-initialization: 789ms          // Time to initialize MongoDB models
initial-state-fetch: 456ms          // Time to fetch initial database state
change-streams-setup: 234ms         // Time to set up change streams
```

#### Interpretation Guidelines:

- `total-request-time` should be < 3000ms for good performance
- `model-initialization` > 1000ms might indicate schema issues
- `initial-state-fetch` > 1000ms suggests need for query optimization
- `change-streams-setup` > 500ms might indicate replication lag

### 3. State Fetch Performance

```typescript
State fetch performance: {
  timestamp: "2024-02-15T14:33:06.054Z",
  fetchTimeNs: 123456789,           // Time in nanoseconds
  counts: {
    users: 10,
    votes: 100,
    logos: 5
  }
}
```

#### Interpretation Guidelines:

- `fetchTimeNs` > 1e9 (1 second): Query optimization needed
- Large discrepancy between collection counts might indicate data issues
- Monitor growth patterns in collection sizes

### 4. Change Stream Processing

```typescript
Change in users: {
  timestamp: "2024-02-15T14:33:06.054Z",
  operationType: "insert",
  timeSinceRequestStart: [10, 123456789]  // [seconds, nanoseconds]
}

Processing metrics:
change-state-update: 345ms
processingTimeNs: 456789123
```

#### Interpretation Guidelines:

- `change-state-update` > 500ms: Might need optimization
- High `timeSinceRequestStart` values indicate long-running connections
- Watch for increasing `processingTimeNs` as data grows

### 5. Error States

```typescript
MongoDB connection error: {
  error: Error,
  timestamp: "2024-02-15T14:33:06.054Z",
  connectionState: {
    readyState: 0,                  // 0=disconnected, 1=connected, 2=connecting
    models: ["User", "Vote", "Logo"]
  }
}

Setup failed: {
  error: Error,
  setupTimeNs: 123456789,
  connectionState: 0
}
```

#### Connection States:

- 0: disconnected
- 1: connected
- 2: connecting
- 3: disconnecting

## How to Test and Analyze

1. **Start MongoDB Containers**

```bash
docker-compose up -d
```

2. **Start Development Server**

```bash
npm run dev
```

3. **Test Database Sync Endpoint**

```bash
curl -N http://localhost:3001/api/database-sync
```

4. **Monitor Console Output**
   Watch for:

- Connection times exceeding 5 seconds
- State fetch times exceeding 1 second
- Large time gaps between operations
- Error states and retry patterns
- Connection state transitions

## Common Bottlenecks

1. **Slow Initial Connection**

   - Symptom: High `total-connection-time`
   - Possible causes:
     - Network latency
     - DNS resolution issues
     - MongoDB server load
     - Authentication delays

2. **Slow Model Initialization**

   - Symptom: High `model-initialization` time
   - Possible causes:
     - Complex schema validation
     - Many indexes
     - Large number of models

3. **Slow State Fetches**

   - Symptom: High `fetchTimeNs`
   - Possible causes:
     - Missing indexes
     - Large documents
     - Complex queries
     - Network bandwidth

4. **Change Stream Processing Delays**
   - Symptom: High `processingTimeNs`
   - Possible causes:
     - Heavy load on MongoDB
     - Network congestion
     - Complex change operations
     - Large number of concurrent changes

## Performance Optimization Tips

1. **Database Connection**

   - Use connection pooling
   - Implement proper retry strategies
   - Monitor connection pool metrics
   - Use appropriate timeouts

2. **Query Optimization**

   - Create proper indexes
   - Use projection to limit fields
   - Implement pagination
   - Use lean queries when possible

3. **Change Streams**

   - Use appropriate resume tokens
   - Implement proper error handling
   - Monitor oplog size and usage
   - Use filters to reduce unnecessary processing

4. **Resource Management**
   - Implement proper connection cleanup
   - Monitor memory usage
   - Use appropriate batch sizes
   - Implement rate limiting when needed

## Monitoring Best Practices

1. **Regular Metrics Collection**

   - Track timing trends over time
   - Set up alerts for abnormal patterns
   - Monitor resource utilization
   - Track error rates and types

2. **Performance Baselines**

   - Establish normal performance ranges
   - Document expected timing values
   - Track performance impact of changes
   - Monitor scaling behavior

3. **Troubleshooting Process**
   - Collect all relevant metrics
   - Analyze timing patterns
   - Check system resources
   - Review recent changes
   - Test in isolation when possible
