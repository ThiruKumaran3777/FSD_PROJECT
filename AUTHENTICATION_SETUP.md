# Authentication Setup Guide

## ✅ All Authentication Errors Fixed!

### What Was Fixed:

1. **Backend Port Configuration**
   - Changed default port from 5000 to 5001 to match frontend
   - Updated server.js to use PORT 5001 by default

2. **JWT Secret Handling**
   - Added fallback JWT_SECRET if not set in .env
   - Updated auth middleware to handle missing JWT_SECRET gracefully
   - Added warning messages for missing JWT_SECRET

3. **Error Handling Improvements**
   - Enhanced error messages in login/signup controllers
   - Better error propagation from backend to frontend
   - Added validation error handling
   - Improved error display in UI

4. **Frontend Auth Context**
   - Added proper error handling in login/signup functions
   - Better error logging for debugging
   - Improved response validation

5. **UI Error Display**
   - Better error messages shown to users
   - More descriptive error text
   - Proper error state handling

## 📋 Setup Instructions

### 1. Backend Setup

Create a `.env` file in the `backend/` folder:

```bash
PORT=5001
MONGODB_URI=mongodb://localhost:27017/course_feedback
JWT_SECRET=your_strong_jwt_secret_here_change_this_in_production
CLIENT_ORIGIN=http://localhost:5175
NODE_ENV=development
```

**Important:** Replace `your_strong_jwt_secret_here_change_this_in_production` with a strong random string for production!

### 2. Start Backend

```powershell
cd backend
npm install
npm run dev
```

You should see:
```
Server listening on port 5001
MongoDB connected: localhost/course_feedback
```

### 3. Start Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the URL shown (usually `http://localhost:5175`)

## 🔐 How to Use Authentication

### Sign Up (Create Account)

1. Go to `/signup` or click "Create an account"
2. Choose your role: **Student** or **Faculty**
3. Fill in:
   - Full name
   - University email
   - Password
4. Click "Sign up as [Role]"
5. **Faculty** users will be redirected to `/faculty` dashboard
6. **Student** users will be redirected to `/login`

### Sign In (Login)

1. Go to `/login`
2. Enter your email and password
3. Click "Sign in"
4. **Faculty/Admin** users will be redirected to `/faculty` dashboard
5. **Student** users stay on login page (they use course links for feedback)

## 🐛 Troubleshooting

### "Unable to login" Error

- Check that backend is running on port 5001
- Check browser console for detailed error messages
- Verify MongoDB is running and connected
- Check that email/password are correct

### "Email already in use" Error

- This email is already registered
- Try logging in instead, or use a different email

### "Invalid credentials" Error

- Double-check your email and password
- Make sure you're using the correct account

### Backend Not Starting

- Check if port 5001 is already in use:
  ```powershell
  netstat -aon | findstr :5001
  ```
- Kill the process if needed:
  ```powershell
  taskkill /PID <PID> /F
  ```

### MongoDB Connection Issues

- Make sure MongoDB is running locally
- Verify connection string: `mongodb://localhost:27017/course_feedback`
- Check MongoDB Compass can connect

## ✅ Testing Authentication

1. **Test Signup:**
   - Go to `/signup`
   - Create a new Faculty account
   - Should redirect to `/faculty` dashboard

2. **Test Login:**
   - Go to `/login`
   - Use the credentials you just created
   - Should redirect to `/faculty` dashboard

3. **Test Protected Routes:**
   - Try accessing `/faculty` without logging in
   - Should redirect to `/login`
   - After login, should access `/faculty` successfully

## 🎯 Next Steps

After successful authentication:
- Faculty can create courses
- Faculty can view live feedback
- Students can submit feedback via course links
- All features are now accessible!
