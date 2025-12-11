# Google OAuth 2.0 Authentication - Complete Flow Explained

## 🎯 Overview

When a user clicks "Login with Google", this is what happens behind the scenes:

```
User → Your App → Google → Your App → Database → JWT Token → User
```

---

## 📊 Complete Flow Diagram

```
┌─────────────┐
│   Browser   │
│   (User)    │
└──────┬──────┘
       │
       │ 1. User clicks "Login with Google"
       │ GET http://localhost:3001/api/auth/google
       ▼
┌─────────────────────────────────────────────┐
│  authRoutes.js                              │
│  router.get("/google", ...)                 │
└──────┬──────────────────────────────────────┘
       │
       │ 2. Passport intercepts the request
       ▼
┌─────────────────────────────────────────────┐
│  oauth.js                                   │
│  passport.use(new GoogleStrategy(...))      │
└──────┬──────────────────────────────────────┘
       │
       │ 3. Redirects to Google OAuth consent screen
       │ URL: https://accounts.google.com/o/oauth2/v2/auth?
       │      client_id=YOUR_CLIENT_ID&
       │      redirect_uri=http://localhost:3001/api/auth/google/callback&
       │      scope=profile email gmail.send
       ▼
┌─────────────────────────────────────────────┐
│         Google Login Page                   │
│  - User enters email/password               │
│  - User grants permissions                  │
└──────┬──────────────────────────────────────┘
       │
       │ 4. Google redirects back with authorization code
       │ GET http://localhost:3001/api/auth/google/callback?code=ABC123...
       ▼
┌─────────────────────────────────────────────┐
│  authRoutes.js                              │
│  router.get("/google/callback", ...)        │
└──────┬──────────────────────────────────────┘
       │
       │ 5. Passport exchanges code for tokens
       ▼
┌─────────────────────────────────────────────┐
│  oauth.js - GoogleStrategy callback         │
│  async (accessToken, refreshToken,          │
│         profile, done) => { ... }           │
└──────┬──────────────────────────────────────┘
       │
       │ 6. Check if user exists in database
       ▼
┌─────────────────────────────────────────────┐
│         MySQL Database                      │
│  SELECT * FROM users WHERE googleId=?       │
└──────┬──────────────────────────────────────┘
       │
       ├─── User NOT found ───────┐
       │                          │
       │                          │ 7a. Create new user
       │                          ▼
       │                    ┌──────────────────┐
       │                    │  User.create()   │
       │                    │  - googleId      │
       │                    │  - email         │
       │                    │  - name          │
       │                    │  - accessToken   │
       │                    │  - refreshToken  │
       │                    └────────┬─────────┘
       │                             │
       ├─── User FOUND ──────────────┤
       │                             │
       │    7b. Update tokens        │
       │         │                   │
       │         ▼                   │
       │    ┌──────────────────┐    │
       │    │  user.update()   │    │
       │    │  - accessToken   │    │
       │    │  - refreshToken  │    │
       │    └────────┬─────────┘    │
       │             │               │
       │             └───────────────┘
       │
       │ 8. Return user object to passport
       │ done(null, user)
       ▼
┌─────────────────────────────────────────────┐
│  authController.js - googleCallback         │
│  const user = req.user                      │
└──────┬──────────────────────────────────────┘
       │
       │ 9. Generate JWT token
       ▼
┌─────────────────────────────────────────────┐
│  jwt.sign({ userId, email }, JWT_SECRET)    │
└──────┬──────────────────────────────────────┘
       │
       │ 10. Redirect to frontend with token
       │ http://localhost:3000/auth/callback?token=eyJhbGc...
       ▼
┌─────────────────────────────────────────────┐
│         Frontend (React)                    │
│  - Extract token from URL                   │
│  - Save token to localStorage               │
│  - Use token for API requests               │
└─────────────────────────────────────────────┘
```

---

## 🔥 Code Execution - Step by Step

### **STEP 1: User Clicks Login**

**File:** `authRoutes.js`

