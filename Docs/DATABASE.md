# Database Documentation

## Overview

The application uses MongoDB for data persistence, with separate databases for development and production environments. The setup uses Docker for easy deployment and management.

## Database Setup

### Prerequisites

- Docker
- Docker Compose

### Starting the Databases

1. Start both development and production databases:

```bash
docker-compose up -d
```

2. Verify the containers are running:

```bash
docker ps | grep jardins-campion-db
```

### Database Configurations

#### Development Database

- Host: localhost
- Port: 27019
- Username: admin
- Password: devpassword
- Database: jardins-campion-dev
- Connection String:

```
mongodb://admin:devpassword@localhost:27019/jardins-campion-dev?authSource=admin
```

#### Production Database

- Host: localhost
- Port: 27020
- Username: admin
- Password: prodpassword
- Database: jardins-campion-prod
- Connection String:

```
mongodb://admin:prodpassword@localhost:27020/jardins-campion-prod?authSource=admin
```

## Environment Configuration

Create a `.env.local` file in the project root with the following content:

```env
# Development Database
MONGODB_URI_DEV=mongodb://admin:devpassword@localhost:27019/jardins-campion-dev?authSource=admin

# Production Database
MONGODB_URI_PROD=mongodb://admin:prodpassword@localhost:27020/jardins-campion-prod?authSource=admin

# Current Environment
NODE_ENV=development
```

## Database Management

### Docker Commands

- Start containers:

```bash
docker-compose up -d
```

- Stop containers:

```bash
docker-compose down
```

- View logs:

```bash
docker-compose logs
```

- Restart containers:

```bash
docker-compose restart
```

### Data Persistence

Data is persisted using Docker volumes:

- Development data: `mongodb-dev-data`
- Production data: `mongodb-prod-data`

These volumes ensure your data survives container restarts.

## Database Schema

### Users Collection

```javascript
{
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: /^[a-z0-9-]+$/
  },
  lastVoteAt: {
    type: Date,
    default: null
  },
  voteCount: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: Date,
  updatedAt: Date
}

// Indexes:
// - lastVoteAt: 1
```

### Votes Collection

```javascript
{
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  logoId: {
    type: String,
    required: true,
    ref: 'Logo'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  ownerId: {
    type: String,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending'
  },
  version: {
    type: Number,
    default: 1
  },
  conflictResolution: {
    originalVote: {
      type: String,
      ref: 'Vote'
    },
    resolutionType: {
      type: String,
      enum: ['override', 'merge', 'reject']
    },
    resolvedAt: Date
  }
}

// Indexes:
// - { userId: 1, logoId: 1 } (unique)
// - timestamp: -1
// - status: 1
```

### Logos Collection

```javascript
{
  value: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  src: {
    type: String,
    required: true,
    validate: /^\/logos\/.*\.(png|jpg|jpeg|svg)$/i
  },
  alt: {
    type: String,
    required: true,
    trim: true,
    minlength: 10
  },
  ownerId: {
    type: String,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  voteStats: {
    totalVotes: {
      type: Number,
      default: 0,
      min: 0
    },
    uniqueVoters: {
      type: Number,
      default: 0,
      min: 0
    },
    lastVoteAt: {
      type: Date,
      default: null
    }
  },
  createdAt: Date,
  updatedAt: Date
}

// Indexes:
// - status: 1
// - ownerId: 1
```

## Data Validation

### User Validation

- Name must be 2-50 characters long
- UserId must contain only lowercase letters, numbers, and hyphens
- Vote count cannot be negative

### Vote Validation

- Referenced user must exist
- Referenced logo must exist
- Automatic conflict resolution for concurrent votes
- Vote status transitions: pending → confirmed/rejected

### Logo Validation

- Logo URL must follow correct format
- Alt text must be at least 10 characters
- Vote statistics are automatically updated
- Status can only be 'active' or 'inactive'

## Relationships

1. **User → Votes**: One-to-Many

   - A user can have multiple votes
   - Each vote references its user via `userId`

2. **Logo → Votes**: One-to-Many

   - A logo can have multiple votes
   - Each vote references its logo via `logoId`

3. **User → Logos**: One-to-Many
   - A user can own multiple logos
   - Each logo references its owner via `ownerId`

## Data Consistency

The application maintains data consistency through:

1. **Optimistic Concurrency Control**

   - All collections use version keys
   - Prevents conflicting updates

2. **Automatic Updates**

   - Vote counts are automatically maintained
   - Logo statistics are updated on vote changes
   - User vote history is tracked

3. **Conflict Resolution**

   - Automatic handling of concurrent votes
   - Support for vote overrides and merges
   - Timestamp-based resolution

4. **Data Validation**
   - Schema-level validations
   - Reference integrity checks
   - Business rule enforcement

## Security Considerations

