# Mongoose Type Error Fix

## Common Type Issues and Solutions

### 1. Model Initialization Type Error

**Issue:**
A TypeScript error occurred when initializing Mongoose models:

```typescript
Argument of type 'IVoteModel' is not assignable to parameter of type 'Schema<IVote,...>'
```

**Solution:**
Use the `.schema` property when initializing models:

```typescript
// Before (with type error)
UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserModelSchema);
VoteModel = mongoose.models.Vote || mongoose.model<IVote>('Vote', VoteModelSchema);
LogoModel = mongoose.models.Logo || mongoose.model<ILogo>('Logo', LogoModelSchema);

// After (fixed)
UserModel = mongoose.models.User || mongoose.model('User', UserModelSchema.schema);
VoteModel = mongoose.models.Vote || mongoose.model('Vote', VoteModelSchema.schema);
LogoModel = mongoose.models.Logo || mongoose.model('Logo', LogoModelSchema.schema);
```

### 2. Object.entries Type Safety

**Issue:**
TypeError when using `Object.entries` with potentially undefined schema:

```typescript
// Unsafe code
Object.entries(schema.paths).forEach(...)
```

**Solution:**
Add type checking before accessing schema properties:

```typescript
// Safe code
if (schema && schema.paths) {
  Object.entries(schema.paths).forEach(...)
}
```

### 3. Model Interface Best Practices

```typescript
// Define document interface
export interface IUser extends Document {
  id: string;
  name: string;
  // ... other fields
}

// Define model interface with static methods
interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findByUserId(userId: string): Promise<IUser | null>;
}

// Use both in model creation
const UserModel = mongoose.model<IUser, IUserModel>('User', userSchema);
```

## Type-Safe Database Operations

### 1. Collection Types

```typescript
type CollectionName = 'users' | 'votes' | 'logos';

type CollectionToType = {
  users: IUser;
  votes: IVote;
  logos: ILogo;
};

type CollectionModels = {
  [K in CollectionName]: Model<CollectionToType[K]>;
};
```

### 2. Type-Safe Queries

```typescript
// Use generics for type safety
async function findDocument<T extends Document>(
  model: Model<T>,
  query: FilterQuery<T>
): Promise<T | null> {
  return model.findOne(query).exec();
}
```

## Common Pitfalls

1. Always extend `Document` for model interfaces
2. Use `.schema` when initializing models
3. Add type guards for schema operations
4. Define proper model interfaces with static methods
5. Use type-safe query helpers

## TypeScript Configuration

Ensure your `tsconfig.json` has these options for optimal type checking:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictPropertyInitialization": true,
    "strictNullChecks": true
  }
}
```
