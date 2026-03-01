# Firebase Admin Panel Mobile App PRD

## Problem Statement
Convert the provided Firebase Admin HTML panel into a professional Expo mobile app with full feature parity (setup, login, realtime data management, keys, settings, themes).

## Architecture
- **Frontend:** Expo React Native (single screen with tabbed UI and modals)
- **Backend:** FastAPI (health endpoints only; Firebase handled client-side)
- **Database:** Firebase Realtime Database (configured at runtime by admin)

## Implemented Features
- Firebase setup wizard (paste/parse config, manual fill, admin email)
- Admin authentication: email/password with authorized email check
- Prefilled Firebase config + admin email defaults (resettable)
- Devices/Keys dashboard: collection selector, stats, search, filters, key cards
- Key CRUD: add/update/delete, quick expiry buttons, offline toggle, position insert
- Success modal shows full key card with OK/Close jump controls
- JSON editor: view, format, save, copy, reset
- Settings: Firebase config info, collection management, theme selection
- Collections management: edit/delete (no reorder)
- UI utilities: toasts, confirmation modal, success preview, scroll-to-top, fire theme overlay

## Backlog
### P0
- Verify end-to-end Firebase auth + realtime database with real credentials

### P1
- Persist Firebase auth sessions with native persistence if supported
- Add pull-to-refresh indicator on keys list

### P2
- Export keys to CSV
- Dark-mode adaptive theme presets