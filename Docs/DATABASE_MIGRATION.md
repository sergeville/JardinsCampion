# Database Migration Guide

This document explains how to use the database migration and seeding tools for the Jardins Campion application.

## Overview

The database migration tools consist of two main scripts:

1. `seedLogos.js` - For populating the database with test data
2. `migrate.js` - For performing the database schema migration

## Prerequisites

- Node.js installed
- MongoDB running (via Docker or locally)
- Proper environment variables set in `.env.local`

## Database Seeding

### Purpose

The seeding script (`src/scripts/seedLogos.js`) populates the database with sample data for testing purposes.

### Usage

```bash
NODE_ENV=development node src/scripts/seedLogos.js
```

### Sample Data

The script creates:

- 3 sample logos with different properties
- 3 sample votes with different statuses

Example logo:

```javascript
{
  id: 'logo1',
  alt: 'A beautiful garden with colorful flowers',
  src: '/logos/garden1.jpg',
  ownerId: 'user1',
  status: 'active',
  contentType: 'image/jpeg'
}
```

Example vote:

```javascript
{
  userId: 'user1',
  logoId: 'logo2',
  status: 'confirmed'
}
```

## Database Migration

### Purpose

The migration script (`src/scripts/migrate.js`) updates the database schema by:

1. Removing deprecated fields from Vote documents
2. Removing deprecated fields from Logo documents
3. Validating the migration results
4. Verifying vote counts

### Usage

```bash
NODE_ENV=development node src/scripts/migrate.js
```

### What Gets Migrated

#### Vote Collection Changes

Removes the following fields:

- `ownerId`
- `version`
- `updatedAt`
- `userName`
- `__v`

Simplifies the status field to only allow:

- `confirmed`
- `rejected`

#### Logo Collection Changes

Removes the following fields:

- `voteStats`
- `uploadedAt`
- `updatedAt`

### Validation Process

The migration includes several validation steps:

1. **Document Structure Validation**

   ```javascript
   // Checks for any documents with invalid/deprecated fields
   const invalidVotes = await Vote.find({
     $or: [
       { ownerId: { $exists: true } },
       { version: { $exists: true } },
       // ... other checks
     ],
   });
   ```

2. **Vote Count Verification**
   ```javascript
   // Verifies the number of confirmed votes for each logo
   const stats = await Vote.aggregate([
     { $match: { logoId: logo.id, status: 'confirmed' } },
     {
       $group: {
         _id: '$logoId',
         voteCount: { $sum: 1 },
       },
     },
   ]);
   ```

### Example Output

Successful migration:

```
Starting migration...
Environment: development
MongoDB URI: mongodb://<credentials>@localhost:27019/jardins-campion?authSource=admin
Connected to MongoDB
Updating Vote documents...
Updated 3 vote documents
Updating Logo documents...
Updated 3 logo documents
Running validation...
Validation results: {
  invalidVotes: 0,
  invalidLogos: 0,
  invalidVoteIds: [],
  invalidLogoIds: []
}
Verifying vote counts...
Logo logo1 has 1 confirmed votes
Logo logo2 has 1 confirmed votes
Logo logo3 has 0 confirmed votes
Found 0 vote count mismatches
Migration completed successfully!
```

### Error Handling

The scripts include comprehensive error handling:

- Connection errors
- Validation failures
- Migration failures
- Unhandled rejections and exceptions

Example error handling:

```javascript
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  mongoose.disconnect().then(() => process.exit(1));
});
```

## Troubleshooting

1. **Connection Issues**

   - Verify MongoDB is running
   - Check credentials in `.env.local`
   - Ensure correct port (27019 for Docker)

2. **Migration Validation Failures**

   - Check the validation results for specific invalid documents
   - Review mismatch details for vote count discrepancies
   - Manually inspect problematic documents using MongoDB compass

3. **Schema Errors**
   - Ensure all required fields are present in sample data
   - Verify field types match schema definitions
   - Check enum values are valid

## Best Practices

1. **Before Migration**

   - Create a database backup
   - Run in development environment first
   - Verify all tests pass

2. **During Migration**

   - Monitor the logs for any warnings
   - Check validation results carefully
   - Verify vote counts match expectations

3. **After Migration**
   - Verify application functionality
   - Check database indexes
   - Monitor application performance

## Recovery

If migration fails:

1. Stop the migration process
2. Review error messages
3. Restore from backup if necessary
4. Fix any identified issues
5. Retry the migration
