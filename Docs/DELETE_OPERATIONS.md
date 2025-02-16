# Delete Operations Documentation

This document outlines the various delete operations supported by the API and their usage.

## Basic Delete Operation

```typescript
// Simple delete by ID
POST / api / database -
  info /
    delete {
      collectionName: 'users',
      id: 'user-id',
    };
```

## Advanced Delete Operations

### Cascading Delete

Deletes a record and its related data:

```typescript
POST / api / database -
  info /
    delete {
      collectionName: 'users',
      id: 'user-id',
      cascade: true,
    };
```

- Automatically removes related records (e.g., user's votes)
- Includes rollback mechanism if deletion fails

### Batch Delete

Delete multiple records at once:

```typescript
POST /api/database-info/delete-batch
{
  "collectionName": "users",
  "ids": ["id1", "id2", "id3"]
}
```

### Soft Delete

Mark records as deleted without removing them:

```typescript
POST / api / database -
  info /
    delete {
      collectionName: 'users',
      id: 'user-id',
      softDelete: true,
    };
```

- Adds `deleted: true` and `deletedAt` timestamp
- Records remain in database but are filtered from queries

### Conditional Delete

Delete records matching specific conditions:

```typescript
POST /api/database-info/delete-conditional
{
  "collectionName": "users",
  "conditions": {
    "lastLoginDate": { "$lt": "2023-01-01" },
    "status": "inactive"
  }
}
```

### Delete with Archiving

Archive records before deletion:

```typescript
POST / api / database -
  info /
    delete {
      collectionName: 'users',
      id: 'user-id',
      archive: true,
    };
```

- Creates a copy in the archive collection
- Adds `archivedAt` timestamp
- Original record is then deleted

### Delete with Validation

Delete with pre-deletion validation:

```typescript
POST / api / database -
  info /
    delete {
      collectionName: 'users',
      id: 'user-id',
      validate: true,
    };
```

- Checks for dependencies before deletion
- Prevents deletion if validation fails

## Error Handling

All delete operations include:

- Validation of required fields
- Error handling with descriptive messages
- Rollback mechanisms for cascading operations
- Transaction support for atomic operations

### Common Error Responses

```typescript
// Missing ID
{
  "success": false,
  "error": "ID is required for deletion"
}

// Invalid Collection
{
  "success": false,
  "error": "Invalid collection name"
}

// Item Not Found
{
  "success": false,
  "error": "Item not found"
}

// Validation Error
{
  "success": false,
  "error": "Cannot delete user with active votes"
}

// Rollback Error
{
  "success": false,
  "error": "Delete operation failed and was rolled back"
}
```

## Best Practices

1. Always use soft delete for important data
2. Implement archiving for regulatory compliance
3. Use cascading delete with caution
4. Include validation for data integrity
5. Implement proper error handling
6. Use batch operations for better performance
7. Monitor deletion operations for audit purposes
