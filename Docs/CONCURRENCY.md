# Concurrency and Transaction Handling

This document outlines how concurrent operations and transactions are handled in the application.

## Transaction Management

### Basic Transaction Usage

```typescript
// Using transactions in API calls
POST /api/database-info/[action]
{
  collectionName: "logos",
  data: { ... },
  useTransaction: true,
  lockTimeout: 5000  // Optional timeout in milliseconds
}
```

### Nested Transactions

The application supports nested transactions with proper commit/rollback ordering:

```typescript
// Parent transaction
const parentOp = {
  collectionName: 'logos',
  data: { name: 'New Logo' },
  useTransaction: true,
};

// Child transaction
const childOp = {
  userId: 'user1',
  logoId: 'logo1',
  useTransaction: true,
};
```

- Child transactions commit before parent transactions
- Rollback propagates from child to parent

## Deadlock Prevention

### Timeout-Based Prevention

```typescript
// Using timeouts to prevent deadlocks
{
  collectionName: "logos",
  id: "logo1",
  data: { status: "updated" },
  lockTimeout: 5000  // 5 second timeout
}
```

### Ordered Operations

To prevent deadlocks, operations are ordered by resource ID:

```typescript
// Before ordering
const operations = [
  { id: 'logo2', order: 2 },
  { id: 'logo1', order: 1 },
  { id: 'logo3', order: 3 },
];

// After ordering
const sortedOps = operations.sort((a, b) => a.order - b.order);
```

## Resource Locking

### Exclusive Locks

Used for write operations:

```typescript
// Exclusive lock for updates
{
  collectionName: "logos",
  id: "logo1",
  data: { ... },
  useLock: true
}
```

### Shared Locks

Used for read operations:

```typescript
// Shared lock for reads
{
  collectionName: "logos",
  id: "logo1",
  useSharedLock: true
}
```

## Concurrent Operations

### Vote Operations

```typescript
// Concurrent vote submission
POST /api/votes
{
  userId: "user1",
  logoId: "logo1"
}
```

- Prevents duplicate votes
- Handles race conditions
- Maintains vote count integrity

### Logo Operations

```typescript
// Concurrent logo updates
POST /api/database-info/update
{
  collectionName: "logos",
  id: "logo1",
  data: { status: "updated" }
}
```

- Handles multiple simultaneous updates
- Prevents data corruption
- Maintains audit trail

## Error Handling

### Transaction Errors

```typescript
// Error response for transaction failure
{
  success: false,
  error: "Transaction failed: Vote creation failed",
  rollback: true
}
```

### Lock Timeout Errors

```typescript
// Error response for lock timeout
{
  success: false,
  error: "Operation timed out after 5000ms",
  retryable: true
}
```

### Deadlock Errors

```typescript
// Error response for deadlock detection
{
  success: false,
  error: "Deadlock detected",
  retryWith: {
    orderedResources: ["logo1", "logo2"]
  }
}
```

## Best Practices

1. **Transaction Usage**

   - Use transactions for multi-step operations
   - Keep transactions short
   - Set appropriate timeouts

2. **Deadlock Prevention**

   - Always access resources in a consistent order
   - Use timeouts to prevent indefinite waiting
   - Implement retry logic with exponential backoff

3. **Resource Locking**

   - Use shared locks for reads when possible
   - Keep exclusive locks brief
   - Implement lock timeouts

4. **Error Handling**

   - Always handle rollback scenarios
   - Implement retry logic for retryable errors
   - Log transaction failures for monitoring

5. **Performance**
   - Monitor lock contention
   - Track transaction duration
   - Optimize resource access patterns

## Monitoring and Debugging

### Transaction Metrics

```typescript
// Transaction monitoring data
{
  transactionId: "tx123",
  duration: 150,  // milliseconds
  operations: 3,
  locks: {
    acquired: 2,
    waited: 50,   // milliseconds
    timeouts: 0
  }
}
```

### Lock Monitoring

```typescript
// Lock statistics
{
  resourceId: "logo1",
  exclusiveLocks: {
    current: 1,
    waiting: 2,
    avgWaitTime: 45  // milliseconds
  },
  sharedLocks: {
    current: 3,
    waiting: 0,
    avgWaitTime: 0
  }
}
```

## Recovery Procedures

### Transaction Recovery

1. Identify incomplete transactions
2. Roll back uncommitted changes
3. Release held locks
4. Notify affected users

### Deadlock Recovery

1. Detect deadlock cycle
2. Choose victim transaction
3. Roll back and retry with ordered access
4. Log incident for analysis

## Implementation Notes

### Transaction Boundaries

- Begin transaction before first operation
- Commit only after all operations succeed
- Roll back on any operation failure
- Release locks in reverse order of acquisition

### Lock Management

- Implement lock timeout mechanism
- Use fair lock acquisition (FIFO)
- Monitor lock contention
- Implement deadlock detection

### Error Recovery

- Implement automatic retry for retryable errors
- Log all transaction failures
- Maintain audit trail of rollbacks
- Implement compensating transactions