```javascript
router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email", 'https://www.googleapis.com/auth/gmail.send'],
    accessType: 'offline',
    prompt: 'consent'
}))
```

**What happens:**
1. ✅ User visits: `http://localhost:3001/api/auth/google`
2. ✅ Express router catches this route
3. ✅ `passport.authenticate("google", ...)` is called
4. ✅ Passport looks for a strategy named "google"

---

### **STEP 2: Passport Finds Google Strategy**

**File:** `oauth.js`

```javascript
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.send'],
      accessType: 'offline',
      prompt: 'consent'
    },
    async (accessToken, refreshToken, profile, done) => {
      // This callback runs LATER (after Google redirects back)
    }
  )
);
```

**What happens:**
1. ✅ Passport finds the GoogleStrategy configuration
2. ✅ Uses `clientID` and `clientSecret` from `.env`
3. ✅ Builds authorization URL
4. ✅ Redirects user to Google login page

**Generated URL looks like:**
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=800114566429-0eh9uh1gl1mjf6g1q6cloj730ptpl465.apps.googleusercontent.com&
  redirect_uri=http://localhost:3001/api/auth/google/callback&
  response_type=code&
  scope=profile email https://www.googleapis.com/auth/gmail.send&
  access_type=offline&
  prompt=consent
```

---

### **STEP 3: User Logs in at Google**

**Location:** Google's servers

**What happens:**
1. ✅ User sees Google login page
2. ✅ User enters email and password
3. ✅ Google asks: "App wants to access your profile, email, and Gmail"
4. ✅ User clicks "Allow"
5. ✅ Google generates an **authorization code**
6. ✅ Google redirects back to your app with the code

**Redirect URL:**
```
http://localhost:3001/api/auth/google/callback?code=4/0AVG7fiQ8xYz...
```

---

### **STEP 4: Callback Route Catches Response**

**File:** `authRoutes.js`

```javascript
router.get("/google/callback", 
  passport.authenticate("google", {
    failureRedirect: "/auth/google/failure"
  }), 
  authController.googleCallback
);
```

**What happens:**
1. ✅ Express catches the `/api/auth/google/callback` route
2. ✅ `passport.authenticate("google")` is called AGAIN
3. ✅ But this time, passport sees the `code` parameter in the URL
4. ✅ Passport automatically exchanges the code for tokens

---

### **STEP 5: Passport Exchanges Code for Tokens**

**Behind the scenes (done by Passport automatically):**

Passport makes this request to Google:
```javascript
// Passport does this internally:
POST https://oauth2.googleapis.com/token
Content-Type: application/json

