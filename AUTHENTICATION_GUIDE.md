# NTMS Authentication System Guide

## Overview

The Nayab Transportation Management System (NTMS) uses a flexible, role-based authentication system that works with **ANY registered user** - not hardcoded demo accounts.

## How It Works

### 1. Registration Process

Users can register through the `/register` page:

- **Required Fields**: Name, Email, Phone, Password, Confirm Password
- **Role Selection**: Customer or Driver (dropdown)
- **Backend Storage**: User data including the selected role is stored in MongoDB
- **Success**: User is redirected to login page

### 2. Login Process

Users log in through the `/login` page:

- **Required Fields**: Email and Password (that's it!)
- **NO hardcoded emails**: System accepts any registered email
- **NO role selection needed**: Backend returns the user's role from database
- **Automatic Redirect**: Based on role returned from backend
  - `admin` → `/admin/dashboard`
  - `customer` → `/customer/dashboard`
  - `driver` → `/driver/dashboard`

### 3. Backend Authentication Flow

#### Registration Endpoint: `POST /api/auth/register`

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "03001234567",
  "role": "customer"
}
```

Response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "token": "jwt_token_here"
  }
}
```

#### Login Endpoint: `POST /api/auth/login`

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "token": "jwt_token_here"
  }
}
```

### 4. Frontend Implementation

#### Login Component (`frontend/src/pages/auth/Login.jsx`)

- **Clean UI**: Modern, professional design with Tailwind CSS
- **Features**:
  - Email and password input fields
  - Show/hide password toggle
  - Loading indicators
  - Error messages
  - Remember me checkbox
  - Forgot password link
- **Process**:
  1. User enters email and password
  2. Form submits to backend `/api/auth/login`
  3. Backend validates credentials and returns user data with role
  4. Frontend stores JWT token in localStorage
  5. User redirected based on their role

#### Register Component (`frontend/src/pages/auth/Register.jsx`)

- **Features**:
  - All required fields with validation
  - Role selection (Customer or Driver)
  - Password confirmation
  - Terms and conditions checkbox
  - Success toast notification
- **Process**:
  1. User fills form including role selection
  2. Frontend validates passwords match and meet requirements
  3. Data sent to `/api/auth/register` with role included
  4. User created in database with selected role
  5. Success message shown, redirect to login

### 5. Role-Based Access Control

#### Protected Routes

All dashboard routes are protected by authentication:

- Must have valid JWT token
- Token verified on each request
- Automatic logout if token invalid

#### Role-Specific Routes

Routes enforce role-based access:

- `/admin/*` - Only accessible by admin role
- `/customer/*` - Only accessible by customer role
- `/driver/*` - Only accessible by driver role

Implementation (`frontend/src/routes/RoleRoute.jsx`):

```javascript
// If user's role doesn't match allowedRoles, redirect
if (!allowedRoles.includes(user.role)) {
  return <Navigate to="/" replace />;
}
```

### 6. Security Features

#### Password Security

- Hashed with bcrypt (10 salt rounds)
- Never stored or returned in plain text
- Minimum 6 characters required
- Auto-hashed before saving to database

#### Token Management

- JWT tokens for stateless authentication
- Stored in localStorage (client-side)
- Sent in Authorization header for API requests
- 30-day expiration by default

#### API Security

- Helmet.js for HTTP headers
- CORS configured for frontend URL only
- Rate limiting (100 requests per 10 minutes)
- MongoDB injection prevention
- Input validation on all endpoints

### 7. Creating Admin Users

Since registration only allows Customer or Driver roles, Admin users must be created directly in the database or through a separate admin creation endpoint.

**Method 1: Direct Database Insert**

```javascript
// Using MongoDB shell or Compass
{
  "name": "Admin User",
  "email": "admin@ntms.com",
  "password": "$2a$10$hashed_password_here", // Use bcrypt to hash
  "phone": "03001234567",
  "role": "admin",
  "status": "active"
}
```

**Method 2: Seed Script** (Recommended)
Create `backend/seeds/createAdmin.js`:

```javascript
const User = require("../models/User");
const connectDB = require("../config/db");

connectDB();

const createAdmin = async () => {
  const admin = await User.create({
    name: "System Administrator",
    email: "admin@ntms.com",
    password: "admin123", // Will be auto-hashed
    phone: "03001234567",
    role: "admin",
  });
  console.log("Admin created:", admin.email);
  process.exit();
};

createAdmin();
```

### 8. Testing the System

#### Test Registration

1. Go to http://localhost:5173/register
2. Fill in all fields
3. Select role (Customer or Driver)
4. Click "Create Account"
5. Check MongoDB - user should be created with selected role

#### Test Login

1. Go to http://localhost:5173/login
2. Enter the email and password you just registered
3. Click "Sign In"
4. Should redirect to appropriate dashboard based on role

#### Test Different Roles

1. Register as Customer → Should redirect to `/customer/dashboard`
2. Register as Driver → Should redirect to `/driver/dashboard`
3. Create Admin in DB → Should redirect to `/admin/dashboard`

### 9. Common Issues & Solutions

#### Issue: "Invalid email or password"

- **Cause**: Email not registered or wrong password
- **Solution**: Verify email exists in database, check password case-sensitivity

#### Issue: User created but can't login

- **Cause**: Password not hashed correctly or role not saved
- **Solution**: Check User model pre-save hook, verify role in database

#### Issue: Login successful but redirect fails

- **Cause**: Role not matching expected values
- **Solution**: Check backend returns correct role, verify routing in App.jsx

#### Issue: Token expired errors

- **Cause**: JWT token expiration
- **Solution**: User needs to login again, or implement refresh token logic

### 10. Environment Variables

Required `.env` files:

**Backend** (`backend/.env`):

```env
MONGO_URI=your_mongodb_connection_string
PORT=5002
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):

```env
VITE_API_URL=http://localhost:5002/api
```

## Summary

✅ **NO hardcoded demo accounts**  
✅ **ANY registered user can login**  
✅ **Role determined by backend database**  
✅ **Automatic role-based redirect**  
✅ **Secure password hashing**  
✅ **JWT token authentication**  
✅ **Protected routes with role checks**  
✅ **Clean, professional UI**

The system is production-ready and works for unlimited users with proper role-based access control!
