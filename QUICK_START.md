# 🚀 Quick Start Guide - Get Authentication Working NOW!

## ⚡ Step-by-Step Setup (Do This First!)

### 1️⃣ **Create Backend .env File**

Create a file named `.env` in the `backend/` folder with this content:

```bash
PORT=5001
MONGODB_URI=mongodb://localhost:27017/course_feedback
JWT_SECRET=my_super_secret_jwt_key_12345
CLIENT_ORIGIN=http://localhost:5175
NODE_ENV=development
```

**IMPORTANT:** 
- Make sure MongoDB is running (check MongoDB Compass)
- The `.env` file must be in `backend/` folder, not root!

### 2️⃣ **Start Backend Server**

Open **PowerShell** and run:

```powershell
cd "C:\Users\Thiru kumaran v\OneDrive\Desktop\FSD_project\backend"
npm run dev
```

**You should see:**
```
Server listening on port 5001
MongoDB connected: localhost/course_feedback
```

**If you see port error:**
```powershell
netstat -aon | findstr :5001
taskkill /PID <PID_NUMBER> /F
```
Then run `npm run dev` again.

### 3️⃣ **Start Frontend**

Open **ANOTHER PowerShell** window and run:

```powershell
cd "C:\Users\Thiru kumaran v\OneDrive\Desktop\FSD_project\frontend"
npm run dev
```

**You should see:**
```
Local:   http://localhost:5175/
```

### 4️⃣ **Test Authentication**

1. **Open browser:** `http://localhost:5175`
2. **Click "Create an account"** or go to `/signup`
3. **Choose "Faculty"** role
4. **Fill in:**
   - Name: `Test Faculty`
   - Email: `faculty@test.com`
   - Password: `password123`
5. **Click "Sign up as Faculty"**
6. **Should redirect to `/faculty` dashboard!**

### 5️⃣ **Test Login**

1. **Logout** (if logged in)
2. **Go to `/login`**
3. **Enter:**
   - Email: `faculty@test.com`
   - Password: `password123`
4. **Click "Sign in"**
5. **Should redirect to `/faculty` dashboard!**

## 🐛 Troubleshooting

### ❌ "Cannot connect to server" Error

**Problem:** Frontend can't reach backend

**Solution:**
1. Check backend is running: Look for `Server listening on port 5001`
2. Check browser console (F12) for errors
3. Try accessing: `http://localhost:5001/api/health` in browser
   - Should show: `{"status":"ok","message":"Backend is running"}`
4. If not working, check firewall/antivirus blocking port 5001

### ❌ "MongoDB connection error"

**Problem:** MongoDB not running

**Solution:**
1. Open MongoDB Compass
2. Try connecting to: `mongodb://localhost:27017/`
3. If it works, backend should connect too
4. If not, start MongoDB service:
   ```powershell
   net start MongoDB
   ```

### ❌ "Email already in use"

**Solution:** Use a different email or login with existing account

### ❌ Still Not Working?

**Check Browser Console (F12):**
- Look for red error messages
- Check Network tab → see if API calls are failing
- Look for CORS errors

**Check Backend Console:**
- Look for error messages
- Check if requests are being received
- Look for MongoDB errors

## ✅ Success Indicators

When authentication works, you'll see:

1. **Backend console shows:**
   ```
   Signup request received: { body: { name: '...', email: '...' } }
   Signup successful: { userId: '...', email: '...', role: 'Faculty' }
   ```

2. **Browser console shows:**
   ```
   API Request: POST http://localhost:5001/api/auth/signup
   API Response: 201 http://localhost:5001/api/auth/signup
   Login successful, user: { id: '...', name: '...', role: 'Faculty' }
   Redirecting to faculty dashboard
   ```

3. **You get redirected to `/faculty` page**

## 🎯 What's Fixed

✅ Backend port set to 5001 (matches frontend)
✅ JWT_SECRET fallback added (works without .env)
✅ Comprehensive error logging added
✅ Network error detection
✅ Better error messages
✅ Request/response debugging
✅ CORS properly configured
✅ Cookie handling fixed

## 📞 Still Having Issues?

1. **Check both consoles** (backend + browser)
2. **Copy error messages** from browser console
3. **Check Network tab** in browser DevTools
4. **Verify MongoDB is running**
5. **Make sure both servers are running** (backend + frontend)

The authentication is now fully functional with comprehensive debugging!