{
  "code": "4/0AVG7fiQ8xYz...",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "redirect_uri": "http://localhost:3001/api/auth/google/callback",
  "grant_type": "authorization_code"
}
```

**Google responds with:**
```json
{
  "access_token": "ya29.a0AfB_byC...",
  "refresh_token": "1//0gL3qZ8xYz...",
  "expires_in": 3599,
  "scope": "profile email https://www.googleapis.com/auth/gmail.send",
  "token_type": "Bearer"
}
```

---

### **STEP 6: Strategy Callback Executes**

**File:** `oauth.js`

```javascript
async (accessToken, refreshToken, profile, done) => {
  // ← THIS CALLBACK RUNS NOW!
  
  try {
    // profile contains user info from Google
    console.log('Profile from Google:', profile);
    /*
    {
      id: '103845729384756',
      displayName: 'John Doe',
      emails: [{ value: 'john@gmail.com', verified: true }],
      photos: [{ value: 'https://lh3.googleusercontent.com/...' }]
    }
    */
    
    // Step 6.1: Check if user exists
    let user = await User.findOne({
      where: { googleId: profile.id }
    });

    if (!user) {
      // Step 6.2: User doesn't exist, create new one
      console.log('Creating new user...');
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        profilePicture: profile.photos[0]?.value,
        accessToken: accessToken,
        refreshToken: refreshToken
      });
      console.log('New user created:', user.id);
    } else {
      // Step 6.3: User exists, update tokens
      console.log('User exists, updating tokens...');
      await user.update({
        accessToken: accessToken,
        refreshToken: refreshToken || user.refreshToken
      });
      console.log('Tokens updated for user:', user.id);
    }

    // Step 6.4: Tell passport authentication succeeded
    return done(null, user);
    
  } catch (error) {
    console.error('OAuth error:', error);
    return done(error, null);
  }
}
```

**What happens:**
1. ✅ Passport calls this callback with tokens and profile
2. ✅ Code checks database for existing user by `googleId`
3. ✅ If new user → `User.create()` saves to database
4. ✅ If existing user → `user.update()` updates tokens
5. ✅ `done(null, user)` tells passport: "Authentication successful!"

---

### **STEP 7: Passport Serialization**

**File:** `oauth.js`

```javascript
passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.id);
  done(null, user.id);
});
```

**What happens:**
1. ✅ Passport stores `user.id` in session
2. ✅ Session is stored in memory (or session store)
3. ✅ User object is attached to `req.user`

---

### **STEP 8: Controller Generates JWT**

**File:** `authController.js`

```javascript
exports.googleCallback = async (req, res) => {
  try {
    const user = req.user; // ← User from passport
    console.log('Authenticated user:', user.id);

    // Step 8.1: Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    console.log('JWT token generated');

    // Step 8.2: Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    
  } catch (error) {
    console.error('Auth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
  }
};
```

**What happens:**
1. ✅ `req.user` contains the user from database
2. ✅ JWT token is created with user info
3. ✅ Token is signed with `JWT_SECRET`
4. ✅ User is redirected to frontend with token in URL

**Redirect URL:**
```
http://localhost:3000/auth/callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### **STEP 9: Frontend Receives Token**

**Location:** Frontend (React app)

```javascript
// In your React app (e.g., CallbackPage.jsx)
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    console.log('Token received!');
    // Save token
    localStorage.setItem('authToken', token);
    // Redirect to dashboard
    navigate('/dashboard');
  }
}, []);
```

---

### **STEP 10: Using Token for API Requests**

**Every subsequent API request:**

```javascript
// In your frontend
const response = await fetch('http://localhost:3001/api/users/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Backend validates token:**

**File:** `authMiddleware.js`

```javascript
const authMiddleware = async (req, res, next) => {
  try {
    // Step 10.1: Extract token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required'
      });
    }

    // Step 10.2: Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { userId: 1, email: 'john@gmail.com', iat: ..., exp: ... }
    
    // Step 10.3: Get user from database
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Step 10.4: Attach user to request
    req.user = user;
    next(); // ← Continue to the actual route handler
    
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};
```

---

## 🎯 Summary - Complete Execution Order

| Step | File | Function | What It Does |
|------|------|----------|--------------|
| 1 | `authRoutes.js` | `router.get("/google")` | Initiates OAuth flow |
| 2 | `oauth.js` | `GoogleStrategy` config | Redirects to Google |
| 3 | **Google** | Login page | User grants permissions |
| 4 | `authRoutes.js` | `router.get("/callback")` | Receives auth code |
| 5 | **Passport** | Token exchange | Gets access & refresh tokens |
| 6 | `oauth.js` | Strategy callback | Saves user to database |
| 7 | `oauth.js` | `serializeUser` | Stores user in session |
| 8 | `authController.js` | `googleCallback` | Generates JWT token |
| 9 | **Frontend** | React component | Saves token to localStorage |
| 10 | `authMiddleware.js` | `authMiddleware` | Validates token on requests |

---

## 🔍 Debugging - Console Logs

Add these logs to see exactly what's happening:

**In `oauth.js` strategy callback:**
```javascript
async (accessToken, refreshToken, profile, done) => {
  console.log('==========================================');
  console.log('🔵 STEP 6: Google Strategy Callback');
  console.log('==========================================');
  console.log('Access Token:', accessToken?.substring(0, 20) + '...');
  console.log('Refresh Token:', refreshToken?.substring(0, 20) + '...');
  console.log('Profile ID:', profile.id);
  console.log('Profile Email:', profile.emails[0].value);
  console.log('Profile Name:', profile.displayName);
  
  // ... rest of the code
}
```

**In `authController.js`:**
```javascript
exports.googleCallback = async (req, res) => {
  console.log('==========================================');
  console.log('🟢 STEP 8: Auth Controller Callback');
  console.log('==========================================');
  console.log('User ID:', req.user.id);
  console.log('User Email:', req.user.email);
  
  // ... rest of the code
}
```

---

## ✅ Testing the Complete Flow

1. **Start server:**
```bash
npm run dev
```

2. **Open browser:**
```
http://localhost:3001/api/auth/google
```

3. **Watch console logs:**
```
🔵 STEP 6: Google Strategy Callback
Access Token: ya29.a0AfB_byC...
Profile Email: john@gmail.com
Creating new user...
New user created: 1

