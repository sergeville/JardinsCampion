import mongoose, { Connection, Model, Document, ClientSession, Collection } from 'mongoose';

export type MockModel<T extends Document = Document> = Model<T> & {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  updateOne: jest.Mock;
  deleteOne: jest.Mock;
};

export const createMockModelFunctions = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
});

interface MockSession extends ClientSession {
  startTransaction: jest.Mock;
  commitTransaction: jest.Mock;
  abortTransaction: jest.Mock;
  endSession: jest.Mock;
  inTransaction: jest.Mock;
}

type ReadPreferenceMode =
  | 'primary'
  | 'primaryPreferred'
  | 'secondary'
  | 'secondaryPreferred'
  | 'nearest';

type W = number | 'majority';

interface MockDb {
  collection: jest.Mock;
  databaseName: string;
  options: Record<string, unknown>;
  readConcern: {
    level: string;
    toJSON: () => { level: string };
  };
  writeConcern: { w: W | undefined };
  readPreference: {
    mode: ReadPreferenceMode;
    preference: ReadPreferenceMode;
    isValid: () => boolean;
    secondaryOk: () => boolean;
    equals: (other: unknown) => boolean;
    toJSON: () => { mode: ReadPreferenceMode };
  };
  namespace: string;
  serverConfig: Record<string, unknown>;
  bufferMaxEntries: number;
  native_parser: boolean;
  slaveOk: boolean;
  secondaryOk: boolean;
  bsonOptions: Record<string, unknown>;
  timeoutMS: number;
  createCollection: jest.Mock;
  command: jest.Mock;
  collections: jest.Mock;
  listCollections: jest.Mock;
  dropCollection: jest.Mock;
  dropDatabase: jest.Mock;
  createIndex: jest.Mock;
  addUser: jest.Mock;
  removeUser: jest.Mock;
  stats: jest.Mock;
  admin: jest.Mock;
  aggregate: jest.Mock;
  renameCollection: jest.Mock;
  setProfilingLevel: jest.Mock;
  profilingLevel: jest.Mock;
  indexInformation: jest.Mock;
  executeDbAdminCommand: jest.Mock;
  executeDbAdminCommandAsync: jest.Mock;
  watch: jest.Mock;
  runCursorCommand: jest.Mock;
}

type MockCollection = Collection<Document> & {
  [key: string]: any;
};

interface MockConnection extends Omit<Connection, 'collections' | 'id' | 'models'> {
  collections: { [key: string]: MockCollection };
  id: number;
  models: { [key: string]: Model<any> };
  startSession: jest.Mock<Promise<MockSession>>;
  close: jest.Mock;
  readyState: number;
  on: jest.Mock;
  once: jest.Mock;
  db: MockDb;
  aggregate: jest.Mock;
  asPromise: jest.Mock;
  destroy: jest.Mock;
  collection: jest.Mock;
  model: jest.Mock;
  createCollection: jest.Mock;
  dropCollection: jest.Mock;
  dropDatabase: jest.Mock;
  listCollections: jest.Mock;
  watch: jest.Mock;
  useDb: jest.Mock;
  openUri: jest.Mock;
  addListener: jest.Mock;
  removeListener: jest.Mock;
  removeAllListeners: jest.Mock;
  emit: jest.Mock;
  eventNames: jest.Mock;
  getMaxListeners: jest.Mock;
  listenerCount: jest.Mock;
  listeners: jest.Mock;
  off: jest.Mock;
  prependListener: jest.Mock;
  prependOnceListener: jest.Mock;
  rawListeners: jest.Mock;
  setMaxListeners: jest.Mock;
  config: Record<string, unknown>;
  createCollections: jest.Mock;
  deleteModel: jest.Mock;
  modelNames: jest.Mock;
  syncIndexes: jest.Mock;
  base: Record<string, unknown>;
  plugins: Array<unknown>;
  states: Record<string, unknown>;
  name: string;
  host: string;
  port: number;
  pass: string;
  user: string;
  replica: boolean;
  hosts: string[];
  options: Record<string, unknown>;
  otherDbs: Array<unknown>;
  relatedDbs: Record<string, unknown>;
  get: jest.Mock;
  getClient: jest.Mock;
  listDatabases: jest.Mock;
  plugin: jest.Mock;
  setClient: jest.Mock;
  set: jest.Mock;
  withSession: jest.Mock;
  transaction: jest.Mock;
}

