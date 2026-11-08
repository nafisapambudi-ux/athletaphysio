# Security Specification: AthletaPhysio Firestore

## 1. Data Invariants
1. **User Identity Isolation**: A user can only access, create, update, or delete their own user profile document where `userId == request.auth.uid`.
2. **Owner-Scoped Athlete Records**: Athletes belong to the coach/trainer who created them (`ownerId == request.auth.uid`). A coach can only read, create, update, or delete athletes belonging to their team.
3. **Sub-Entity Ownership Consistency**: All related telemetry (training sessions, wellness logs, fitness tests, jump measurements, VBT sessions, pain points) must have `ownerId == request.auth.uid`.
4. **Valid Schema Keys**: Updates cannot inject phantom or unauthorized fields (`hasOnly` checks).
5. **No Blanket Reads**: All list queries are constrained by owner ID to prevent cross-tenant data scraping.

## 2. Dirty Dozen Payloads & Negative Test Vectors
1. Unauthenticated write to `/athletes/ath-1` -> PERMISSION_DENIED.
2. Authenticated user A writing `ownerId: user_B` on `/athletes/ath-2` -> PERMISSION_DENIED.
3. User B reading `/athletes/ath-1` owned by user A -> PERMISSION_DENIED.
4. User A updating `/athletes/ath-1` to switch `ownerId` to user B -> PERMISSION_DENIED.
5. Injected 10KB string payload into athlete `name` -> PERMISSION_DENIED (boundary limit).
6. Malicious jump measurement with negative `jumpHeightCm` or phantom `isAdmin: true` -> PERMISSION_DENIED.
7. Unauthenticated read of user profile `/users/user_A` -> PERMISSION_DENIED.
8. User B attempting to modify User A's pain points -> PERMISSION_DENIED.
9. Training session logged without required `rpe` or invalid `durationMinutes` -> PERMISSION_DENIED.
10. Cross-tenant list query without filtering `ownerId == request.auth.uid` -> PERMISSION_DENIED.
11. Attempt to delete another trainer's athlete or records -> PERMISSION_DENIED.
12. Attempt to bypass rules by injecting unknown subcollections -> PERMISSION_DENIED (Catch-all deny).
