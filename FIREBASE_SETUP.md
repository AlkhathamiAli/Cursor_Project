# Firebase Authentication Setup Guide

## Overview

Aramco Digital SlideMaker now supports real user accounts with Firebase Authentication and Firestore database. This allows users to:

- Create accounts that work on any device
- Securely store passwords (hashed by Firebase)
- Sync data across devices
- Reset passwords via email
- Have persistent sessions

## Setup Instructions

### Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select an existing project
3. Enter a project name (e.g., "Aramco SlideMaker")
4. Click **Continue** and follow the setup wizard
5. Click **Create project**

### Step 2: Enable Authentication

1. In the Firebase Console, click **Authentication** in the left sidebar
2. Click **Get Started**
3. Go to the **Sign-in method** tab
4. Click on **Email/Password**
5. Toggle **Enable** to ON
6. Click **Save**

### Step 3: Create Firestore Database

1. In the Firebase Console, click **Firestore Database** in the left sidebar
2. Click **Create database**
3. Select **Start in test mode** (for development)
   - **Important for Production**: Change rules to secure your data later
4. Choose a Cloud Firestore location (select the closest to your users)
5. Click **Enable**

### Step 4: Get Your Firebase Configuration

1. In the Firebase Console, click the **gear icon** (⚙️) next to "Project Overview"
2. Select **Project settings**
3. Scroll down to **"Your apps"** section
4. Click the **Web** icon (`</>`) to add a web app
5. Register your app with a nickname (e.g., "SlideMaker Web")
6. Click **Register app**
7. Copy the `firebaseConfig` object

### Step 5: Configure Your Application

1. Open `scripts/firebase.js` in your project
2. Replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

3. Save the file

### Step 6: Update Firestore Security Rules (Production)

For production, update your Firestore rules to secure user data:

1. Go to **Firestore Database** > **Rules** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Add additional rules for other collections as needed
  }
}
```

3. Click **Publish**

## Features

### 1. Sign Up (Create Account)

- Users can create accounts with email and password
- Minimum password length: 6 characters
- User data is stored in Firestore: `users/{uid}`
- Automatic password hashing by Firebase

### 2. Login

- Users can log in with email and password
- Session persists across tabs and browser restarts
- Option to "Remember this device"
- Recent users list for quick access

### 3. Password Reset

- **With Firebase**: Email-based password reset
- Users receive a link to reset their password
- Secure reset flow managed by Firebase

### 4. Visitor Mode

- Users can continue without creating an account
- Visitor ID stored in localStorage
- No authentication required

### 5. Error Handling

The system provides user-friendly error messages for:

- ✅ Email already registered
- ✅ Invalid email format
- ✅ Wrong password
- ✅ Network issues
- ✅ Weak passwords
- ✅ Account not found

## Fallback Mode

If Firebase is not configured or fails to load, the application automatically falls back to **localStorage authentication**:

- User accounts stored locally in browser
- Works offline
- No cross-device sync
- Plain text passwords (not recommended for production)

## Testing Your Setup

### Test 1: Sign Up

1. Go to `index.html`
2. Click **"Sign Up"**
3. Fill in the form:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Password: password123
4. Click **"Finish"**
5. You should be redirected to Home.html

### Test 2: Check Firebase Console

1. Go to Firebase Console > Authentication
2. You should see the new user listed
3. Go to Firestore Database
4. You should see a document in `users/{uid}` with user data

### Test 3: Login

1. Sign out from the app
2. Go back to `index.html`
3. Click **"Log In"**
4. Enter your email and password
5. Click **"Log In"**
6. You should be redirected to Home.html

### Test 4: Password Reset

1. Go to `index.html`
2. Click **"Log In"**
3. Click **"Forget Password?"**
4. Enter your email
5. Click **"Reset Password"**
6. Check your email inbox for the reset link

## Deployment Considerations

### Security Best Practices

1. **Never commit your Firebase config to public repositories** if it contains sensitive data
2. Use Firebase App Check to prevent API abuse
3. Update Firestore security rules for production
4. Enable Firebase Authentication email verification
5. Set up rate limiting to prevent brute force attacks

### Environment Variables (Optional)

For better security, consider using environment variables:

```javascript
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  // ... etc
};
```

### CORS and Domain Restrictions

1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**
2. Add your production domain (e.g., `yourdomain.com`)
3. This prevents unauthorized domains from using your Firebase project

## Troubleshooting

### Issue: "Firebase is not defined"

**Solution**: Make sure the Firebase SDK scripts are loaded before `scripts/firebase.js`

### Issue: "Permission denied" in Firestore

**Solution**: Check your Firestore security rules. In development, you can use test mode, but update rules for production.

### Issue: Password reset email not received

**Solution**: 
1. Check spam folder
2. Verify email settings in Firebase Console > Authentication > Templates
3. Configure a custom email template if needed

### Issue: "Network error"

**Solution**: 
1. Check your internet connection
2. Verify Firebase project is active
3. Check browser console for CORS errors

## Support

For more information:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)

## License

This authentication system is part of Aramco Digital SlideMaker.