interface MockMongoose {
  connect: jest.Mock;
  connection: MockConnection | undefined;
  model: jest.Mock;
  Schema: Record<string, unknown>;
  startSession: jest.Mock<Promise<MockSession>>;
  shouldFailNextConnect: boolean;
  _connections: Map<string, MockConnection>;
  _clearConnections: () => void;
}

const mockSession: MockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
  inTransaction: jest.fn(),
} as MockSession;

// Create empty mock objects first
const mockConnection = {} as any;
const mockCollection = {} as any;

// Initialize mockCollection
Object.assign(mockCollection, {
  $format: jest.fn(),
  $print: jest.fn(),
  getIndexes: jest.fn(),
  ensureIndex: jest.fn(),
  stats: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  insertOne: jest.fn(),
  insertMany: jest.fn(),
  updateOne: jest.fn(),
  updateMany: jest.fn(),
  deleteOne: jest.fn(),
  deleteMany: jest.fn(),
  aggregate: jest.fn(),
  watch: jest.fn(),
  drop: jest.fn(),
  createIndex: jest.fn(),
  dropIndex: jest.fn(),
  dropIndexes: jest.fn(),
  countDocuments: jest.fn(),
  estimatedDocumentCount: jest.fn(),
  distinct: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  findOneAndReplace: jest.fn(),
  bulkWrite: jest.fn(),
  initializeOrderedBulkOp: jest.fn(),
  initializeUnorderedBulkOp: jest.fn(),
  indexes: jest.fn(),
  indexExists: jest.fn(),
  indexInformation: jest.fn(),
  listIndexes: jest.fn(),
  options: jest.fn(),
  isCapped: jest.fn(),
  createIndexes: jest.fn(),
  rename: jest.fn(),
  save: jest.fn(),
  validate: jest.fn(),
  mapReduce: jest.fn(),
  geoHaystackSearch: jest.fn(),
  geoNear: jest.fn(),
  group: jest.fn(),
  replaceOne: jest.fn(),
  reIndex: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  findAndModify: jest.fn(),
  findAndRemove: jest.fn(),
  collectionName: 'test',
  conn: mockConnection,
  name: 'test',
  dbName: 'test',
  namespace: 'test',
  readPreference: {
    mode: 'primary',
    preference: 'primary',
    isValid: () => true,
    secondaryOk: () => false,
    equals: () => true,
    toJSON: () => ({ mode: 'primary' }),
  },
  writeConcern: { w: 1 },
  readConcern: {
    level: 'local',
    toJSON: () => ({ level: 'local' }),
  },
  hint: undefined,
  collation: undefined,
  serverApi: undefined,
  bsonOptions: {},
  closed: false,
  timeoutMS: 30000,
  listSearchIndexes: jest.fn(),
  createSearchIndex: jest.fn(),
  createSearchIndexes: jest.fn(),
  dropSearchIndex: jest.fn(),
  updateSearchIndex: jest.fn(),
} as unknown as MockCollection);

