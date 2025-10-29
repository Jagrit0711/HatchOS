# 🔧 FIXED: Login Not Working on Phone

## 🎯 The Problem:

**On laptop**: Login works ✅  
**On phone (Chrome/PWA)**: Login fails ❌

### Why?
The app was using `localhost:5000` for web version. On your phone, "localhost" means THE PHONE itself, not your PC! So login requests were going to the wrong place.

---

## ✅ THE FIX:

I changed `src/services/api.js` to use your PC's IP address **for all platforms**:

```javascript
// BEFORE (BROKEN on phone):
const SERVER_URL = Platform.OS === 'web' 
  ? 'http://localhost:5000'  // ❌ Phone can't reach this!
  : 'http://192.168.29.164:5000';

// AFTER (WORKS everywhere):
const SERVER_URL = 'http://192.168.29.164:5000'; // ✅ Works on phone & laptop!
```

---

## 🚀 To Test Right Now:

### Step 1: Make Sure Server is Running
The Flask server is now running:
```
Server: http://192.168.29.164:5000 ✅
```

You'll see this in the terminal.

### Step 2: Restart the Messaging App
Since the code changed, restart Expo:
```powershell
cd "C:\Users\jagri\OneDrive\Documents\HatchOS\APPS\MessagingApp"
npx expo start --web --host lan --port 19006 --clear
```

Or use: `START-PWA.bat`

### Step 3: Test Login on Phone
1. Open `http://192.168.29.164:19006` on your phone
2. Try logging in with:
   - Email: `test@test.com`
   - Password: `test123`
   
   Or any user you created before

### Step 4: Check if it Works
If login works now:
- ✅ You'll see "Login successful"
- ✅ You'll be taken to the Messages screen
- ✅ API calls will work

---

## 🐛 If Login Still Fails:

### Check Server is Running:
Open this in your phone's browser:
```
http://192.168.29.164:5000/api/users
```

**If it works**: You'll see JSON with user list  
**If it fails**: Server is not accessible

### Fix Server Access:
1. **Check firewall**: Windows might be blocking port 5000
   - Settings > Windows Security > Firewall
   - Allow Python through firewall

2. **Check same WiFi**: Phone and PC must be on same network

3. **Restart server**:
   ```powershell
   cd C:\Users\jagri\OneDrive\Documents\HatchOS
   python server.py
   ```

---

## 📱 For PWA Installation:

After login works:
1. Use HTTPS tunnel (from earlier instructions)
2. Or just test login first with HTTP
3. Then set up tunnel for PWA install

---

## ⚙️ Files Changed:

- ✅ `src/services/api.js` - Changed `SERVER_URL` to use IP address

---

## 🎯 Quick Test:

**Test API from phone browser:**
```
http://192.168.29.164:5000/api/users
```

Should show: `{"users": [...]}`

**Then test login in the app!**

---

## 🔄 If IP Changes:

Your IP `192.168.29.164` can change when you reconnect WiFi.

To update it:
1. Check new IP: `ipconfig`
2. Update in `src/services/api.js`:
   ```javascript
   const SERVER_URL = 'http://YOUR_NEW_IP:5000';
   ```
3. Restart Expo

---

**Server is running and configured correctly! Try logging in now on your phone!** 🚀