🟢 STEP 8: Auth Controller Callback
User ID: 1
JWT token generated
```

4. **Check redirect:**
```
http://localhost:3000/auth/callback?token=eyJhbGc...
```

5. **Check database:**
```sql
SELECT * FROM users;
```

---

## 💡 Key Concepts

### Access Token vs Refresh Token

- **Access Token:** Short-lived (1 hour), used to call Gmail API
- **Refresh Token:** Long-lived, used to get new access tokens

### JWT Token vs OAuth Token

- **OAuth Token:** From Google, used to access Gmail API
- **JWT Token:** From your app, used to authenticate API requests

### Why Two Redirects?

1. **First redirect:** To Google (for login)
2. **Second redirect:** Back to your app (with auth code)

---

Does this make sense? Let me know if you want me to explain any specific part in more detail! 🚀






so this access token and refresh token that we get from google auth is different then why we are storing that 
and the accesstoken that we are getting how it working because it is different than normal login 
in normal login and signup we create both of them and send it to user so user can use 
but now only one are sended by url token and then we are using it 
and even in db we are storing wrong accesstoken and refreshtoken that have been taking from google and where it will use ?


# Google OAuth 2.0 Authentication - Complete Flow Explained

## 🎯 Overview

When a user clicks "Login with Google", this is what happens behind the scenes:

```
User → Your App → Google → Your App → Database → JWT Token → User
```

---

## 📊 Complete Flow Diagram

```
┌─────────────┐
│   Browser   │
│   (User)    │
└──────┬──────┘
       │
       │ 1. User clicks "Login with Google"
       │ GET http://localhost:3001/api/auth/google
       ▼
┌─────────────────────────────────────────────┐
│  authRoutes.js                              │
│  router.get("/google", ...)                 │
└──────┬──────────────────────────────────────┘
       │
       │ 2. Passport intercepts the request
       ▼
┌─────────────────────────────────────────────┐
│  oauth.js                                   │
│  passport.use(new GoogleStrategy(...))      │
└──────┬──────────────────────────────────────┘
       │
       │ 3. Redirects to Google OAuth consent screen
       │ URL: https://accounts.google.com/o/oauth2/v2/auth?
       │      client_id=YOUR_CLIENT_ID&
       │      redirect_uri=http://localhost:3001/api/auth/google/callback&
       │      scope=profile email gmail.send
       ▼
┌─────────────────────────────────────────────┐
│         Google Login Page                   │
│  - User enters email/password               │
│  - User grants permissions                  │
└──────┬──────────────────────────────────────┘
       │
       │ 4. Google redirects back with authorization code
       │ GET http://localhost:3001/api/auth/google/callback?code=ABC123...
       ▼
┌─────────────────────────────────────────────┐
│  authRoutes.js                              │
│  router.get("/google/callback", ...)        │
└──────┬──────────────────────────────────────┘
       │
       │ 5. Passport exchanges code for tokens
       ▼