// Initialize mockConnection
Object.assign(mockConnection, {
  startSession: jest.fn().mockResolvedValue(mockSession),
  close: jest.fn(),
  readyState: 1,
  on: jest.fn(),
  once: jest.fn(),
  db: {
    collection: jest.fn().mockReturnValue({
      stats: jest.fn().mockResolvedValue({
        count: 0,
        size: 0,
        avgObjSize: 0,
      }),
    }),
    databaseName: 'test',
    options: {},
    readConcern: {
      level: 'local',
      toJSON: () => ({ level: 'local' }),
    },
    writeConcern: { w: 1 },
    readPreference: {
      mode: 'primary',
      preference: 'primary',
      isValid: () => true,
      secondaryOk: () => false,
      equals: () => true,
      toJSON: () => ({ mode: 'primary' }),
    },
    namespace: 'test',
    serverConfig: {},
    bufferMaxEntries: 0,
    native_parser: true,
    slaveOk: false,
    secondaryOk: false,
    bsonOptions: {},
    timeoutMS: 30000,
    createCollection: jest.fn(),
    command: jest.fn(),
    collections: jest.fn(),
    listCollections: jest.fn(),
    dropCollection: jest.fn(),
    dropDatabase: jest.fn(),
    createIndex: jest.fn(),
    addUser: jest.fn(),
    removeUser: jest.fn(),
    stats: jest.fn(),
    admin: jest.fn(),
    aggregate: jest.fn(),
    renameCollection: jest.fn(),
    setProfilingLevel: jest.fn(),
    profilingLevel: jest.fn(),
    indexInformation: jest.fn(),
    executeDbAdminCommand: jest.fn(),
    executeDbAdminCommandAsync: jest.fn(),
    watch: jest.fn(),
    runCursorCommand: jest.fn(),
  },
  aggregate: jest.fn(),
  asPromise: jest.fn(),
  destroy: jest.fn(),
  collection: jest.fn().mockReturnValue(mockCollection),
  model: jest.fn(),
  createCollection: jest.fn(),
  dropCollection: jest.fn(),
  dropDatabase: jest.fn(),
  listCollections: jest.fn(),
  watch: jest.fn(),
  useDb: jest.fn(),
  openUri: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
  emit: jest.fn(),
  eventNames: jest.fn(),
  getMaxListeners: jest.fn(),
  listenerCount: jest.fn(),
  listeners: jest.fn(),
  off: jest.fn(),
  prependListener: jest.fn(),
  prependOnceListener: jest.fn(),
  rawListeners: jest.fn(),
  setMaxListeners: jest.fn(),
  collections: { test: mockCollection },
  config: {},
  createCollections: jest.fn(),
  deleteModel: jest.fn(),
  modelNames: jest.fn(),
  syncIndexes: jest.fn(),
  base: {},
  models: {},
  plugins: [],
  states: {},
  id: 0,
  name: 'test',
  host: 'localhost',
  port: 27017,
  pass: '',
  user: '',
  replica: false,
  hosts: [],
  options: {},
  otherDbs: [],
  relatedDbs: {},
  get: jest.fn(),
  getClient: jest.fn(),
  listDatabases: jest.fn(),
  plugin: jest.fn(),
  setClient: jest.fn(),
  set: jest.fn(),
  withSession: jest.fn(),
  transaction: jest.fn(),
} as unknown as MockConnection);

// Now we can safely type them
const typedMockCollection = mockCollection as MockCollection;
const typedMockConnection = mockConnection as MockConnection;

// Define mockMongoose first
export const mockMongoose: MockMongoose = {
  connect: jest.fn(),
  connection: typedMockConnection,
  model: jest.fn(),
  Schema: {},
  startSession: jest.fn().mockResolvedValue(mockSession),
  shouldFailNextConnect: false,
  _connections: new Map(),
  _clearConnections() {
    this._connections.clear();
    if (this.connection) {
      this.connection.readyState = 1;
    }
    this.shouldFailNextConnect = false;
    this.connect.mockClear();
    mockSession.startTransaction.mockClear();
    mockSession.commitTransaction.mockClear();
    mockSession.abortTransaction.mockClear();
    mockSession.endSession.mockClear();
  },
};

// Create connection factory
const createMockConnection = (): MockConnection => {
  const newConnection = { ...typedMockConnection };
  newConnection.collections = { test: typedMockCollection };
  return newConnection;
};

// Initialize connection after mockMongoose is defined
mockMongoose.connection = createMockConnection();

// Implement connect method
mockMongoose.connect.mockImplementation(async (uri: string) => {
  if (mockMongoose.shouldFailNextConnect) {
    mockMongoose.connection!.readyState = 0;
    throw new Error('Unable to connect to the database');
  }

  const connection = createMockConnection();
  mockMongoose._connections.set(uri, connection);
  mockMongoose.connection!.readyState = 1;

  return {
    connection,
    connections: [connection],
    ...connection,
  };
});

export const resetState = () => {
  mockMongoose._clearConnections();
  if (mockMongoose.connection) {
    mockMongoose.connection.readyState = 1;
    mockMongoose.connection.on.mockClear();
    mockMongoose.connection.once.mockClear();
    mockMongoose.connection.close.mockClear();
    mockMongoose.connection.db.collection.mockClear();
  }
};

// Mock mongoose module
jest.mock('mongoose', () => ({
  __esModule: true,
  default: mockMongoose,
  connect: mockMongoose.connect,
  startSession: mockMongoose.startSession,
}));
