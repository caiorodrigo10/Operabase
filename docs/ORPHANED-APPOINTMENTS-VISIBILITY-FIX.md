# Orphaned Appointments Visibility Fix

## Problem Description

The system was showing conflict messages for appointments that were not visible in the calendar interface. Users would see messages like:

> "Conflito com consulta já agendada: 'Caio Rodrigo - Caio Rodrigo' das 09:00 às 10:00"

But when checking the calendar, no appointment would be visible at that time slot.

## Root Cause

**Data Inconsistency**: The availability check system and calendar display used different filtering logic:

1. **Availability Check System** (Backend):
   - Used ALL appointments from the database
   - Included "orphaned" appointments with invalid `user_id` values
   - Result: Detected conflicts with appointments that don't belong to the current clinic

2. **Calendar Display** (Frontend):
   - Filtered appointments to only show valid clinic users: `[2, 3, 4, 5, 6]`
   - Excluded orphaned appointments with other `user_id` values
   - Result: These conflict-causing appointments were invisible to users

## Investigation Results

- Found appointments with `user_id` values outside the valid clinic range
- These orphaned appointments existed in the database but were filtered out from calendar display
- The availability system was checking against ALL appointments, creating "phantom conflicts"

## Solution Implemented

Applied consistent filtering logic across both systems:

### 1. Updated Availability Service (`server/domains/appointments/appointments.service.ts`)

```typescript
// Added same user filtering logic as calendar frontend
const validUserIds = [2, 3, 4, 5, 6];
if (!apt.google_calendar_event_id && !validUserIds.includes(Number(apt.user_id))) {
  console.log(`🚫 AVAILABILITY: Excluding orphaned appointment ${apt.id} (user_id: ${apt.user_id})`);
  return false;
}
```

### 2. Updated Availability Controller (`server/domains/appointments/appointments.controller.ts`)

```typescript
// Added same user filtering logic as calendar frontend
const validUserIds = [2, 3, 4, 5, 6];
if (!(apt as any).google_calendar_event_id && !validUserIds.includes(Number(apt.user_id))) {
  console.log(`🚫 CONTROLLER: Excluding orphaned appointment ${apt.id} (user_id: ${apt.user_id})`);
  return false;
}
```

## Testing

After the fix:
- Availability checks now only consider appointments from valid clinic users
- Conflict messages will only appear for appointments that are actually visible in the calendar
- No more "phantom conflicts" from orphaned appointments

## Files Modified

1. `server/domains/appointments/appointments.service.ts` - Added user filtering in `checkAvailability` method
2. `server/domains/appointments/appointments.controller.ts` - Added user filtering in `checkAvailability` method
3. `docs/ORPHANED-APPOINTMENTS-VISIBILITY-FIX.md` - This documentation

## Status

✅ **RESOLVED** - Both availability checking and calendar display now use consistent appointment filtering logic. 