┌─────────────────────────────────────────────┐
│  oauth.js - GoogleStrategy callback         │
│  async (accessToken, refreshToken,          │
│         profile, done) => { ... }           │
└──────┬──────────────────────────────────────┘
       │
       │ 6. Check if user exists in database
       ▼
┌─────────────────────────────────────────────┐
│         MySQL Database                      │
│  SELECT * FROM users WHERE googleId=?       │
└──────┬──────────────────────────────────────┘
       │
       ├─── User NOT found ───────┐
       │                          │
       │                          │ 7a. Create new user
       │                          ▼
       │                    ┌──────────────────┐
       │                    │  User.create()   │
       │                    │  - googleId      │
       │                    │  - email         │
       │                    │  - name          │
       │                    │  - accessToken   │
       │                    │  - refreshToken  │
       │                    └────────┬─────────┘
       │                             │
       ├─── User FOUND ──────────────┤
       │                             │
       │    7b. Update tokens        │
       │         │                   │
       │         ▼                   │
       │    ┌──────────────────┐    │
       │    │  user.update()   │    │
       │    │  - accessToken   │    │
       │    │  - refreshToken  │    │
       │    └────────┬─────────┘    │
       │             │               │
       │             └───────────────┘
       │
       │ 8. Return user object to passport
       │ done(null, user)
       ▼
┌─────────────────────────────────────────────┐
│  authController.js - googleCallback         │
│  const user = req.user                      │
└──────┬──────────────────────────────────────┘
       │
       │ 9. Generate JWT token
       ▼
┌─────────────────────────────────────────────┐
│  jwt.sign({ userId, email }, JWT_SECRET)    │
└──────┬──────────────────────────────────────┘
       │
       │ 10. Redirect to frontend with token
       │ http://localhost:3000/auth/callback?token=eyJhbGc...
       ▼
┌─────────────────────────────────────────────┐
│         Frontend (React)                    │
│  - Extract token from URL                   │
│  - Save token to localStorage               │
│  - Use token for API requests               │
└─────────────────────────────────────────────┘
```

---

## 🔥 Code Execution - Step by Step

### **STEP 1: User Clicks Login**

**File:** `authRoutes.js`

```javascript
router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email", 'https://www.googleapis.com/auth/gmail.send'],
    accessType: 'offline',
    prompt: 'consent'
}))
```

**What happens:**
1. ✅ User visits: `http://localhost:3001/api/auth/google`
2. ✅ Express router catches this route
3. ✅ `passport.authenticate("google", ...)` is called
4. ✅ Passport looks for a strategy named "google"

---

### **STEP 2: Passport Finds Google Strategy**

**File:** `oauth.js`

```javascript
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.send'],
      accessType: 'offline',
      prompt: 'consent'
    },
    async (accessToken, refreshToken, profile, done) => {
      // This callback runs LATER (after Google redirects back)
    }
  )
);
```

**What happens:**
1. ✅ Passport finds the GoogleStrategy configuration
2. ✅ Uses `clientID` and `clientSecret` from `.env`
3. ✅ Builds authorization URL
4. ✅ Redirects user to Google login page

**Generated URL looks like:**
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=800114566429-0eh9uh1gl1mjf6g1q6cloj730ptpl465.apps.googleusercontent.com&
  redirect_uri=http://localhost:3001/api/auth/google/callback&
  response_type=code&
  scope=profile email https://www.googleapis.com/auth/gmail.send&
  access_type=offline&
  prompt=consent
