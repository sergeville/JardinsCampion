# Database Data

> In HTML, <tr> cannot be a child of <div>.
> This will cause a hydration error.

## Active Database

The application at http://localhost:3000/show-data connects to:

- Development: `jardins-campion-dev` (on port 27019)
- Production: `jardins-campion-prod` (on port 27020)

The active database is determined by the `NODE_ENV` environment variable:

- If `NODE_ENV=production`: Uses `MONGODB_URI_PROD`
- If `NODE_ENV` is not set or any other value: Uses `MONGODB_URI_DEV`

```typescript
{
    id: string,              // Required, Unique, Indexed
    name: string,            // Required, 2-50 chars
    email: string,           // Required, Unique, Indexed
    userId: string,          // Required, Unique, Indexed
    lastVoteAt: Date | null, // Optional
    voteCount: number,       // Default: 0
    votedLogos: string[],    // Default: []
    createdAt: Date,
    updatedAt: Date,
    __v: number             // Version key
}
```

### Vote Collection

```typescript
{
    userId: string,          // Required, Ref: 'User'
    logoId: string,          // Required, Ref: 'Logo'
    timestamp: Date,         // Required, Default: Date.now
    status: 'confirmed' | 'rejected', // Default: 'confirmed'
    conflictResolution?: {   // Optional
        originalVote: string,
        resolutionType: 'reject',
        resolvedAt: Date
    },
    createdAt: Date
}
```

### Logo Collection

```typescript
{
    id: string,             // Required, Unique, Indexed
    alt: string,            // Required, Min 10 chars
    src: string,            // Required, Valid logo URL format
    ownerId: string,        // Required, Ref: 'User'
    status: 'active' | 'inactive', // Default: 'active', Indexed
    contentType?: string,   // Optional
    createdAt: Date
}
```

## Database Relationships Diagram

```
+---------------+       +---------------+       +---------------+
|     Users     |       |     Votes    |       |     Logos    |
+---------------+       +---------------+       +---------------+
| id*           |       | _id*         |       | id*          |
| name          |       | userId    ━━━┛       | alt          |
| email*        |       | logoId    ━━━━━━━━━━━┛ src          |
| userId*       |       | timestamp     |       | ownerId   ━━━┛
| lastVoteAt    |       | status        |       | status       |
| voteCount     |       | version       |       | contentType  |
| votedLogos[]━━┛       | createdAt     |       | createdAt    |
| createdAt     |       | updatedAt     |       +---------------+
| updatedAt     |       | userName      |
| __v           |       | __v           |       Legend:
+---------------+       +---------------+       ━━━> = Foreign Key
                                               *   = Unique Index
1 User ━━━━━━━━━━━━━━━> N Votes               [] = Array
1 User ━━━━━━━━━━━━━━━> N Logos (as owner)
1 Logo <━━━━━━━━━━━━━━ N Votes
```

## Key Features and Relationships

1. **User Management**

   - Unique identification via `id`, `email`, and `userId`
   - Tracks voting history through `votedLogos` array
   - Maintains vote count and last vote timestamp
   - Full timestamp tracking (createdAt, updatedAt)

2. **Vote System**

   - Unique compound index on `{userId, logoId}`
   - Indexed on `{logoId, status}` for efficient queries
   - Supports conflict resolution with optional metadata
   - Immutable votes (no updatedAt timestamp)
   - References both User and Logo collections

3. **Logo Management**
   - Unique identification via `id`
   - Status tracking (active/inactive)
   - Owner reference to User collection
   - Validation for image URLs
   - Creation timestamp only (no updates)

## Model Methods

### User Model

- `findByEmail(email: string)`: Finds user by email (case-insensitive)
- `findByUserId(userId: string)`: Finds user by userId
- `canVote(logoId: string)`: Checks if user can vote for a logo

### Vote Model

- `findUserVotes(userId: string)`: Gets confirmed votes for a user
- `getVoteStats(logoId: string)`: Aggregates vote statistics for a logo

### Logo Model

- `findActiveLogo(id: string)`: Finds active logo by ID

## Indexes and Performance Optimizations

1. **Users Collection**

   - Indexed fields: `id`, `email`, `userId`
   - Optimistic concurrency enabled
   - Version tracking with `__v`

2. **Vote Collection**

   - Compound unique index: `{userId, logoId}`
   - Performance index: `{logoId, status}`
   - No update tracking for better performance

3. **Logo Collection**
   - Indexed fields: `id`, `status`
   - No update tracking for better performance

## Data Validation

1. **User Model**

   - Email format validation
   - Name length constraints (2-50 chars)
   - Non-negative vote count

2. **Logo Model**

   - URL format validation for logo sources
   - Minimum alt text length (10 chars)
   - Status enum validation

3. **Vote Model**
   - Status enum validation
   - Conflict resolution type validation
   - Timestamp requirements

