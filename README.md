# HatchOS

This README is an automated high-level summary of the repository and key files. Use the links to jump straight to places of interest.

## Project snapshot
- Main backend: [`server.py`](server.py)  
- ADB control: [`adb_service.py`](adb_service.py)  
- Master apps index: [`APPS_OVERVIEW.md`](APPS_OVERVIEW.md)  
- Cleanup / status docs: [`CLEANUP_SUMMARY.md`](CLEANUP_SUMMARY.md), [`FIXES_COMPLETE.md`](FIXES_COMPLETE.md)

## Key apps (quick links)
- Messaging app (Expo, PWA, native build helpers)
  - Android fix notes: [`APPS/MessagingApp/ANDROID_FIX_README.md`](APPS/MessagingApp/ANDROID_FIX_README.md)  
  - Build instructions: [`APPS/MessagingApp/BUILD_INSTRUCTIONS.md`](APPS/MessagingApp/BUILD_INSTRUCTIONS.md)  
  - Studio build script: [`APPS/MessagingApp/BUILD-WITH-STUDIO.bat`](APPS/MessagingApp/BUILD-WITH-STUDIO.bat)  
  - Web build script: [`APPS/MessagingApp/BUILD-WEB-APP.bat`](APPS/MessagingApp/BUILD-WEB-APP.bat)  
  - PWA docs: [`APPS/MessagingApp/PWA_README.md`](APPS/MessagingApp/PWA_README.md)  
  - Public/tunnel notes: [`APPS/MessagingApp/PUBLIC_URL_SETUP.txt`](APPS/MessagingApp/PUBLIC_URL_SETUP.txt)  
  - Chat screen: [`APPS/MessagingApp/src/screens/ChatScreen.js`](APPS/MessagingApp/src/screens/ChatScreen.js)  
  - Android gradle entry: [`APPS/MessagingApp/android/app/build.gradle`](APPS/MessagingApp/android/app/build.gradle)

- Hatch Wall (on-device firewall / AI detection)
  - Main docs: [`APPS/HatchWall/README.md`](APPS/HatchWall/README.md)  
  - Implementation summary: [`HATCH_WALL_COMPLETE.md`](HATCH_WALL_COMPLETE.md)  
  - Quickstart: [`HATCH_WALL_QUICKSTART.md`](HATCH_WALL_QUICKSTART.md)  
  - Firewall engine API usage example: see [`APPS/HatchWall/README.md`](APPS/HatchWall/README.md) and call patterns like [`FirewallEngine.initialize`](APPS/HatchWall/services/FirewallEngine.js) (service file path indicated in docs).  
  - Admin dashboard generator: [`admin/dashboard.js`](admin/dashboard.js) and admin UI: [`admin/hatch-wall.html`](admin/hatch-wall.html)

- HatchOS Core / MyClass / other apps
  - Core docs: [`APPS/HatchOSCore/README.md`](APPS/HatchOSCore/README.md)  
  - MyClass main screens & seed data: [`APPS/MyClass/src/screens/HatchyScreen.js`](APPS/MyClass/src/screens/HatchyScreen.js), [`APPS/MyClass/seed_myclass.py`](APPS/MyClass/seed_myclass.py)  
  - Shine Insight (web): [`APPS/hatch-shine-insight/src/pages/Index.tsx`](APPS/hatch-shine-insight/src/pages/Index.tsx), [`APPS/hatch-shine-insight/src/components/UploadSection.tsx`](APPS/hatch-shine-insight/src/components/UploadSection.tsx)

## Lockfiles / binary blobs
Many apps include bun lockfiles (binary):
- [`APPS/hatchy-web-guard/bun.lockb`](APPS/hatchy-web-guard/bun.lockb)  
- [`APPS/hatch-shine-insight/bun.lockb`](APPS/hatch-shine-insight/bun.lockb)  
- [`APPS/hatch-smart-cal/bun.lockb`](APPS/hatch-smart-cal/bun.lockb)  
- [`APPS/hatchy-privacy-ai/bun.lockb`](APPS/hatchy-privacy-ai/bun.lockb)  
These are large/binary — don't edit directly.

## Useful scripts & guides
- Full PWA local HTTPS setup: [`FULL_PWA_LOCALHOST_SETUP.md`](FULL_PWA_LOCALHOST_SETUP.md)  
- Final acceptance / certificate guide: [`FINAL_SETUP_INSTRUCTIONS.txt`](FINAL_SETUP_INSTRUCTIONS.txt)  
- Messaging app quick run: expo + tunnels covered in [`APPS/MessagingApp/PUBLIC_URL_SETUP.txt`](APPS/MessagingApp/PUBLIC_URL_SETUP.txt)

## Notable code symbols & where to look
- `FirewallEngine.initialize` — referenced in [`APPS/HatchWall/README.md`](APPS/HatchWall/README.md) (implementation in `APPS/HatchWall/services/FirewallEngine.js` per docs)  
- `AIDetectionService.analyzeUrl` — referenced in [`APPS/HatchWall/README.md`](APPS/HatchWall/README.md) (service file in `APPS/HatchWall/services/AIDetectionService.js`)  
- `ChatScreen` component — [`APPS/MessagingApp/src/screens/ChatScreen.js`](APPS/MessagingApp/src/screens/ChatScreen.js)

## Quick recommendations (practical)
- Create a single root README (this file) and link into the many per-app READMEs (done). See: [`APPS_OVERVIEW.md`](APPS_OVERVIEW.md)  
- For Messaging: produce a Dev Build (see [`APPS/MessagingApp/ANDROID_FIX_README.md`](APPS/MessagingApp/ANDROID_FIX_README.md)) to avoid Expo Go permission issues.  
- Keep backups of bun.lockb files; treat them as binary artifacts.  
- Use `server.py` and follow [`FULL_PWA_LOCALHOST_SETUP.md`](FULL_PWA_LOCALHOST_SETUP.md) for HTTPS local testing.

## Where to start right now
1. Start backend: [`server.py`](server.py)  
2. Open overview: [`APPS_OVERVIEW.md`](APPS_OVERVIEW.md)  
3. For Messaging dev work: [`APPS/MessagingApp/BUILD_INSTRUCTIONS.md`](APPS/MessagingApp/BUILD_INSTRUCTIONS.md) and [`APPS/MessagingApp/ANDROID_FIX_README.md`](APPS/MessagingApp/ANDROID_FIX_README.md)

---

Need a fully expanded, opinionated, "insanely detailed" README with section-by-section deep dives for each app (code pointers, TODOs, commands)? I can generate that file next — tell me which app to deep-dive first.
---
