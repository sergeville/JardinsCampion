# Logo Auto-Increment ID Implementation

## Overview
The system implements an auto-incrementing ID mechanism for logos using MongoDB. This ensures each logo gets a unique, sequential numeric ID when created.

## Implementation Details

### 1. Counter Collection
The system uses a dedicated collection to track the sequence of IDs.

```typescript
// src/models/Counter.ts
interface ICounter {
  _id: string;    // Identifier for the counter (e.g., 'logoId')
  seq: number;    // Current sequence number
}
```

### 2. Logo Model Pre-Save Middleware
When a new logo is created, a pre-save middleware automatically assigns the next ID:

```typescript
// src/models/Logo.ts
logoSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const counter = await CounterModel.findByIdAndUpdate(
        'logoId',
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );
      this.id = counter.seq.toString();
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});
```

## How It Works

1. **Counter Initialization**
   - On first logo creation, the counter is automatically created with `seq: 1`
   - The `upsert: true` option ensures the counter is created if it doesn't exist

2. **ID Assignment Process**
   - When a new logo is uploaded, the pre-save middleware checks if it's a new document
   - The counter is atomically incremented using `$inc`
   - The new sequence number is assigned as the logo's ID

3. **Atomic Operations**
   - Uses MongoDB's atomic `findByIdAndUpdate` operation
   - Ensures no duplicate IDs even with concurrent uploads
   - The `new: true` option returns the updated counter value

## Database Collections

### Counter Collection
```javascript
{
  _id: "logoId",
  seq: 1          // Increments with each new logo
}
```

### Logo Collection
```javascript
{
  id: "1",        // Auto-assigned sequential ID
  alt: "...",
  src: "...",
  ownerId: "...",
  status: "active",
  contentType: "image/png",
  createdAt: ISODate("...")
}
```

## API Integration

The logo upload API (`/api/logos`) automatically handles ID assignment:

```typescript
// Create new logo document
const logo = new LogoModel({
  src,
  alt,
  ownerId,
  status: 'active',
  contentType: file.type,
  data: base64String,
});

// ID is automatically assigned during save
await logo.save();
```

## Benefits

1. **Sequential IDs**
   - Easy to read and reference
   - Natural ordering for display
   - Simple to track and manage

2. **Reliability**
   - Atomic operations prevent duplicate IDs
   - Works in distributed systems
   - Handles concurrent uploads

3. **Simplicity**
   - Automatic ID assignment
   - No manual ID management needed
   - Transparent to the application logic

## Considerations

1. **Gaps in Sequence**
   - Deleted logos leave gaps in the ID sequence
   - IDs are never reused to maintain referential integrity

2. **Performance**
   - Extra database operation per logo creation
   - Minimal impact due to low frequency of logo uploads

3. **Scalability**
   - Works well in distributed systems
   - Counter collection may become a bottleneck at very high scales
   - Current implementation suitable for expected usage patterns

## Usage Example

```typescript
// Upload a new logo
const formData = new FormData();
formData.append('file', file);
formData.append('name', name);
formData.append('alt', alt);
formData.append('ownerId', ownerId);

const response = await fetch('/api/logos', {
  method: 'POST',
  body: formData,
});

// Response includes auto-assigned ID
const { logo } = await response.json();
console.log(logo.id); // "1", "2", etc.
```

## Maintenance

The counter system is self-maintaining, but consider:

1. **Monitoring**
   - Track counter collection for any anomalies
   - Monitor for any gaps in sequence

2. **Backup**
   - Include counter collection in regular backups
   - Counter is critical for new logo creation

3. **Recovery**
   - If counter is lost, can be recreated from max existing ID
   - Recovery script example:
     ```typescript
     async function recoverCounter() {
       const maxLogo = await LogoModel.findOne({}).sort('-id');
       const maxId = maxLogo ? parseInt(maxLogo.id) : 0;
       await CounterModel.findByIdAndUpdate(
         'logoId',
         { seq: maxId },
         { upsert: true }
       );
     }
     ``` 