# API Testing Commands

## Base URL

```bash
BASE_URL="http://localhost:3001"
```

## Vote Endpoints

### Get Vote History

```bash
# Get vote history with default limit (10)
curl -X GET "$BASE_URL/api/votes?action=history"

# Get vote history with custom limit
curl -X GET "$BASE_URL/api/votes?action=history&limit=5"
```

### Get Logo Stats

```bash
# Get stats for all logos
curl -X GET "$BASE_URL/api/votes?action=stats"

# Get stats for specific logo
curl -X GET "$BASE_URL/api/votes?action=stats&logoId=1"
```

### Get User Votes

```bash
# Get votes for a specific user
curl -X GET "$BASE_URL/api/votes?action=userVotes&userId=serge"
```

### Submit Vote

```bash
# Submit a new vote
curl -X POST "$BASE_URL/api/votes" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "logoId": "1",
    "ownerId": "owner123"
  }'
```

## Database Info Endpoints

### Get Database Information

```bash
# Get all database information
curl -X GET "$BASE_URL/api/database-info"
```

### Collection Operations

```bash
# Get collection stats
curl -X POST "$BASE_URL/api/database-info" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "stats",
    "collectionName": "logos"
  }'

# Add new document
curl -X POST "$BASE_URL/api/database-info" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add",
    "collectionName": "logos",
    "data": {
      "value": "5",
      "src": "/logos/Logo5.png",
      "alt": "New test logo",
      "status": "active"
    }
  }'

# Update document
curl -X POST "$BASE_URL/api/database-info" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "update",
    "collectionName": "logos",
    "id": "DOCUMENT_ID",
    "data": {
      "status": "inactive"
    }
  }'

# Delete document
curl -X POST "$BASE_URL/api/database-info" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "delete",
    "collectionName": "logos",
    "id": "DOCUMENT_ID"
  }'
```

## Database Sync Endpoint

### Connect to Real-time Updates

```bash
# Stream database changes (Server-Sent Events)
curl -N "$BASE_URL/api/database-sync"
```

## Testing Script

```bash
#!/bin/bash

BASE_URL="http://localhost:3001"

echo "Testing Vote History..."
curl -s "$BASE_URL/api/votes?action=history" | jq .

echo -e "\nTesting Logo Stats..."
curl -s "$BASE_URL/api/votes?action=stats" | jq .

echo -e "\nTesting User Votes..."
curl -s "$BASE_URL/api/votes?action=userVotes&userId=serge" | jq .

echo -e "\nTesting Database Info..."
curl -s "$BASE_URL/api/database-info" | jq .

echo -e "\nTesting Database Sync (will run for 5 seconds)..."
timeout 5 curl -N "$BASE_URL/api/database-sync"
```

## Response Examples

### Successful Vote Response

```json
{
  "success": true,
  "data": {
    "userId": "test-user",
    "logoId": "1",
    "status": "confirmed",
    "timestamp": "2025-02-15T15:00:00.000Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Notes

1. Replace `DOCUMENT_ID` with actual MongoDB document IDs when testing update/delete operations.
2. The database sync endpoint uses Server-Sent Events (SSE) and will maintain an open connection.
3. All POST requests should include the `Content-Type: application/json` header.
4. For better readability of JSON responses, pipe the output through `jq`: `curl ... | jq .`
5. The base URL assumes the development server is running on port 3001. Adjust if using a different port.
