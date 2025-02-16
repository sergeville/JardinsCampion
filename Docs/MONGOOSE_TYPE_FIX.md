# Mongoose Type Error Fix

## Issue

A TypeScript error occurred when initializing Mongoose models:

```typescript
Argument of type 'IVoteModel' is not assignable to parameter of type 'Schema<IVote,...>'
```

The error indicated that we were passing model types where Mongoose expected schema types in the `getModels()` function.

## Solution

The fix involved modifying the model initialization code to use the `.schema` property:

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

## Explanation

The fix works because:

1. `mongoose.model()` expects a Mongoose Schema object as its second parameter
2. The `.schema` property provides the actual Schema object from the model schema
3. This maintains the same functionality while satisfying TypeScript's type checking

## Location

This fix was applied in `src/lib/services/databaseService.ts` within the `getModels()` function.
