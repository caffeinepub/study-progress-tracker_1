# Study Progress Tracker

## Current State
- Goals page exists with create/edit/delete functionality
- Goal creation uses a Dialog with Select for subject, Input for title/score
- Backend createGoal requires a valid subjectId, title, targetScore
- No push notification system exists
- useQueries.ts casts actor to ActorWithGoals for goal methods

## Requested Changes (Diff)

### Add
- Push notification system using the browser Notification API
  - Request permission on first app load (after login)
  - Auto-check subject stats after each session log AND on Goals page mount
  - Fire a local notification for any subject with averageScore < 60 that has a goal set
  - Also check on app focus (visibilitychange event)
  - Store last notification time per subject in localStorage to avoid spamming (max once per day per subject)
- A `useNotifications` hook that encapsulates permission + firing logic
- Notification badge/indicator in the Layout nav for subjects needing attention

### Modify
- Goals.tsx: Fix goal creation flow
  - If no subjects exist, show inline message with link to /subjects instead of empty Select
  - Add keyboard support (Enter key submits form)
  - Show clear validation errors inline (not just toast)
  - Smooth animation on dialog open/close
  - After successful creation, animate new goal card in
- Goals.tsx: Add a notification toggle per goal card — user can enable/disable alerts for that subject
- useQueries.ts: After logSession mutation succeeds, trigger notification check

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/hooks/useNotifications.ts` — encapsulates Notification API permission request, firing logic, localStorage throttle (1 notification per subject per day)
2. Modify `Goals.tsx` — fix empty-subject guard, keyboard submit, inline errors, notification toggle per goal
3. Modify `App.tsx` — call useNotifications on mount to request permission
4. Modify `useQueries.ts` — expose a way to trigger notification check after session log
5. Modify `Layout.tsx` — show a bell icon with badge count for subjects below threshold
