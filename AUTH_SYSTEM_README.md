# UPI Fraud Detection - Authentication System

This document outlines the authentication system implemented for the UPI Fraud Detection application, featuring role-based access control with user and admin roles.

## Overview

The authentication system includes:
- User registration and login
- JWT-based authentication
- Role-based access control (user/admin)
- User profile management
- Admin user management panel
- Password management
- Account activation/deactivation

## Backend Structure

### Models
- **User Model** (`backend/models/User.js`): Defines user schema with fields for username, email, password, role, profile information, and status.

### Controllers
- **Auth Controller** (`backend/controllers/authController.js`): Handles user registration, login, profile updates, and password changes.
- **Admin Controller** (`backend/controllers/adminController.js`): Manages admin operations like user listing, role updates, and account management.

### Middleware
- **Authentication Middleware** (`backend/middleware/auth.js`): Verifies JWT tokens and user status.
- **Authorization Middleware** (`backend/middleware/auth.js`): Checks user roles for specific route access.

### Routes
- **Auth Routes** (`backend/routes/authRoutes.js`): Public and private authentication routes.
- **Admin Routes** (`backend/routes/adminRoutes.js`): Admin-specific routes with role protection.

## Frontend Structure

### Context
- **Auth Context** (`upi-fraud-detection/src/context/AuthContext.jsx`): Manages authentication state, user data, and API calls.

### Pages
- **Auth Pages** (`upi-fraud-detection/src/pages/auth/`): Login, registration, profile, and unauthorized access pages.
- **Admin Pages** (`upi-fraud-detection/src/pages/admin/`): User management interface for admins.

### Components
- **Protected Route** (`upi-fraud-detection/src/components/ProtectedRoute.jsx`): Route wrapper for protecting pages based on authentication and roles.

## Features

### User Features
1. **Registration**: New users can create accounts with username, email, and password.
2. **Login**: Existing users can authenticate with their email and password.
3. **Profile Management**: Users can update their personal information (first name, last name, phone number).
4. **Password Change**: Users can securely change their passwords.
5. **Session Management**: Automatic session persistence using localStorage.

### Admin Features
1. **User Management**: View, edit, activate/deactivate, and delete users.
2. **Role Management**: Assign user or admin roles to users.
3. **User Listing**: Paginated view of all users with search and filter capabilities.

### Security Features
1. **Password Hashing**: All passwords are hashed using bcrypt.
2. **JWT Tokens**: Secure authentication tokens with expiration.
3. **Role-Based Access**: Different permissions based on user roles.
4. **Rate Limiting**: Protection against brute force attacks.
5. **Input Validation**: Comprehensive validation for all inputs.

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate a user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile
- `PUT /api/auth/change-password` - Change user password

### Admin Endpoints
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/users/:id` - Get specific user (admin only)
- `PUT /api/admin/users/:id` - Update user role (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)
- `PATCH /api/admin/users/:id/toggle-status` - Activate/deactivate user (admin only)

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/upifrauddb
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:5173
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd upi-fraud-detection
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```

### Initial Admin User
An initial admin user is created using the seed script:
```bash
node seedAdmin.js
```

This creates an admin user with:
- Username: `admin`
- Email: `admin@upifraud.com`
- Password: `admin123`

## Database Schema

### User Collection
```javascript
{
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed, required, not returned in queries by default),
  role: String (enum: ['user', 'admin'], default: 'user'),
  isActive: Boolean (default: true),
  profile: {
    firstName: String,
    lastName: String,
    phoneNumber: String,
    avatar: String
  },
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Running the Application

1. Make sure MongoDB is running on your system
2. Start the backend server: `cd backend && npm run dev`
3. Start the frontend server: `cd upi-fraud-detection && npm run dev`
4. Access the application at `http://localhost:5173`

## Testing the Authentication System

1. Visit `http://localhost:5173` to see the main application
2. Click "Sign Up" to register a new user
3. Use the login page to authenticate
4. Admin users can access the user management panel at `/admin/users`

## Security Considerations

- Store JWT secrets securely and rotate regularly
- Implement HTTPS in production
- Add CSRF protection for additional security
- Implement proper password strength requirements
- Add account lockout mechanisms after failed attempts
- Regularly audit user permissions and roles

## Future Enhancements

- Two-factor authentication (2FA)
- Password reset functionality via email
- Session management improvements
- Audit logging for admin actions
- Social login integration
- Account verification via email