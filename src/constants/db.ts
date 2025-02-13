export const DB_CONSTANTS = {
  COLLECTION_NAMES: {
    USERS: 'user',
    VOTES: 'vote',
    LOGOS: 'logo',
  },
  INDEXES: {
    USER_ID: 'userId_1',
    LOGO_ID: 'logoId_1',
    STATUS: 'status_1',
    TIMESTAMP: 'timestamp_-1',
  },
  QUERY_OPTIONS: {
    DEFAULT_TIMEOUT: 5000,
    MAX_LIMIT: 100,
  },
  VOTE_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    REJECTED: 'rejected',
  } as const,
  RESOLUTION_TYPE: {
    REJECT: 'reject',
  } as const,
};