1. Authentication is enabled by default
2. Separate credentials for development and production
3. Data is persisted in Docker volumes
4. Network isolation using Docker network
5. Different ports for development and production to prevent conflicts

## Backup and Restore

### Backup Database

```bash
docker exec jardins-campion-db-prod mongodump --uri="mongodb://admin:prodpassword@localhost:27017/jardins-campion-prod?authSource=admin" --out=/data/backup/
```

### Restore Database

```bash
docker exec jardins-campion-db-prod mongorestore --uri="mongodb://admin:prodpassword@localhost:27017/jardins-campion-prod?authSource=admin" /data/backup/
```

## Troubleshooting

1. **Cannot connect to database**

   - Verify containers are running: `docker ps`
   - Check logs: `docker-compose logs`
   - Ensure correct ports are available

2. **Authentication failed**

   - Verify credentials in `.env.local`
   - Check database users are properly set up
   - Ensure authSource is set to 'admin'

3. **Data not persisting**
   - Check Docker volumes: `docker volume ls`
   - Verify volume mounts in docker-compose.yml
   - Check container logs for write permission issues

## Database Management Interface

The application provides a comprehensive web interface for managing database content at `/show-data`.

### Features

#### Data Viewing

- Real-time data monitoring
- Auto-refresh with configurable intervals
- Text-based filtering across all collections
- Schema visualization
- Collection statistics

#### Data Manipulation

- Create new records in any collection
- Edit existing records with form interface
- Delete records with confirmation
- Batch export to JSON/CSV

### Usage

#### Adding Records

1. Navigate to the Collections tab
2. Click "Add New" above the desired collection
3. Fill in the form fields:
   - Text fields for strings
   - Number inputs for numeric values
   - Checkboxes for booleans
   - JSON editors for complex objects
4. Click "Save" to create the record

#### Editing Records

1. Locate the record in the collection table
2. Click the "Edit" button (appears on hover)
3. Modify fields in the edit modal
4. Click "Save" to update

#### Deleting Records

1. Open the edit modal for the record
2. Click the "Delete" button
3. Confirm the deletion in the prompt

#### Data Export

1. Use the export controls in the top bar
2. Choose format:
   - JSON: Complete database snapshot
   - CSV: Spreadsheet-friendly format
3. Files include timestamps for versioning

### Data Types

The interface supports all MongoDB data types:

#### Simple Types

- Strings: Text input fields
- Numbers: Numeric input fields
- Booleans: Checkbox inputs
- Dates: Date picker inputs

#### Complex Types

- Objects: JSON editor with validation
- Arrays: JSON editor with array support
- References: ID fields with validation
- Custom types: Specialized input handling

### Validation

#### Client-side Validation

- Required field checking
- Type validation
- JSON syntax validation
- Reference integrity checks

#### Server-side Validation

- Schema validation
- Data type verification
- Reference validation
- Business rule enforcement

### Security

#### Access Control

- Authentication required
- Operation logging
- Validation at all levels
- Confirmation for destructive actions

#### Data Protection

- Input sanitization
- JSON validation
- Error handling
- Atomic operations

### Best Practices

1. **Adding Records**

   - Verify required fields
   - Use correct data types
   - Validate complex objects
   - Check references

2. **Editing Records**

   - Preserve existing IDs
   - Maintain data integrity
   - Validate changes
   - Check dependencies

3. **Deleting Records**

   - Verify dependencies
   - Check for references
   - Confirm deletions
   - Consider soft deletes

4. **Exporting Data**
   - Regular exports
   - Version control
   - Backup strategy
   - Data verification

### Troubleshooting

#### Common Issues

1. **Invalid JSON**

   - Check syntax in complex objects
   - Verify object structure
   - Use JSON validator

2. **Reference Errors**

   - Verify ID exists
   - Check reference format
   - Validate relationships

3. **Validation Failures**

   - Check required fields
   - Verify data types
   - Review business rules

4. **Update Failures**
   - Check permissions
   - Verify record exists
   - Review change log

#### Error Messages

Common error messages and solutions:

```
Invalid collection name
- Verify collection exists
- Check spelling
- Review permissions

ID is required for update
- Ensure _id field exists
- Check ID format
- Verify record exists

Failed to save data
- Check validation rules
- Verify data types
- Review error details

Item not found
- Verify ID exists
- Check collection
- Review filters
```

### Performance Considerations

1. **Large Collections**

   - Use filters effectively
   - Limit result sets
   - Optimize queries

2. **Complex Objects**

   - Minimize nesting
   - Use appropriate types
   - Consider indexing

3. **Real-time Updates**

   - Adjust refresh interval
   - Use manual refresh
   - Filter unnecessary data

4. **Exports**
   - Schedule large exports
   - Use appropriate format
   - Consider pagination