```

---

### **STEP 3: User Logs in at Google**

**Location:** Google's servers

**What happens:**
1. ✅ User sees Google login page
2. ✅ User enters email and password
3. ✅ Google asks: "App wants to access your profile, email, and Gmail"
4. ✅ User clicks "Allow"
5. ✅ Google generates an **authorization code**
6. ✅ Google redirects back to your app with the code

**Redirect URL:**
```
http://localhost:3001/api/auth/google/callback?code=4/0AVG7fiQ8xYz...
```

---

### **STEP 4: Callback Route Catches Response**

**File:** `authRoutes.js`

```javascript
router.get("/google/callback", 
  passport.authenticate("google", {
    failureRedirect: "/auth/google/failure"
  }), 
  authController.googleCallback
);
```

**What happens:**
1. ✅ Express catches the `/api/auth/google/callback` route
2. ✅ `passport.authenticate("google")` is called AGAIN
3. ✅ But this time, passport sees the `code` parameter in the URL
4. ✅ Passport automatically exchanges the code for tokens

---

### **STEP 5: Passport Exchanges Code for Tokens**

**Behind the scenes (done by Passport automatically):**

Passport makes this request to Google:
```javascript
// Passport does this internally:
POST https://oauth2.googleapis.com/token
Content-Type: application/json

