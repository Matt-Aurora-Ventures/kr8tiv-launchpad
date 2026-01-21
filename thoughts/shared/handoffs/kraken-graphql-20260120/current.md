# GraphQL API Implementation

## Checkpoints
<!-- Resumable state for kraken agent -->
**Task:** Add GraphQL API layer alongside REST API
**Started:** 2026-01-20T15:00:00Z
**Last Updated:** 2026-01-20T15:00:00Z

### Phase Status
- Phase 1 (Tests Written): -> IN_PROGRESS (started 2026-01-20T15:00:00Z)
- Phase 2 (Implementation): PENDING
- Phase 3 (Refactoring): PENDING
- Phase 4 (Documentation): PENDING

### Validation State
```json
{
  "test_count": 0,
  "tests_passing": 0,
  "files_modified": [],
  "last_test_command": "",
  "last_test_exit_code": null
}
```

### Resume Context
- Current focus: Writing failing tests for GraphQL resolvers
- Next action: Create test files for Query, Mutation, Subscription resolvers
- Blockers: None

## Implementation Plan

### 1. Install Dependencies
- @apollo/server
- graphql
- graphql-subscriptions
- graphql-ws
- ws

### 2. Create GraphQL Structure
```
apps/api/src/graphql/
  schema.graphql          # Full GraphQL schema
  resolvers/
    index.ts              # Resolver composition
    query.resolver.ts     # Query resolvers
    mutation.resolver.ts  # Mutation resolvers
    subscription.resolver.ts # Subscription resolvers
  context.ts              # Auth, database context
  directives/
    auth.directive.ts     # @auth directive
    rateLimit.directive.ts # @rateLimit directive
  persisted-queries.ts    # Production persisted queries
```

### 3. Types to Define
- Token (with relations to Creator, Pool, Stats)
- Staker (with stake history)
- AutomationJob
- PlatformStats

### 4. Subscriptions
- tokenPriceUpdated
- tokenLaunched
- stakeEvent
