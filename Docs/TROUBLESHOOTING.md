# Troubleshooting Concurrent Operations

This guide helps diagnose and resolve common issues with concurrent operations and transactions.

## Common Issues

### 1. Transaction Timeouts

**Symptoms:**

- Operations fail with timeout errors
- Long-running transactions
- Increasing lock wait times

**Possible Causes:**

```typescript
// Example of problematic code
async function updateMultipleLogos() {
  const session = await mongoose.startSession();
  session.startTransaction();

  // Too many operations in one transaction
  for (let i = 0; i < 1000; i++) {
    await Logo.findByIdAndUpdate(ids[i], updates[i]);
  }

  await session.commitTransaction();
}
```

**Solutions:**

```typescript
// Better approach: Batch operations
async function updateMultipleLogos() {
  const batchSize = 50;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const session = await mongoose.startSession();
    session.startTransaction();

    await Logo.updateMany({ _id: { $in: batch } }, updates, { session });

    await session.commitTransaction();
  }
}
```

### 2. Deadlocks

**Symptoms:**

- Circular wait conditions
- Operations timing out
- Resources locked indefinitely

**Example Deadlock Scenario:**

```typescript
// User 1
async function updateLogoAndVotes1() {
  await Logo.findByIdAndUpdate('logo1', update1); // Locks logo1
  await Vote.findByIdAndUpdate('vote2', update2); // Waits for vote2
}

// User 2 (concurrent)
async function updateLogoAndVotes2() {
  await Vote.findByIdAndUpdate('vote2', update3); // Locks vote2
  await Logo.findByIdAndUpdate('logo1', update4); // Waits for logo1
}
```

**Solution:**

```typescript
// Ordered resource access
async function updateLogoAndVotes() {
  // Always access in same order: logos before votes
  await Logo.findByIdAndUpdate('logo1', update1);
  await Vote.findByIdAndUpdate('vote2', update2);
}
```

### 3. Race Conditions

**Symptoms:**

- Inconsistent data
- Lost updates
- Duplicate entries

**Example Race Condition:**

```typescript
// Problematic code
async function incrementVoteCount(logoId) {
  const logo = await Logo.findById(logoId);
  logo.voteCount += 1;
  await logo.save();
}
```

**Solution:**

```typescript
// Using atomic operations
async function incrementVoteCount(logoId) {
  await Logo.findByIdAndUpdate(logoId, { $inc: { voteCount: 1 } }, { new: true });
}
```

### 4. Asset Loading Issues

**Symptoms:**

- 404 Not Found errors for logo files
- Missing images in the UI
- Incorrect file paths

**Solutions:**

```typescript
// 1. Use proper path resolution
const logoPath = path.join(process.cwd(), 'public', 'logos', filename);

// 2. Validate file paths
function validateLogoPath(path: string): boolean {
  return /^\/logos\/.*\.(png|jpg|jpeg|svg)$/i.test(path);
}

// 3. Handle missing files gracefully
function LogoImage({ src, alt }: LogoProps) {
  const [error, setError] = useState(false);

  return error ? (
    <FallbackImage alt={alt} />
  ) : (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
    />
  );
}
```

### 5. UI State Management

**Symptoms:**

- Checkbox selection not working
- Inconsistent selection state
- Multiple selection issues

**Solutions:**

```typescript
// 1. Centralized selection state
interface SelectionState {
  selectedIds: Set<string>;
  isAllSelected: boolean;
}

const [selection, setSelection] = useState<SelectionState>({
  selectedIds: new Set(),
  isAllSelected: false,
});

// 2. Type-safe selection handlers
function handleSelect(id: string, checked: boolean) {
  setSelection((prev) => {
    const newIds = new Set(prev.selectedIds);
    if (checked) {
      newIds.add(id);
    } else {
      newIds.delete(id);
    }
    return {
      selectedIds: newIds,
      isAllSelected: newIds.size === totalItems,
    };
  });
}

// 3. Batch operations with selection
async function handleBatchDelete() {
  if (selection.selectedIds.size === 0) return;

  try {
    await withTransaction(async (session) => {
      await Logo.deleteMany({ _id: { $in: Array.from(selection.selectedIds) } }, { session });
    });

    setSelection({ selectedIds: new Set(), isAllSelected: false });
  } catch (error) {
    handleError(error);
  }
}
```

## Diagnostic Tools

### 1. Transaction Monitoring

```typescript
// Enable transaction monitoring
mongoose.set('debug', {
  transactions: true,
  lockWaits: true,
});
```

### 2. Lock Analysis

```typescript
// Query current locks
db.currentOp({
  waitingForLock: true,
  $or: [{ lockType: 'exclusive' }, { lockType: 'shared' }],
});
```

### 3. Performance Metrics

```typescript
// Monitor operation times
const startTime = Date.now();
try {
  await operation();
} finally {
  const duration = Date.now() - startTime;
  await metrics.record('operation.duration', duration);
}
```

## Recovery Steps

### 1. Stuck Transactions

```typescript
// Find and kill long-running operations
db.currentOp({
  secs_running: { $gt: 300 }, // Running > 5 minutes
  $or: [{ waitingForLock: true }, { lockType: { $exists: true } }],
}).forEach((op) => {
  db.killOp(op.opid);
});
```

### 2. Orphaned Locks

```typescript
// Release orphaned locks
async function releaseOrphanedLocks() {
  const locks = await Lock.find({
    expiresAt: { $lt: new Date() },
  });

  for (const lock of locks) {
    await lock.release();
  }
}
```

### 3. Data Inconsistency

```typescript
// Verify and fix vote counts
async function reconcileVoteCounts() {
  const logos = await Logo.find();

  for (const logo of logos) {
    const actualCount = await Vote.countDocuments({
      logoId: logo._id,
      status: 'confirmed',
    });

    if (logo.voteCount !== actualCount) {
      await Logo.findByIdAndUpdate(logo._id, {
        voteCount: actualCount,
      });
    }
  }
}
```

## Prevention Strategies

### 1. Use Optimistic Locking

```typescript
// Implement version control
schema.pre('save', function (next) {
  this.version = (this.version || 0) + 1;
  next();
});

// Check version during updates
async function updateWithVersion(id, update, version) {
  const result = await Model.findOneAndUpdate(
    { _id: id, version },
    { ...update, $inc: { version: 1 } }
  );
  if (!result) throw new Error('Version mismatch');
}
```

### 2. Implement Retry Logic

```typescript
async function withRetry(operation, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (!isRetryable(error)) throw error;
      lastError = error;
      await sleep(Math.pow(2, i) * 100); // Exponential backoff
    }
  }

  throw lastError;
}
```

### 3. Use Distributed Locks

```typescript
async function withDistributedLock(resource, operation) {
  const lock = await redisLock.acquire(resource, {
    timeout: 5000,
    retries: 3,
  });

  try {
    return await operation();
  } finally {
    await lock.release();
  }
}
```

## Monitoring Checklist

1. **Transaction Monitoring**

   - [ ] Track transaction duration
   - [ ] Monitor lock wait times
   - [ ] Log transaction failures

2. **Resource Usage**

   - [ ] Monitor connection pool
   - [ ] Track lock contention
   - [ ] Watch for long-running queries

3. **Error Patterns**
   - [ ] Track retry attempts
   - [ ] Monitor deadlock frequency
   - [ ] Log version conflicts
