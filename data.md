# Data Models

## Base Models

### Logo

```json
{
  "id": "5",
  "alt": "Les Jardins du Lac Campion logo - A stylized light blue fish design in a circular motion with text Notre Dame du Laus Quebec",
  "src": "/logos/Logo2.png",
  "ownerId": "user1",
  "status": "active",
  "voteStats": {
    "totalVotes": 0,
    "uniqueVoters": 0,
    "lastVoteAt": null
  },
  "contentType": "image/png",
  "uploadedAt": "2024-02-15T21:37:10.537Z",
  "createdAt": "2024-02-15T21:37:10.551Z",
  "updatedAt": "2024-02-15T21:37:10.551Z"
}
```

### User

```json
{
  "id": "1",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "userId": "john-doe",
  "lastVoteAt": null,
  "voteCount": 0,
  "votedLogos": [],
  "createdAt": "2024-02-15T21:37:10.551Z",
  "updatedAt": "2024-02-15T21:37:10.551Z"
}
```

### Vote

```json
{
  "userId": "john-doe",
  "logoId": "5",
  "timestamp": "2024-02-15T21:37:10.537Z",
  "ownerId": "user1",
  "status": "confirmed",
  "version": 1,
  "createdAt": "2024-02-15T21:37:10.551Z",
  "updatedAt": "2024-02-15T21:37:10.551Z"
}
```
