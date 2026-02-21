# 🔒 JARVIS PRIME — CANONICAL SYSTEM HANDOFF  
**Date:** 2026-02-20  
**Branch:** wip/customers-wiring-2026-02-17  
**Primary Drive:** E:\JARVIS (D:\JARVIS = BACKUP ONLY)  
**Backend:** http://127.0.0.1:3002  
**Frontend:** http://localhost:3001  
**Database:** jarvis_training (RDS, schema=public)

---

## ✅ CURRENT STABLE STATE

### Backend
- Running on port 3002
- /readyz returns {"ok": true}
- Ownership PATCH accepts:
  { "salespersonId": "<Salesperson.id | null>" }
- Backend translates Salesperson.id → Salesperson.userId
- Customer.defaultSalespersonUserId is persisted correctly
- GET /customers returns defaultSalesperson in list
- GET /customers/:id returns:
  - defaultSalespersonUserId
  - defaultSalesperson object (id, firstName, lastName, email)
  - locations (if present)
- No schema changes introduced
- Build passes (nest build)

Latest backend commit:
a87825a — Customers: wire default salesperson ownership (salespersonId → userId) + list/detail display

---

### Frontend
- Ownership dropdown uses Salesperson registry
- PATCH sends salespersonId (not userId)
- After save:
  - Detail page reflects updated Sales Rep
  - Hub reflects updated Default Salesperson
- Next build successful (Next.js production build passed)
- No TypeScript errors

---

## ⚠ CURRENT OPEN ISSUE

Customer contacts are not rendering.

Investigation revealed:
- Backend had temporarily crashed due to missing dist/main
- Rebuild required
- Need to verify:
  - GET /customers/:id returns customerContacts relation
  - contacts still exist in DB
  - contacts are included in service include/select

Likely resolution:
Add include for customerContacts in detail query if missing.

No schema drift suspected.

---

## 📦 PACKET STATUS

1. Internal Orders — UI shells complete
2. Recruiting — Shell only
3. Employee My Work — Shell only
4. Time Entry — UI-only working
5. Customer Portal — Shell only
6. Money — untouched
7. Admin/Safety — functional

Primary active area: Customers module wiring + data integrity.

---

## 🔐 NON-NEGOTIABLES

- NO schema changes without explicit approval
- NO migrations
- Backend and frontend must build clean before commit
- Only commit intended files
- No temp/test files in repo

---

## 🎯 NEXT PRIORITY

1. Confirm contacts still exist in DB
2. Ensure GET /customers/:id includes customerContacts
3. Restore contacts rendering on Customer Detail page
4. Clean untracked script clutter (optional)
5. Remove fake demo banner (future)

---

# 🧾 NEW SESSION BOOTSTRAP BLOCK (COPY THIS INTO NEXT CHATGPT SESSION)

BEGIN SESSION CONTEXT:

We are on branch wip/customers-wiring-2026-02-17.
Backend running on 3002.
Frontend running on 3001.
Salesperson ownership wiring is complete and verified.
Next task: restore customer contacts rendering on detail page.
No schema changes allowed.
No migrations allowed.
Primary files: customers.service.ts and customer detail frontend page.

END SESSION CONTEXT.
