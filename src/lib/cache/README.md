# User Profile Caching System

This directory contains the implementation of an intelligent caching system that solves the problem of stale user profile information in posts and comments.

## Problem Solved

When a user updates their display name or profile photo:
- **Before**: Posts and comments would still show the old name/photo until manually refreshed
- **After**: All posts and comments are automatically updated with the new information

## How It Works

### 1. In-Memory Cache
- Stores frequently accessed user profiles in memory
- 5-minute TTL (Time To Live) for cache entries
- Automatic cleanup of expired entries
- Maximum cache size of 1000 users to prevent memory issues

### 2. Batch Operations
- When fetching posts, collects all unique user IDs (authors + commenters)
- Fetches user data in batches (Firebase 'in' query limit of 10 per batch)
- Updates post display data with fresh user information

### 3. Intelligent Invalidation
- When a user updates their profile, cache is invalidated immediately
- Background batch update of all their posts and comments in Firestore
- No performance impact on the user - updates happen asynchronously

### 4. Performance Benefits
- **Reduced Database Queries**: User profiles cached for 5 minutes
- **Efficient Batch Fetching**: Multiple users fetched in single operations
- **Smart Cache Management**: Only fetches what's not cached or expired
- **Background Updates**: Post/comment updates don't block user interactions

## Usage

### Cache Management
```typescript
import { userCache, getCachedUser, getCachedUsers, invalidateUserCache } from './userCache';

// Get single user (with caching)
const user = await getCachedUser(userId);

// Get multiple users efficiently
const users = await getCachedUsers([userId1, userId2, userId3]);

// Invalidate cache when user data changes
invalidateUserCache(userId);
```

### Automatic Integration
The caching system is automatically integrated into:
- `getPosts()` - Enriches posts with fresh user data
- `getUserPosts()` - Updates user-specific posts
- `subscribeToPosts()` - Real-time updates with cache
- `updateUserProfile()` - Triggers cache invalidation and batch updates

## Performance Characteristics

### Cache Hit Scenario
- **Database Queries**: 0 (for cached users)
- **Response Time**: ~1-5ms per user

### Cache Miss Scenario
- **Database Queries**: 1 batch query per 10 users
- **Response Time**: ~50-100ms for batch of 10 users

### Profile Update Scenario
- **User Experience**: Immediate (cache invalidated, UI updated)
- **Background**: Batch update of all user's content
- **Database Operations**: Efficient batch writes

## Configuration

### Cache Settings
```typescript
private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
private readonly MAX_CACHE_SIZE = 1000; // Maximum cached users
```

### Batch Settings
```typescript
const MAX_BATCH_SIZE = 500; // Firestore batch write limit
const FIREBASE_IN_LIMIT = 10; // Firebase 'in' query limit
```

## Error Handling

- Cache misses fallback to database queries
- Failed batch updates are logged but don't block user operations
- Automatic cache cleanup prevents memory leaks
- Graceful degradation if caching is disabled

## Example Flow

1. **User "Alice" changes name from "USER1" to "USER2"**
2. **Profile update triggers**:
   - Update user document in Firestore
   - Invalidate Alice's cache entry
   - Background: Find all posts by Alice
   - Background: Update all posts with new name "USER2"
   - Background: Update all comments by Alice with new name
3. **Other users see updates**:
   - Next time posts are loaded, Alice's new name appears
   - Cache ensures fast loading of other users' data
   - Real-time listeners pick up the changes automatically

This system ensures data consistency while maintaining excellent performance and user experience.