{
  "code": "4/0AVG7fiQ8xYz...",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "redirect_uri": "http://localhost:3001/api/auth/google/callback",
  "grant_type": "authorization_code"
}
```

**Google responds with:**
```json
{
  "access_token": "ya29.a0AfB_byC...",
  "refresh_token": "1//0gL3qZ8xYz...",
  "expires_in": 3599,
  "scope": "profile email https://www.googleapis.com/auth/gmail.send",
  "token_type": "Bearer"
}
```

---

### **STEP 6: Strategy Callback Executes**

**File:** `oauth.js`

```javascript
async (accessToken, refreshToken, profile, done) => {
  // ← THIS CALLBACK RUNS NOW!
  
  try {
    // profile contains user info from Google
    console.log('Profile from Google:', profile);
    /*
    {
      id: '103845729384756',
      displayName: 'John Doe',
      emails: [{ value: 'john@gmail.com', verified: true }],
      photos: [{ value: 'https://lh3.googleusercontent.com/...' }]
    }
    */
    
    // Step 6.1: Check if user exists
    let user = await User.findOne({
      where: { googleId: profile.id }
    });

    if (!user) {
      // Step 6.2: User doesn't exist, create new one
      console.log('Creating new user...');
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        profilePicture: profile.photos[0]?.value,
        accessToken: accessToken,
        refreshToken: refreshToken
      });
      console.log('New user created:', user.id);
    } else {
      // Step 6.3: User exists, update tokens
      console.log('User exists, updating tokens...');
      await user.update({
        accessToken: accessToken,
        refreshToken: refreshToken || user.refreshToken
      });
      console.log('Tokens updated for user:', user.id);
    }

    // Step 6.4: Tell passport authentication succeeded
    return done(null, user);
    
  } catch (error) {
    console.error('OAuth error:', error);
    return done(error, null);
  }
}
```

**What happens:**
1. ✅ Passport calls this callback with tokens and profile
2. ✅ Code checks database for existing user by `googleId`
3. ✅ If new user → `User.create()` saves to database
4. ✅ If existing user → `user.update()` updates tokens
5. ✅ `done(null, user)` tells passport: "Authentication successful!"

---

### **STEP 7: Passport Serialization**

**File:** `oauth.js`

```javascript
passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.id);
  done(null, user.id);
});
```

**What happens:**
1. ✅ Passport stores `user.id` in session
2. ✅ Session is stored in memory (or session store)
3. ✅ User object is attached to `req.user`

---

### **STEP 8: Controller Generates JWT**

**File:** `authController.js`

```javascript
exports.googleCallback = async (req, res) => {
  try {
    const user = req.user; // ← User from passport
    console.log('Authenticated user:', user.id);

    // Step 8.1: Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    console.log('JWT token generated');

    // Step 8.2: Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    
  } catch (error) {
    console.error('Auth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
  }
};
```

**What happens:**
1. ✅ `req.user` contains the user from database
2. ✅ JWT token is created with user info
3. ✅ Token is signed with `JWT_SECRET`
4. ✅ User is redirected to frontend with token in URL

**Redirect URL:**
```
http://localhost:3000/auth/callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### **STEP 9: Frontend Receives Token**

**Location:** Frontend (React app)

```javascript
// In your React app (e.g., CallbackPage.jsx)
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    console.log('Token received!');
    // Save token
    localStorage.setItem('authToken', token);
    // Redirect to dashboard
    navigate('/dashboard');
  }
}, []);
```

---

### **STEP 10: Using Token for API Requests**

**Every subsequent API request:**

```javascript
// In your frontend
const response = await fetch('http://localhost:3001/api/users/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Backend validates token:**

**File:** `authMiddleware.js`

```javascript
const authMiddleware = async (req, res, next) => {
  try {
    // Step 10.1: Extract token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required'
      });
    }

    // Step 10.2: Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { userId: 1, email: 'john@gmail.com', iat: ..., exp: ... }
    
    // Step 10.3: Get user from database
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Step 10.4: Attach user to request
    req.user = user;
    next(); // ← Continue to the actual route handler
    
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};
```

---

## 🎯 Summary - Complete Execution Order

| Step | File | Function | What It Does |
|------|------|----------|--------------|
| 1 | `authRoutes.js` | `router.get("/google")` | Initiates OAuth flow |
| 2 | `oauth.js` | `GoogleStrategy` config | Redirects to Google |
| 3 | **Google** | Login page | User grants permissions |
| 4 | `authRoutes.js` | `router.get("/callback")` | Receives auth code |
| 5 | **Passport** | Token exchange | Gets access & refresh tokens |
| 6 | `oauth.js` | Strategy callback | Saves user to database |
| 7 | `oauth.js` | `serializeUser` | Stores user in session |
| 8 | `authController.js` | `googleCallback` | Generates JWT token |
| 9 | **Frontend** | React component | Saves token to localStorage |
| 10 | `authMiddleware.js` | `authMiddleware` | Validates token on requests |

---

## 🔍 Debugging - Console Logs

Add these logs to see exactly what's happening:

**In `oauth.js` strategy callback:**
```javascript
async (accessToken, refreshToken, profile, done) => {
  console.log('==========================================');
  console.log('🔵 STEP 6: Google Strategy Callback');
  console.log('==========================================');
  console.log('Access Token:', accessToken?.substring(0, 20) + '...');
  console.log('Refresh Token:', refreshToken?.substring(0, 20) + '...');
  console.log('Profile ID:', profile.id);
  console.log('Profile Email:', profile.emails[0].value);
  console.log('Profile Name:', profile.displayName);
  
  // ... rest of the code
}
```

**In `authController.js`:**
```javascript
exports.googleCallback = async (req, res) => {
  console.log('==========================================');
  console.log('🟢 STEP 8: Auth Controller Callback');
  console.log('==========================================');
  console.log('User ID:', req.user.id);
  console.log('User Email:', req.user.email);
  
  // ... rest of the code
}
```

---

## ✅ Testing the Complete Flow

1. **Start server:**
```bash
npm run dev
```

2. **Open browser:**
```
http://localhost:3001/api/auth/google
```

3. **Watch console logs:**
```
🔵 STEP 6: Google Strategy Callback
Access Token: ya29.a0AfB_byC...
Profile Email: john@gmail.com
Creating new user...
New user created: 1

🟢 STEP 8: Auth Controller Callback
User ID: 1
JWT token generated
```

4. **Check redirect:**
```
http://localhost:3000/auth/callback?token=eyJhbGc...
```

5. **Check database:**
```sql
SELECT * FROM users;
```

---

## 💡 Key Concepts

### Access Token vs Refresh Token

- **Access Token:** Short-lived (1 hour), used to call Gmail API
- **Refresh Token:** Long-lived, used to get new access tokens

### JWT Token vs OAuth Token

- **OAuth Token:** From Google, used to access Gmail API
- **JWT Token:** From your app, used to authenticate API requests

### Why Two Redirects?

1. **First redirect:** To Google (for login)
2. **Second redirect:** Back to your app (with auth code)

---

Does this make sense? Let me know if you want me to explain any specific part in more detail! 🚀