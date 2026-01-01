# Status Flows — MW4H v1

## 1) Order lifecycle (customer-facing)
Draft
→ Sent for Customer Review
→ Customer Approved
→ Needs to Be Filled
→ Filled
→ In Progress (optional, once workers dispatched)
→ Completed
→ Closed

Notes:
- "Needs to Be Filled" triggers candidate recommendations + recruiting dashboard visibility.
- "Filled" means candidates selected and assigned (not necessarily onsite yet).

## 2) Assignment lifecycle (worker-facing)
Proposed/Selected
→ Dispatched (dispatch order issued)
→ On-assignment (arrival verified)
→ Completed (assignment ended)

Arrival verification (consent-based):
- Primary: geofence/point-in-time check-in
- Fallback: one-tap arrival confirmation link
- No continuous tracking

## 3) Dispatch lock rules (must-pass gates)
Dispatch is LOCKED unless all are complete:
- Worker consent captured (logged + timestamped)
- Pre-dispatch videos completed + quiz passed
- Site-specific videos completed (if required)
- Daily safety video completed (for active field employees on day-of dispatch)

## 4) Safety incident lifecycle
Reported
→ Reviewed
→ Classified (violation / near miss / recordable)
→ Linked (worker + job site + customer + order)
→ Resolved/Closed

Safety data usage:
- Decision-support marker for matching (not auto-disqualifying unless configured)
