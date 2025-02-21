# Jardins Campion - Database Connection and Setup Guide

### Version 1.0.0

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Database Configuration](#database-configuration)
3. [Initial Data Setup](#initial-data-setup)
4. [Running the Application](#running-the-application)
5. [MongoDB Connection Usage](#mongodb-connection-usage)
6. [Troubleshooting](#troubleshooting)

## Local Development Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v6.0 or higher)
- Git

### Installation Steps

```bash
# Clone the repository
git clone https://github.com/SergeVilleneuve/JardinsCampion.git

# Navigate to project directory
cd JardinsCampion

# Install dependencies
npm install
```

## Database Configuration

### 1. Create MongoDB Replica Set with Docker

First, create a `docker-compose.yml` file in your project root:

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:6.0
    container_name: jardins-campion-mongodb
    command: ['--replSet', 'rs0', '--bind_ip_all']
    ports:
      - '27019:27017'
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=devpassword
    networks:
      - mongodb_network

networks:
  mongodb_network:
    driver: bridge

volumes:
  mongodb_data:
```

Then run these commands:

```bash
# Start MongoDB container
docker-compose up -d

# Wait a few seconds for MongoDB to start
sleep 5

# Initialize replica set with proper hostname configuration
docker exec jardins-campion-mongodb mongosh --eval '
  config = {
    "_id": "rs0",
    "members": [
      {
        "_id": 0,
        "host": "localhost:27019",
        "priority": 1
      }
    ]
  };
  rs.initiate(config);
'

# Create admin user
docker exec jardins-campion-mongodb mongosh --eval '
  use admin;
  db.createUser({
    user: "admin",
    pwd: "devpassword",
    roles: [
      { role: "userAdminAnyDatabase", db: "admin" },
      { role: "readWriteAnyDatabase", db: "admin" }
    ]
  });
'
```

### Remote Server Communication Setup

1. **Firewall Configuration**:

```bash
# Allow incoming connections on MongoDB port
sudo ufw allow 27019/tcp
```

2. **Update MongoDB Configuration**:

   - For remote access, update your connection string in `.env.local`:

   ```env
   # For local development
   MONGODB_URI_DEV=mongodb://admin:devpassword@localhost:27019/jardins-campion-dev?authSource=admin&replicaSet=rs0&directConnection=true

   # For remote server (replace YOUR_SERVER_IP with actual IP)
   MONGODB_URI_PROD=mongodb://admin:devpassword@YOUR_SERVER_IP:27019/jardins-campion-prod?authSource=admin&replicaSet=rs0&directConnection=true
   ```

3. **Security Considerations**:

   - Use strong passwords in production
   - Set up SSL/TLS for encrypted connections
   - Configure MongoDB authentication
   - Use VPN or private network when possible

4. **Docker Network Setup**:

```bash
# Create a dedicated network for MongoDB
docker network create mongodb_network

# Connect your application container to the network
docker network connect mongodb_network your-app-container
```

5. **Testing Remote Connection**:

```bash
# Test connection from another machine
mongosh mongodb://admin:devpassword@YOUR_SERVER_IP:27019/jardins-campion-dev?authSource=admin&replicaSet=rs0
```

6. **Monitoring**:

```bash
# Monitor MongoDB logs
docker logs -f jardins-campion-mongodb

# Check container status
docker ps -a | grep mongodb

# Check network connectivity
docker network inspect mongodb_network
```

7. **Troubleshooting**:
   - Verify MongoDB is running: `docker ps`
   - Check logs: `docker logs jardins-campion-mongodb`
   - Verify network: `docker network ls`
   - Test connectivity: `telnet YOUR_SERVER_IP 27019`
   - Check firewall rules: `sudo ufw status`

### 2. Environment Setup

Create a `.env.local` file in the project root:

```env
# Database Configuration
MONGODB_URI_DEV=mongodb://admin:devpassword@localhost:27019/jardins-campion-dev?authSource=admin&replicaSet=rs0&directConnection=true

# Environment
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-development-secret-key

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Active MongoDB URI
MONGODB_URI=mongodb://admin:devpassword@localhost:27019/jardins-campion-dev?authSource=admin&replicaSet=rs0&directConnection=true
```

## Initial Data Setup

### 1. Run Database Initialization Scripts

```bash
# Run the database seeding script
npm run seed-logos

# Verify database setup
npm run check-db
```

### 2. Verify Logo Data

The seeding script should create 6 logos with proper IDs:

```javascript
[
  {
    value: '1',
    src: '/logos/Logo1.png',
    alt: 'Classic garden design logo...',
    ownerId: 'owner1',
  },
  // ... logos 2 through 6
];
```

## Running the Application

### 1. Start Development Server

```bash
# Start the development server
npm run dev
```

### 2. Access Points

- Main application: `http://localhost:3000`
- Database info: `http://localhost:3000/show-data`
- API endpoint: `http://localhost:3000/api`

## MongoDB Connection Usage

### Importing the MongoDB Connection

When using the MongoDB connection in your code, it's crucial to use named imports correctly. The MongoDB connection utilities are exported as named exports from `@/lib/mongodb`:

```typescript
// ✅ Correct way to import
import { connectDB } from '@/lib/mongodb';
import { connectDB, disconnectFromDatabase, checkDatabaseConnection } from '@/lib/mongodb';

// ❌ Incorrect ways (will cause build errors)
import connectDB from '@/lib/mongodb';
import * as mongodb from '@/lib/mongodb';
```

### Available Database Utilities

The MongoDB connection module exports the following named functions:

- `connectDB`: Main connection function that handles connection caching and retries
- `disconnectFromDatabase`: Safely closes the database connection
- `checkDatabaseConnection`: Verifies the current connection status
- `withRetry`: Utility for retrying database operations with exponential backoff

### Example Usage in API Routes

```typescript
import { connectDB } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Connect to the database
    await connectDB();

    // Your database operations here
    const result = await YourModel.find();

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Database operation failed:', error);
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 });
  }
}
```

### Best Practices

1. **Always use named imports**:

   - Use `import { connectDB }` instead of default imports
   - Import only the functions you need

2. **Connection Management**:

   - Let `connectDB` handle connection caching
   - Don't create multiple connections manually
   - Use `disconnectFromDatabase` for cleanup in tests

3. **Error Handling**:

   - Always wrap database operations in try-catch blocks
   - Use the `withRetry` utility for operations that may fail
   - Log errors appropriately before responding to clients

4. **Testing**:
   - Mock database connections in tests
   - Clean up connections after tests
   - Use test database URLs in test environment

## Troubleshooting

### Common Issues

#### 1. "logoundefined" Error

If you see "logoundefined" in the API responses:

```javascript
// Check DatabaseService.ts
static async getAllLogoStats() {
  try {
    await connectDB();
    const logos = await LogoModel.find({ status: 'active' }).lean();
    const stats = await Promise.all(
      logos.map(async (logo) => ({
        logoId: `logo${logo.id}`, // Use logo.id to construct the logoId
        voteCount: 0,
        lastVote: null
      }))
    );
    return stats;
  } catch (error) {
    console.error('Error getting logo stats:', error);
    throw error;
  }
}
```

#### 2. Database Connection Issues

```bash
# Check MongoDB status
mongosh --port 27019 --eval "rs.status()"

# Verify replica set is running
ps aux | grep mongod
```

#### 3. Data Verification

```bash
# Connect to MongoDB
mongosh --port 27019 jardins-campion-dev

# Check logo collection
db.logos.find().pretty()

# Verify logo IDs
db.logos.distinct("value")
```

#### 3. Import Errors

If you see build errors related to MongoDB imports:

```typescript
// Error: Module '@/lib/mongodb' has no default export
// Fix: Use named import instead
import { connectDB } from '@/lib/mongodb';
```

Common import-related issues:

- Using default import instead of named import
- Missing curly braces in import statement
- Incorrect path to mongodb utility file

### Quick Fixes

1. Reset Database:

```bash
# Stop MongoDB
pkill mongod

# Clear data directory
rm -rf ~/data/db/dev/*

# Restart MongoDB and re-run setup
```

2. Rebuild Application:

```bash
# Clear npm cache
npm cache clean --force

# Remove dependencies
rm -rf node_modules

# Reinstall dependencies
npm install

# Rebuild application
npm run build
```

## Maintenance Tasks

### Regular Checks

1. Monitor database logs:

```bash
tail -f ~/data/db/dev/mongod.log
```

2. Check application logs:

```bash
# Development logs
npm run dev > app.log 2>&1
```

3. Verify data integrity:

```bash
npm run check-db
```

### Backup Procedures

```bash
# Backup database
mongodump --port 27019 --db jardins-campion-dev --out ./backup

# Restore if needed
mongorestore --port 27019 --db jardins-campion-dev ./backup/jardins-campion-dev
```

## Security Notes

1. Never commit `.env.local` file
2. Change default passwords in production
3. Use secure MongoDB configuration in production
4. Implement proper authentication for API endpoints

## Support

For issues and support:

- GitHub Issues: [JardinsCampion Issues](https://github.com/SergeVilleneuve/JardinsCampion/issues)
- Documentation: [Project Wiki](https://github.com/SergeVilleneuve/JardinsCampion/wiki)

---

Remember to always backup your data before making any changes to the database configuration or running initialization scripts.
