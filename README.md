# HatchOS

---

## Project snapshot
- Main backend: [`server.py`](server.py)  
- ADB control: [`adb_service.py`](adb_service.py)  
- Master apps index: [`APPS_OVERVIEW.md`](APPS_OVERVIEW.md)  
- Cleanup / status docs: [`CLEANUP_SUMMARY.md`](CLEANUP_SUMMARY.md), [`FIXES_COMPLETE.md`](FIXES_COMPLETE.md)

---

## Hardware Setup (Raspberry Pi & Router)

### 1. Raspberry Pi Setup
**Hardware used:**
- Raspberry Pi 5 (8GB)
- HDMI display (52Pi Touch)
- Micro SD card (128GB)
- Camera module (CSI)
- PiDuino 27W Power Supply
- Custom Router (ASUS NUC-based)

**Setup steps:**
1. Flash **Raspberry Pi OS (64-bit)** or **Ubuntu Server** on the SD card using [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
2. Insert the SD card, connect the display, and power on the Pi.
3. Connect via Ethernet (preferred) or Wi-Fi.
4. Run updates:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

5. Enable required interfaces:

   ```bash
   sudo raspi-config
   ```

   * Go to *Interface Options*
   * Enable **Camera**, **SSH**, and **I2C**

6. Reboot once setup is complete:

   ```bash
   sudo reboot
   ```

---

### 2. Router Setup (Turning Off DHCP)

If you are using a **custom ASUS NUC router** or similar, disable DHCP to allow static IP assignments by the Pi:

1. Open your router’s web panel (usually `192.168.1.1` or `192.168.0.1`).
2. Log in using the admin credentials.
3. Go to **LAN Settings → DHCP Server**.
4. Turn **DHCP Server** → **OFF**.
5. Assign a static IP to your Raspberry Pi manually:

   ```bash
   sudo nano /etc/dhcpcd.conf
   ```

   Add at the end:

   ```
   interface eth0
   static ip_address=192.168.1.20/24
   static routers=192.168.1.1
   static domain_name_servers=8.8.8.8 8.8.4.4
   ```
6. Save and reboot the Pi.

---

## Key apps (quick links)

* **Messaging App (Expo, PWA, native build helpers)**

  * Android fix notes: [`APPS/MessagingApp/ANDROID_FIX_README.md`](APPS/MessagingApp/ANDROID_FIX_README.md)
  * Build instructions: [`APPS/MessagingApp/BUILD_INSTRUCTIONS.md`](APPS/MessagingApp/BUILD_INSTRUCTIONS.md)
  * Studio build script: [`APPS/MessagingApp/BUILD-WITH-STUDIO.bat`](APPS/MessagingApp/BUILD-WITH-STUDIO.bat)
  * Web build script: [`APPS/MessagingApp/BUILD-WEB-APP.bat`](APPS/MessagingApp/BUILD-WEB-APP.bat)
  * PWA docs: [`APPS/MessagingApp/PWA_README.md`](APPS/MessagingApp/PWA_README.md)
  * Public/tunnel notes: [`APPS/MessagingApp/PUBLIC_URL_SETUP.txt`](APPS/MessagingApp/PUBLIC_URL_SETUP.txt)
  * Chat screen: [`APPS/MessagingApp/src/screens/ChatScreen.js`](APPS/MessagingApp/src/screens/ChatScreen.js)

* **Hatch Wall (on-device firewall / AI detection)**

  * Docs: [`APPS/HatchWall/README.md`](APPS/HatchWall/README.md)
  * Implementation summary: [`HATCH_WALL_COMPLETE.md`](HATCH_WALL_COMPLETE.md)
  * Quickstart: [`HATCH_WALL_QUICKSTART.md`](HATCH_WALL_QUICKSTART.md)
  * Admin dashboard: [`admin/dashboard.js`](admin/dashboard.js), [`admin/hatch-wall.html`](admin/hatch-wall.html)

* **HatchOS Core / MyClass / Other Apps**

  * Core: [`APPS/HatchOSCore/README.md`](APPS/HatchOSCore/README.md)
  * MyClass: [`APPS/MyClass/src/screens/HatchyScreen.js`](APPS/MyClass/src/screens/HatchyScreen.js), [`APPS/MyClass/seed_myclass.py`](APPS/MyClass/seed_myclass.py)
  * Shine Insight (web): [`APPS/hatch-shine-insight/src/pages/Index.tsx`](APPS/hatch-shine-insight/src/pages/Index.tsx)

---

## Running Apps (Development Setup)

1. Navigate into the app folder:

   ```bash
   cd APPS/MessagingApp
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Run the app in development mode:

   ```bash
   npm run dev
   ```

   or for React Native apps using Expo:

   ```bash
   npx expo start
   ```
4. For PWA builds:

   ```bash
   npm run build
   ```

   The output will be in the `/dist` or `/build` directory.

---

## Building APK (Expo)

If you want to convert any React Native or Expo app into an APK:

```bash
npx expo build:android
```

To create a local dev build:

```bash
eas build -p android --profile development
```

After building, install the APK on your device via ADB:

```bash
adb install your_app.apk
```

---

## Lockfiles / binary blobs

* [`APPS/hatchy-web-guard/bun.lockb`](APPS/hatchy-web-guard/bun.lockb)
* [`APPS/hatch-shine-insight/bun.lockb`](APPS/hatch-shine-insight/bun.lockb)
* [`APPS/hatch-smart-cal/bun.lockb`](APPS/hatch-smart-cal/bun.lockb)
* [`APPS/hatchy-privacy-ai/bun.lockb`](APPS/hatchy-privacy-ai/bun.lockb)
  Do **not edit directly**. These files store package versions for reproducible builds.

---

## Useful scripts & guides

* HTTPS setup for PWAs: [`FULL_PWA_LOCALHOST_SETUP.md`](FULL_PWA_LOCALHOST_SETUP.md)
* Final setup & certificates: [`FINAL_SETUP_INSTRUCTIONS.txt`](FINAL_SETUP_INSTRUCTIONS.txt)
* Messaging quick run guide: [`APPS/MessagingApp/PUBLIC_URL_SETUP.txt`](APPS/MessagingApp/PUBLIC_URL_SETUP.txt)

---

## Where to start

1. Start backend → [`server.py`](server.py)
2. Open app overview → [`APPS_OVERVIEW.md`](APPS_OVERVIEW.md)
3. For Messaging app → follow [`APPS/MessagingApp/BUILD_INSTRUCTIONS.md`](APPS/MessagingApp/BUILD_INSTRUCTIONS.md)

---
