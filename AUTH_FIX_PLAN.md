# Plan to Stabilize and Simplify Authentication

## 1. Problem Diagnosis

The current authentication system is unreliable and requires manual database intervention, leading to a poor developer and user experience. The core issues are:

- **Service Role Key Failure:** Server-side operations requiring admin privileges (like user creation and organization creation) are failing with "Invalid API key" or "RLS violation" errors. This indicates the Supabase admin client, which uses the `SUPABASE_SERVICE_ROLE_KEY`, is not authenticating correctly.

- **Inconsistent Database State:** The multi-step signup process is not transactional. Failures at any step leave orphaned records (e.g., an organization without a user), causing subsequent login and data-fetching errors.

- **Unclear Error Handling:** Errors like "Invalid login credentials" or "Database error querying schema" are symptoms of the inconsistent data but don't point to the root cause, making debugging difficult.

## 2. Objectives

- **Reliable Signup:** A user can create an account and a new organization seamlessly through the UI.
- **Reliable Login:** A user can log in successfully immediately after a successful signup.
- **Simplified Dev Experience:** Eliminate the need for manual database edits for basic authentication flows.
- **Data Integrity:** Ensure the signup process is atomic, preventing orphaned records.
- **Robust Error Handling:** The API and UI should provide clear, actionable error messages.

## 3. Implementation Strategy

### Phase 1: Stabilize the Service Role Key & Admin Client

1.  **Create a Centralized Admin Client Utility:**
    -   **Action:** Create a new file at `src/lib/supabase/admin.ts`.
    -   **Purpose:** This file will export a single, memoized function `createSupabaseAdminClient()`. It will initialize a Supabase client using `process.env.SUPABASE_URL` and `process.env.SUPABASE_SERVICE_ROLE_KEY`.
    -   **Benefit:** This isolates and standardizes admin client creation, ensuring consistency. It will also include logging to warn if the environment variables are missing during server startup.

2.  **Refactor Signup API (`/api/auth/signup.ts`):**
    -   **Action:** Modify the API route to import and use the new `createSupabaseAdminClient()`.
    -   **Purpose:** This ensures that all database operations within the signup flow that require bypassing RLS (specifically, creating the `organization`) are performed with a correctly authenticated admin client.

3.  **Refactor Test User Script (`scripts/create-test-user.mjs`):**
    -   **Action:** Update this script to also use `createSupabaseAdminClient()`.
    -   **Purpose:** This provides a separate environment (Node.js script) to test and validate that the service role key is configured and working correctly, independent of the Next.js runtime.

### Phase 2: Harden Signup Logic & Session Handling

1.  **Implement "Manual Transaction" in Signup API:**
    -   **Action:** Wrap the entire signup logic (create org, create auth user, create public user profile) in a master `try...catch` block.
    -   **Purpose:** If any step in the sequence fails, the `catch` block will be responsible for "rolling back" the completed steps. For example, if creating the public `users` profile fails, the code will attempt to delete the `auth.users` record and the `organizations` record created earlier in the process.
    -   **Benefit:** This prevents the database from being left in an inconsistent state.

2.  **Strengthen Session Context (`AuthContext.tsx`):**
    -   **Action:** Enhance the logic that fetches the user's profile from the public `users` table.
    -   **Purpose:** If a Supabase session exists but the corresponding profile in our `users` table is missing, the context should not leave the app in a broken state. It should handle this case efeitos, such as by setting an error state, clearing the session, and redirecting to a login or error page.

### Phase 3: Documentation and Cleanup

1.  **Update Documentation:**
    -   **Action:** Revise `QUICK_START.md` to prioritize the now-working UI signup flow.
    -   **Purpose:** The `MANUAL_USER_SETUP.md` guide will be demoted to a fallback/troubleshooting document, not the primary workflow.

2.  **Consolidate and Cleanup:**
    -   **Action:** Once `scripts/create-test-user.mjs` is reliable, review and remove any other redundant or temporary user-creation scripts.
    -   **Purpose:** Maintain a clean and understandable codebase.

## 4. Validation Plan

1.  **Service Key Validation:** Run the refactored `scripts/create-test-user.mjs`. It must succeed.
2.  **Successful Signup:** Use the UI to sign up a new user with a new organization. The process must complete without error, and the user should be automatically logged in.
3.  **Login Validation:** Log out and log back in with the newly created credentials.
4.  **Rollback Test:** Artificially introduce an error in the signup API (e.g., a typo in a table name in the final step) and verify that no orphaned organization or auth user is left in the database.
5.  **Orphaned Session Test:** Manually delete a user's record from the public `users` table and attempt to navigate the app. Verify that `AuthContext` handles the error gracefully.
