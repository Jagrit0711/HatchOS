# 🔒 How to Accept Self-Signed Certificate in Chrome

## 📱 **On Your Laptop (Windows Chrome):**

### **Step 1: Visit the HTTPS URL**
1. Open Chrome
2. Type in address bar: `https://192.168.29.164:5000`
3. Press Enter

### **Step 2: You'll See This Screen:**
```
⚠️ Your connection is not private

Attackers might be trying to steal your information from 
192.168.29.164 (for example, passwords, messages, or credit cards).

NET::ERR_CERT_AUTHORITY_INVALID

[Back to safety]
```

### **Step 3: Click "Advanced" Link**
- Look at the **bottom left** of the warning page
- You'll see small text: **"Advanced"**
- **Click it**

### **Step 4: Click "Proceed" Link**
After clicking Advanced, you'll see:
```
This server could not prove that it is 192.168.29.164; 
its security certificate is not trusted by your computer's 
operating system.

[Proceed to 192.168.29.164 (unsafe)]
```

- Click **"Proceed to 192.168.29.164 (unsafe)"**
- ✅ **Page loads!** You'll see JSON data like: `[{id: "...", name: "...", email: "..."}]`

---

## 📱 **On Android Phone (Chrome):**

### **Step 1: Visit the HTTPS URL**
1. Open Chrome app
2. Type: `https://192.168.29.164:5000`
3. Press Go

### **Step 2: You'll See Red Warning Screen:**
```
⚠️ Your connection is not private
Attackers might be trying to steal your information...

NET::ERR_CERT_AUTHORITY_INVALID
```

### **Step 3: Tap "Advanced" (bottom of screen)**
- Small gray text at bottom
- **Tap "Advanced"**

### **Step 4: Tap "Proceed" Link**
You'll see blue link:
```
Proceed to 192.168.29.164 (unsafe)
```
- **Tap it**
- ✅ **Page loads!**

---

## 🔍 **Alternative Method (Type Special Code):**

If you **DON'T see "Advanced" button:**

### **On Laptop:**
1. When on the red warning screen
2. **Type on your keyboard:** `thisisunsafe`
3. Don't type in a box - just type it anywhere on the page
4. ✅ **Page automatically loads!**

### **On Android:**
1. On the red warning screen
2. Can't type the code on mobile 😞
3. **Solution:** Use method below

---

## 🔧 **If "Advanced" Button Missing:**

### **Method 1: Chrome Flags (Laptop)**
1. Open new tab
2. Visit: `chrome://flags/#allow-insecure-localhost`
3. Set to: **"Enabled"**
4. Click **"Relaunch"**
5. Try again

### **Method 2: Add Certificate Exception (Laptop)**
1. Visit: `chrome://settings/certificates`
2. Click **"Authorities"** tab
3. Click **"Import"**
4. Select: `C:\Users\jagri\OneDrive\Documents\HatchOS\ssl_certs\cert.pem`
5. Check **"Trust this certificate for identifying websites"**
6. Click **"OK"**
7. ✅ **No more warnings!**

---

## 🎯 **Quick Test Right Now:**

### **Test Backend:**
1. Open Chrome
2. Visit: `https://192.168.29.164:5000`
3. Look for "Advanced" at **bottom left**
4. Click it, then click "Proceed"
5. Should see: `[...]` (JSON user array)

### **Then Test Frontend:**
1. Start Expo: `npx expo start --web --host lan --port 19006 --https --clear`
2. Visit: `https://192.168.29.164:19006`
3. Accept certificate again (same steps)
4. ✅ **App loads!**

---

## 📸 **Visual Guide:**

```
┌─────────────────────────────────────┐
│  ⚠️ Your connection is not private  │
│                                     │
│  NET::ERR_CERT_AUTHORITY_INVALID   │
│                                     │
│                                     │
│  [Back to safety]                  │
│                                     │
│  Advanced  ← CLICK HERE            │ ← Look at bottom left!
└─────────────────────────────────────┘

After clicking "Advanced":

┌─────────────────────────────────────┐
│  This server could not prove...     │
│                                     │
│  Proceed to 192.168.29.164 (unsafe)│ ← CLICK THIS LINK
└─────────────────────────────────────┘
```

---

## ⚡ **Super Quick Method (Laptop Only):**

When you see the red warning screen:
1. **Don't click anything**
2. **Just type:** `thisisunsafe`
3. ✅ **Boom! Page loads!**

(This is a Chrome hidden feature - literally type the word "thisisunsafe" and it bypasses the warning)

---

## 🤔 **Still Can't Find It?**

**Take a screenshot and send it to me!** Or try:

1. Update Chrome to latest version
2. Try in **Incognito mode** (Ctrl+Shift+N)
3. Try **Edge browser** instead (works same way)
4. Or use the certificate import method above (permanent fix)

---

## ✅ **Once You Accept:**

- Certificate is remembered for this IP
- Won't ask again (until certificate expires in 1 year)
- Works for both laptop and phone
- Completely safe - it's YOUR certificate on YOUR network

**Try it now!** Visit `https://192.168.29.164:5000` and look for that "Advanced" link at the bottom left of the screen!
