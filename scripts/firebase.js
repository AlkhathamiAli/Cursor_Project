/**
 * Firebase Configuration and Initialization
 * 
 * IMPORTANT: Replace the firebaseConfig values with your own Firebase project credentials.
 * To get your Firebase config:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project or select an existing one
 * 3. Go to Project Settings > General
 * 4. Scroll down to "Your apps" and click "Web" (</> icon)
 * 5. Copy the firebaseConfig object
 */

// Firebase Configuration
// IMPORTANT: Replace these values with your actual Firebase credentials
// To disable Firebase and use localStorage only, keep these placeholder values
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Check if Firebase is properly configured
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && 
                              firebaseConfig.apiKey.length > 10;

// Initialize Firebase
let firebaseApp = null;
let auth = null;
let db = null;
let isFirebaseEnabled = false;

try {
  // Only initialize Firebase if properly configured
  if (!isFirebaseConfigured) {
    console.log('[Firebase] Not configured. Using localStorage authentication.');
    isFirebaseEnabled = false;
  } else if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    
    // Enable Firebase persistence
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => {
        console.log('[Firebase] Session persistence enabled');
        isFirebaseEnabled = true;
      })
      .catch((error) => {
        console.error('[Firebase] Persistence error:', error);
        isFirebaseEnabled = false;
      });
    
    console.log('[Firebase] Initialized successfully');
  } else if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
    // Firebase already initialized
    firebaseApp = firebase.apps[0];
    auth = firebase.auth();
    db = firebase.firestore();
    isFirebaseEnabled = true;
    console.log('[Firebase] Using existing Firebase instance');
  } else {
    console.warn('[Firebase] Firebase SDK not loaded');
    isFirebaseEnabled = false;
  }
} catch (error) {
  console.error('[Firebase] Initialization error:', error);
  console.log('[Firebase] Falling back to localStorage authentication');
  isFirebaseEnabled = false;
}

/**
 * Firebase Authentication Helper Functions
 */

// Show loading spinner
function showLoading(message = 'Please wait...') {
  const overlay = document.getElementById('loadingOverlay');
  const text = document.getElementById('loadingText');
  if (overlay) {
    overlay.classList.add('active');
    if (text && message) {
      text.textContent = message;
    }
  }
}

// Hide loading spinner
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

// Create user account with Firebase
async function createUserAccount(email, password, firstName, lastName) {
  if (!isFirebaseEnabled || !auth || !db) {
    throw new Error('Firebase is not enabled. Please configure Firebase or use localStorage fallback.');
  }

  try {
    showLoading('Creating your account...');
    
    // Create user with Firebase Authentication
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Update display name
    await user.updateProfile({
      displayName: `${firstName} ${lastName}`.trim()
    });
    
    // Save user info to Firestore
    const userData = {
      uid: user.uid,
      email: email,
      firstName: firstName,
      lastName: lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(user.uid).set(userData);
    
    console.log('[Firebase] User account created successfully:', user.uid);
    hideLoading();
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        ...userData
      }
    };
  } catch (error) {
    hideLoading();
    console.error('[Firebase] Sign up error:', error);
    
    // Map Firebase errors to user-friendly messages
    let errorMessage = 'Failed to create account. Please try again.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'This email is already registered. Please log in instead.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password should be at least 6 characters long.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your connection and try again.';
        break;
    }
    
    return {
      success: false,
      error: errorMessage,
      errorCode: error.code
    };
  }
}

// Sign in user with Firebase
async function signInUser(email, password) {
  if (!isFirebaseEnabled || !auth || !db) {
    throw new Error('Firebase is not enabled. Please configure Firebase or use localStorage fallback.');
  }

  try {
    showLoading('Signing you in...');
    
    // Sign in with Firebase Authentication
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Update last login timestamp in Firestore
    await db.collection('users').doc(user.uid).update({
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    console.log('[Firebase] User signed in successfully:', user.uid);
    hideLoading();
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        ...userData
      }
    };
  } catch (error) {
    hideLoading();
    console.error('[Firebase] Sign in error:', error);
    
    // Map Firebase errors to user-friendly messages
    let errorMessage = 'Failed to sign in. Please try again.';
    
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        errorMessage = 'Invalid email or password. Please try again.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled. Please contact support.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your connection and try again.';
        break;
    }
    
    return {
      success: false,
      error: errorMessage,
      errorCode: error.code
    };
  }
}

// Sign out user
async function signOutUser() {
  if (!isFirebaseEnabled || !auth) {
    // Clear localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('guest');
    return { success: true };
  }

  try {
    await auth.signOut();
    localStorage.removeItem('currentUser');
    localStorage.removeItem('guest');
    console.log('[Firebase] User signed out successfully');
    return { success: true };
  } catch (error) {
    console.error('[Firebase] Sign out error:', error);
    return {
      success: false,
      error: 'Failed to sign out. Please try again.'
    };
  }
}

// Check if user is authenticated
function onAuthStateChanged(callback) {
  if (!isFirebaseEnabled || !auth) {
    // Fallback to localStorage check
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const isGuest = localStorage.getItem('guest') === 'true';
    callback(currentUser || (isGuest ? { guest: true } : null));
    return;
  }

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // User is signed in
      try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        
        const currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          ...userData
        };
        
        // Save to localStorage for compatibility
        localStorage.setItem('currentUser', JSON.stringify({
          userID: user.uid,
          email: user.email,
          username: user.displayName || userData.fullName || user.email,
          fullName: userData.fullName || user.displayName,
          firstName: userData.firstName || '',
          lastName: userData.lastName || ''
        }));
        
        callback(currentUser);
      } catch (error) {
        console.error('[Firebase] Error fetching user data:', error);
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
      }
    } else {
      // User is signed out
      const isGuest = localStorage.getItem('guest') === 'true';
      callback(isGuest ? { guest: true } : null);
    }
  });
}

// Reset password (send email)
async function sendPasswordResetEmail(email) {
  if (!isFirebaseEnabled || !auth) {
    throw new Error('Firebase is not enabled. Please use the localStorage fallback.');
  }

  try {
    showLoading('Sending password reset email...');
    await auth.sendPasswordResetEmail(email);
    hideLoading();
    
    return {
      success: true,
      message: 'Password reset email sent. Please check your inbox.'
    };
  } catch (error) {
    hideLoading();
    console.error('[Firebase] Password reset error:', error);
    
    let errorMessage = 'Failed to send password reset email.';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email address.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your connection and try again.';
        break;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

// Make functions globally available
window.FirebaseAuth = {
  createUserAccount,
  signInUser,
  signOutUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  isEnabled: () => isFirebaseEnabled,
  showLoading,
  hideLoading
};

console.log('[Firebase] Auth helpers loaded. Firebase enabled:', isFirebaseEnabled);

