# UPI Fraud Detection API Documentation

## Authentication System

This API provides a complete authentication system with two roles: `user` and `admin`.

---

## Base URL
`http://localhost:5000/api`

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Register a new user. New users are created with the `user` role by default.

#### Request Body
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

#### Response
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "profile": {},
    "createdAt": "timestamp"
  }
}
```

---

### Login User
**POST** `/auth/login`

Authenticate a user and receive a JWT token.

#### Request Body
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Response
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "lastLogin": "timestamp"
  }
}
```

---

### Get Current User Profile
**GET** `/auth/me`

Get the authenticated user's profile information.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "profile": {},
    "isActive": true,
    "createdAt": "timestamp"
  }
}
```

---

### Update Profile
**PUT** `/auth/me`

Update the authenticated user's profile information.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

#### Response
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "_id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "+1234567890"
    }
  }
}
```

---

### Change Password
**PUT** `/auth/change-password`

Change the authenticated user's password.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password",
  "confirmNewPassword": "new_password"
}
```

#### Response
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## Admin Endpoints

These endpoints are only accessible to users with the `admin` role.

### Get All Users
**GET** `/admin/users`

Get a list of all users in the system.

#### Headers
```
Authorization: Bearer <admin_jwt_token>
```

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of users per page (default: 10)

#### Response
```json
{
  "success": true,
  "count": 2,
  "total": 2,
  "page": 1,
  "totalPages": 1,
  "users": [
    {
      "_id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "timestamp"
    }
  ]
}
```

---

### Get Specific User
**GET** `/admin/users/:id`

Get details of a specific user by ID.

#### Headers
```
Authorization: Bearer <admin_jwt_token>
```

#### Response
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "isActive": true,
    "createdAt": "timestamp"
  }
}
```

---

### Update User Role
**PUT** `/admin/users/:id`

Update a user's role (only to 'user' or 'admin').

#### Headers
```
Authorization: Bearer <admin_jwt_token>
```

#### Request Body
```json
{
  "role": "admin"
}
```

#### Response
```json
{
  "success": true,
  "message": "User role updated successfully",
  "user": {
    "_id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

---

### Toggle User Status
**PATCH** `/admin/users/:id/toggle-status`

Activate or deactivate a user account.

#### Headers
```
Authorization: Bearer <admin_jwt_token>
```

#### Response
```json
{
  "success": true,
  "message": "User account deactivated successfully",
  "user": {
    "_id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "isActive": false
  }
}
```

---

### Delete User
**DELETE** `/admin/users/:id`

Permanently delete a user account.

#### Headers
```
Authorization: Bearer <admin_jwt_token>
```

#### Response
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Roles

- **user**: Regular users with access to basic features
- **admin**: Administrators with full access to user management features

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description here"
}
```

Some errors may include additional fields like `errors` for validation errors.