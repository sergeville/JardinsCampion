# MongoDB Setup Documentation

## Overview
This document outlines the MongoDB setup for the Jardins Campion project. The project uses a Docker-based MongoDB setup with separate development and production databases, each configured as a replica set.

## Database Configuration

### Development Environment
- **Container Name**: `jardins-campion-db-dev`
- **Port**: 27019 (mapped from internal 27017)
- **Replica Set**: `rs0`
- **Credentials**:
  - Username: `admin`
  - Password: `devpassword`
- **Connection URI**: `mongodb://admin:devpassword@localhost:27019/jardins-campion-dev?authSource=admin&directConnection=true`

### Production Environment
- **Container Name**: `jardins-campion-db-prod`
- **Port**: 27020 (mapped from internal 27017)
- **Replica Set**: `rs1`
- **Credentials**:
  - Username: `admin`
  - Password: `prodpassword`
- **Connection URI**: `mongodb://admin:prodpassword@localhost:27020/jardins-campion-prod?authSource=admin&directConnection=true`

## Starting the Databases

1. Start the MongoDB containers using Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. This command starts three containers:
   - Development database (`jardins-campion-db-dev`)
   - Production database (`jardins-campion-db-prod`)
   - Initialization container (`mongo-init`) for replica set setup

## Container Health Checks
The Docker Compose configuration includes health checks for both databases:
- Interval: 10 seconds
- Timeout: 10 seconds
- Maximum retries: 3

## Security Features
1. **Authentication**: Enabled by default
2. **Keyfile Authentication**: Uses `/data/mongodb-keyfile` for replica set security
3. **Network**: Containers run on a dedicated network `jardins-campion-network`

## Database Initialization
The `mongo-init` container automatically:
1. Waits for both databases to be ready
2. Initializes replica set `rs0` for development
3. Initializes replica set `rs1` for production

## Volume Management
Persistent data is stored in Docker volumes:
- `mongodb-dev-data`: Development database data
- `mongodb-prod-data`: Production database data

## Environment Configuration
The database connection settings are managed through environment variables in `.env.local`:
```env
# Development Database
MONGODB_URI_DEV=mongodb://admin:devpassword@localhost:27019/jardins-campion-dev?authSource=admin&directConnection=true

# Production Database
MONGODB_URI_PROD=mongodb://admin:prodpassword@localhost:27020/jardins-campion-prod?authSource=admin&directConnection=true
```

## Verification
To verify the database setup:
1. Check container status:
   ```bash
   docker ps | grep jardins-campion
   ```
2. Check database logs:
   ```bash
   docker logs jardins-campion-db-dev
   docker logs jardins-campion-db-prod
   ```

## Troubleshooting
If you encounter connection issues:
1. Ensure all containers are running:
   ```bash
   docker-compose ps
   ```
2. Check replica set status:
   ```bash
   docker exec -it jardins-campion-db-dev mongosh -u admin -p devpassword --eval "rs.status()"
   ```
3. Verify network connectivity:
   ```bash
   docker network inspect jardins-campion_jardins-campion-network
   ```

## Maintenance
To perform maintenance:
1. Stop the databases:
   ```bash
   docker-compose down
   ```
2. Clear data (if needed):
   ```bash
   docker-compose down -v
   ```
3. Restart the databases:
   ```bash
   docker-compose up -d
   ``` 