## Collection Settings

- Users: `collection: 'users'`
- Vote: `collection: 'vote'`
- Logo: Default collection name ('logos')

## Database and Codebase Model Relationships

### Model Mapping

1. **Database Collections to Mongoose Models**

   - `users` collection → `UserModel` (`src/models/User.ts`)
   - `vote` collection → `VoteModel` (`src/models/Vote.ts`)
   - `logos` collection → `LogoModel` (`src/models/Logo.ts`)

2. **Interface Implementations**
   ```typescript
   // Database to TypeScript Interface Mapping
   Collection 'users' → interface IUser extends Document
   Collection 'vote'  → interface IVote extends Document
   Collection 'logos' → interface ILogo extends Document
   ```

### Cross-Collection References

1. **Vote References**

   - `Vote.userId` → `User.userId` (Foreign Key)
   - `Vote.logoId` → `Logo.id` (Foreign Key)
   - `Vote.ownerId` → `User.id` (Foreign Key)

2. **Logo References**

   - `Logo.ownerId` → `User.id` (Foreign Key)

3. **User References**
   - `User.votedLogos` → Array of `Logo.id` references

### Data Flow and State Management

1. **Vote Creation Flow**

   ```
   User Collection ←→ Vote Collection ←→ Logo Collection
   (validates user)    (creates vote)     (updates stats)
   ```

2. **Logo Stats Calculation**

   ```
   Vote Collection → Logo Collection
   (aggregates votes) (updates voteCount)
   ```

3. **User Vote History**
   ```
   User Collection → Vote Collection
   (votedLogos)      (vote records)
   ```

### Model-Specific Features

1. **User Model**

   - Maintains vote history in `votedLogos` array
   - Tracks total votes through `voteCount`
   - Uses optimistic concurrency with `__v` version key

2. **Vote Model**

   - Implements immutable vote records (no updates)
   - Uses compound indexing for `{userId, logoId}`
   - Supports conflict resolution metadata

3. **Logo Model**
   - Tracks active/inactive status
   - Validates image URLs and content types
   - Supports owner reference for access control

### Database Constraints

1. **Uniqueness Constraints**

   - User: `id`, `email`, `userId`
   - Vote: Compound `{userId, logoId}`
   - Logo: `id`

2. **Referential Integrity**

   - Vote → User (userId)
   - Vote → Logo (logoId)
   - Logo → User (ownerId)

3. **Indexing Strategy**
   - Users: `id`, `email`, `userId`
   - Vote: `{userId, logoId}`, `{logoId, status}`
   - Logo: `id`, `status`

## Database Diagram (dbdiagram.io notation)

To visualize this database structure, you can copy and paste the following code into [dbdiagram.io](https://dbdiagram.io):

```dbml
// Database Markup Language (DBML) for Jardins Campion
Table users {
  id string [pk] // primary key
  name string [note: '2-50 chars']
  email string [unique, note: 'Validated format']
  userId string [unique]
  lastVoteAt datetime [note: 'Tracks last vote timestamp']
  voteCount integer [default: 0]
  votedLogos string[] [note: 'Array of voted logo IDs']
  createdAt datetime
  updatedAt datetime
  __v integer [note: 'Version key for optimistic concurrency']
}

Table votes {
  _id string [pk]
  userId string [ref: > users.userId, note: 'Foreign key to users']
  logoId string [ref: > logos.id, note: 'Foreign key to logos']
  timestamp datetime [note: 'Vote timestamp']
  ownerId string [ref: > users.id, note: 'Logo owner reference']
  status string [note: 'confirmed/rejected']
  version integer [default: 1]
  createdAt datetime
  updatedAt datetime
  userName string [note: 'Denormalized user name']
  __v integer [note: 'Version key']
}

Table logos {
  id string [pk]
  alt string [note: 'Min 10 chars']
  src string [note: 'Valid logo URL']
  ownerId string [ref: > users.id, note: 'Owner reference']
  status string [default: 'active', note: 'active/inactive']
  contentType string [note: 'Optional MIME type']
  createdAt datetime
}

// Indexes and relationships
Ref: votes.userId > users.userId [note: 'User who cast the vote']
Ref: votes.logoId > logos.id [note: 'Logo being voted on']
Ref: logos.ownerId > users.id [note: 'Logo owner']

// Composite indexes
Ref: "votes"."(userId, logoId)" [unique, note: 'Ensures one vote per user per logo']
```

This notation will generate a professional database diagram showing:

- All tables and their fields
- Primary and foreign key relationships
- Field types and constraints
- Indexes and unique constraints
- Relationships between collections (1:N)
- Notes and documentation for fields

You can view and modify the diagram by:

1. Visit [dbdiagram.io](https://dbdiagram.io)
2. Create a new diagram
3. Copy and paste the above code
4. The diagram will be automatically generated
