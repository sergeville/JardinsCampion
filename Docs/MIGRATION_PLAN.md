# Database Migration Plan

## 1. Database Backup

```bash
# Before starting migration, create a backup
mongodump --db jardins-campion --out ./backup/$(date +%Y%m%d)
```

## 2. Schema Updates

### Vote Collection Updates

```typescript
// Current Vote Schema
{
    _id: ObjectId,
    userId: string,
    logoId: string,
    timestamp: Date,
    ownerId: string,        // To be removed
    status: string,         // To be simplified
    version: number,        // To be removed
    createdAt: Date,
    updatedAt: Date,        // To be removed
    userName: string,       // To be removed
    __v: number            // To be removed
}

// Migration Query
db.votes.updateMany({}, [
    {
        $set: {
            status: {
                $cond: {
                    if: { $eq: ["$status", "confirmed"] },
                    then: "confirmed",
                    else: "rejected"
                }
            }
        }
    },
    {
        $unset: [
            "ownerId",
            "version",
            "updatedAt",
            "userName",
            "__v"
        ]
    }
]);
```

### Logo Collection Updates

```typescript
// Current Logo Schema
{
    id: string,
    alt: string,
    src: string,
    ownerId: string,
    status: string,
    voteStats: {           // To be removed
        totalVotes: number,
        uniqueVoters: number,
        lastVoteAt: Date
    },
    contentType: string,
    uploadedAt: Date,      // To be removed
    createdAt: Date,
    updatedAt: Date        // To be removed
}

// Migration Query
db.logos.updateMany({}, [
    {
        $unset: [
            "voteStats",
            "uploadedAt",
            "updatedAt"
        ]
    }
]);
```

## 3. Code Updates Required

### Model Updates

1. Update Vote Model (`src/models/Vote.ts`):

```typescript
const voteSchema = new Schema<IVote>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      ref: 'User',
    },
    logoId: {
      type: String,
      required: [true, 'Logo ID is required'],
      ref: 'Logo',
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['confirmed', 'rejected'],
      default: 'confirmed',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'vote',
  }
);
```

2. Update Logo Model (`src/models/Logo.ts`):

```typescript
const logoSchema = new Schema<ILogo>(
  {
    id: {
      type: String,
      required: [true, 'Logo ID is required'],
      unique: true,
      trim: true,
    },
    alt: {
      type: String,
      required: [true, 'Alt text is required'],
      trim: true,
      minlength: [10, 'Alt text must be at least 10 characters long'],
    },
    src: {
      type: String,
      required: [true, 'Logo source URL is required'],
      validate: {
        validator: function (v: string) {
          return /^\/logos\/.*\.(png|jpg|jpeg|svg)$/i.test(v);
        },
        message: 'Invalid logo URL format',
      },
    },
    ownerId: {
      type: String,
      required: [true, 'Owner ID is required'],
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    contentType: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'logo',
  }
);
```

### Service Updates

1. Update Vote Statistics Calculation:

```typescript
// src/lib/services/databaseService.ts
async function getLogoStats(logoId: string) {
  const stats = await VoteModel.aggregate([
    { $match: { logoId, status: 'confirmed' } },
    {
      $group: {
        _id: '$logoId',
        voteCount: { $sum: 1 },
      },
    },
  ]);

  return {
    logoId,
    voteCount: stats[0]?.voteCount || 0,
  };
}
```

2. Update Vote Submission:

```typescript
async function submitVote(voteData: { userId: string; logoId: string; timestamp: Date }) {
  const logo = await LogoModel.findById(voteData.logoId);
  if (!logo) throw new Error('Logo not found');

  if (await hasUserVoted(voteData.userId, voteData.logoId)) {
    throw new Error('User has already voted for this logo');
  }

  const vote = new VoteModel({
    userId: voteData.userId,
    logoId: voteData.logoId,
    timestamp: voteData.timestamp,
    status: 'confirmed',
  });

  return vote.save();
}
```

## 4. API Updates

1. Update Vote Response Format:

```typescript
// Before
{
  "_id": "67b1201da789250c36247c23",
  "userId": "serge-villeneuve",
  "logoId": "3",
  "timestamp": "2025-02-15T23:15:41.190Z",
  "ownerId": "user3",
  "status": "confirmed",
  "version": 1,
  "createdAt": "2025-02-15T23:15:41.235Z",
  "updatedAt": "2025-02-15T23:15:41.235Z",
  "userName": "serge-villeneuve",
  "__v": 0
}

// After
{
  "_id": "67b1201da789250c36247c23",
  "userId": "serge-villeneuve",
  "logoId": "3",
  "timestamp": "2025-02-15T23:15:41.190Z",
  "status": "confirmed",
  "createdAt": "2025-02-15T23:15:41.235Z"
}
```

2. Update Logo Stats Response:

```typescript
// Before
{
  "logoId": "67b0f923f20362b3a19b62ab",
  "voteCount": 0,
  "lastVote": null
}

// After
{
  "logoId": "67b0f923f20362b3a19b62ab",
  "voteCount": 0
}
```

## 5. Migration Verification Steps

1. Run Data Validation:

```typescript
async function validateMigration() {
  // Verify Vote documents
  const invalidVotes = await VoteModel.find({
    $or: [
      { ownerId: { $exists: true } },
      { version: { $exists: true } },
      { updatedAt: { $exists: true } },
      { userName: { $exists: true } },
      { __v: { $exists: true } },
      { status: { $nin: ['confirmed', 'rejected'] } },
    ],
  });

  // Verify Logo documents
  const invalidLogos = await LogoModel.find({
    $or: [
      { voteStats: { $exists: true } },
      { uploadedAt: { $exists: true } },
      { updatedAt: { $exists: true } },
    ],
  });

  return {
    invalidVotes: invalidVotes.length,
    invalidLogos: invalidLogos.length,
  };
}
```

2. Verify Vote Counts Match:

```typescript
async function verifyVoteCounts() {
  const logos = await LogoModel.find();

  for (const logo of logos) {
    const oldStats = logo.voteStats?.totalVotes || 0;
    const newStats = await getLogoStats(logo.id);

    if (oldStats !== newStats.voteCount) {
      console.error(`Mismatch for logo ${logo.id}: old=${oldStats}, new=${newStats.voteCount}`);
    }
  }
}
```

## 6. Rollback Plan

1. Restore from Backup:

```bash
# If migration fails, restore from backup
mongorestore --db jardins-campion ./backup/YYYYMMDD/jardins-campion
```

2. Code Rollback:

```bash
# Revert code changes
git reset --hard HEAD^
```
