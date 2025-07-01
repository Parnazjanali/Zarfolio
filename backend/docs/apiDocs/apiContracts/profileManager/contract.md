# Profile Manager API Contract

This document outlines the API endpoints for the `ProfileManager` service, as exposed and managed through the `API Gateway`. This service is responsible for user authentication, authorization (RBAC), user profile management, and account settings (including 2FA and password resets).

---

## 1. Authentication & Core User Management

### 1.1. Register User

* **Endpoint:** `/api/v1/auth/register`
* **Method:** `POST`
* **Description:** Registers a new user with default roles (e.g., 'user' or 'salesperson').
* **Authentication:** None (Public access).
* **Request Body:**
    ```json
    {
      "username": "newuser",
      "password": "StrongPassword123",
      "email": "newuser@example.com"
    }
    ```
* **Responses:**
    * **`201 Created`**: User registered successfully.
        ```json
        { "message": "User registered successfully!" }
        ```
    * **`400 Bad Request`**: Invalid input (e.g., missing required fields, invalid email format, weak password).
        ```json
        { "message": "Username, password, and email are required.", "code": "400" }
        ```
    * **`409 Conflict`**: User with this username or email already exists.
        ```json
        { "message": "User with this username or email already exists.", "code": "409" }
        ```
    * **`503 Service Unavailable`**: Profile Manager service is temporarily unavailable.
        ```json
        { "message": "Registration service is temporarily unavailable. Please try again later.", "code": "503" }
        ```
    * **`500 Internal Server Error`**: Unexpected server error.
        ```json
        { "message": "Internal server error during registration.", "code": "500" }
        ```

### 1.2. Login User

* **Endpoint:** `/api/v1/auth/login`
* **Method:** `POST`
* **Description:** Authenticates a user and issues a JWT. May require 2FA verification.
* **Authentication:** None (Public access).
* **Request Body:**
    ```json
    {
      "username": "user1",
      "password": "password123"
    }
    ```
* **Responses:**
    * **`200 OK`**: Login successful, JWT issued.
        ```json
        {
          "message": "Login successful",
          "token": "eyJhbGciOiJIUzI1Ni...",
          "user": {
            "id": "uuid-of-user",
            "username": "user1",
            "email": "user1@example.com",
            "roles": ["salesperson", "user"], // Example: ["admin"], ["owner"]
            "created_at": "2024-06-10T10:00:00Z",
            "updated_at": "2024-06-10T10:00:00Z"
          },
          "exp": 1718090400 
        }
        ```
    * **`401 Unauthorized`**: Invalid username or password.
        ```json
        { "message": "Invalid username or password", "code": "401" }
        ```
    * **`406 Not Acceptable`**: (Custom status for 2FA required) User requires 2FA verification.
        ```json
        { "message": "2FA required. Please verify your second factor.", "code": "2FA_REQUIRED" }
        ```
    * **`503 Service Unavailable`**: Authentication service is temporarily unavailable.
        ```json
        { "message": "Authentication service is temporarily unavailable. Please try again later.", "code": "503" }
        ```
    * **`500 Internal Server Error`**: Unexpected server error.
        ```json
        { "message": "Internal server error during authentication", "code": "500" }
        ```

### 1.3. Logout User

* **Endpoint:** `/api/v1/auth/logout`
* **Method:** `POST`
* **Description:** Invalidates the current user's JWT.
* **Authentication:** Requires valid JWT in `Authorization: Bearer <token>` header.
* **Permission:** `user:read` (or specific `user:logout`).
* **Request Body:** None
* **Responses:**
    * **`200 OK`**: User logged out successfully.
        ```json
        { "message": "Logged out successfully!" }
        ```
    * **`401 Unauthorized`**: Invalid/expired token or missing Authorization header.
        ```json
        { "message": "Invalid or expired token", "code": "401" }
        ```
    * **`403 Forbidden`**: Insufficient permissions.
        ```json
        { "message": "Access denied: Insufficient permissions.", "code": "403" }
        ```
    * **`503 Service Unavailable`**: Profile Manager service is temporarily unavailable.
        ```json
        { "message": "Authentication service is temporarily unavailable. Please try again later.", "code": "503" }
        ```
    * **`500 Internal Server Error`**: Unexpected server error.

### 1.4. Request Password Reset

* **Endpoint:** `/api/v1/auth/password/request-reset`
* **Method:** `POST`
* **Description:** Initiates a password reset flow by sending a reset token to the user's email.
* **Authentication:** None (Public access).
* **Request Body:**
    ```json
    {
      "email": "user@example.com"
    }
    ```
* **Responses:**
    * **`200 OK`**: (Always return 200 OK to prevent user enumeration, even if email not found)
        ```json
        { "message": "If a matching email address was found, a password reset link has been sent." }
        ```
    * **`400 Bad Request`**: Invalid email format.
    * **`500 Internal Server Error`**: Error sending email, or other unexpected error.

### 1.5. Reset Password

* **Endpoint:** `/api/v1/auth/password/reset`
* **Method:** `POST`
* **Description:** Resets the user's password using a received reset token.
* **Authentication:** None (Public access).
* **Request Body:**
    ```json
    {
      "token": "reset_token_from_email",
      "new_password": "NewStrongPassword123"
    }
    ```
* **Responses:**
    * **`200 OK`**: Password has been reset successfully.
        ```json
        { "message": "Password has been reset successfully." }
        ```
    * **`400 Bad Request`**: Invalid/expired token, weak password, or other validation errors.
    * **`500 Internal Server Error`**: Unexpected server error.

### 1.6. Verify 2FA Code

* **Endpoint:** `/api/v1/auth/2fa/verify`
* **Method:** `POST`
* **Description:** Verifies a 2FA code to complete the login process for users with 2FA enabled.
* **Authentication:** None (Public access, as it's part of the login flow).
* **Request Body:**
    ```json
    {
      "username": "user1",
      "two_fa_code": "123456"
    }
    ```
* **Responses:**
    * **`200 OK`**: 2FA verification successful, final JWT issued.
        ```json
        {
          "message": "2FA verification successful",
          "token": "eyJhbGciOiJIUzI1Ni...",
          "user": { /* User details */ },
          "exp": 1718090400
        }
        ```
    * **`401 Unauthorized`**: Invalid 2FA code or username.
    * **`400 Bad Request`**: Invalid request body format.
    * **`500 Internal Server Error`**: Unexpected server error.

---

## 2. Account Management (Protected)

These endpoints allow an authenticated user to manage their own account settings.

### 2.1. Change Username

* **Endpoint:** `/api/v1/account/change-username`
* **Method:** `POST`
* **Description:** Allows an authenticated user to change their username.
* **Authentication:** Requires valid JWT in `Authorization: Bearer <token>` header.
* **Permission:** `user:update`
* **Request Body:**
    ```json
    {
      "new_username": "new_user123"
    }
    ```
* **Responses:**
    * **`200 OK`**: Username changed successfully.
        ```json
        { "message": "Username changed successfully." }
        ```
    * **`400 Bad Request`**: Invalid username format, or missing field.
    * **`401 Unauthorized`**: Invalid/expired token or missing header.
    * **`403 Forbidden`**: Insufficient permissions (e.g., if `user:update` is missing).
    * **`409 Conflict`**: New username already taken.
    * **`500 Internal Server Error`**: Unexpected server error.

### 2.2. Change Password

* **Endpoint:** `/api/v1/account/change-password`
* **Method:** `POST`
* **Description:** Allows an authenticated user to change their password.
* **Authentication:** Requires valid JWT in `Authorization: Bearer <token>` header.
* **Permission:** `user:update`
* **Request Body:**
    ```json
    {
      "old_password": "OldPassword123",
      "new_password": "NewStrongPassword123"
    }
    ```
* **Responses:**
    * **`200 OK`**: Password changed successfully.
        ```json
        { "message": "Password changed successfully." }
        ```
    * **`400 Bad Request`**: Weak password, invalid old password, or other validation errors.
    * **`401 Unauthorized`**: Invalid/expired token or missing header.
    * **`403 Forbidden`**: Insufficient permissions.
    * **`500 Internal Server Error`**: Unexpected server error.

### 2.3. Profile Picture Upload

* **Endpoint:** `/api/v1/account/profile-picture`
* **Method:** `POST`
* **Description:** Allows an authenticated user to upload or update their profile picture.
* **Authentication:** Requires valid JWT in `Authorization: Bearer <token>` header.
* **Permission:** `user:update`
* **Request Body:** `multipart/form-data` with a file field (e.g., named `picture`).
* **Responses:**
    * **`200 OK`**: Profile picture updated successfully.
        ```json
        {
          "message": "Profile picture updated successfully.",
          "image_url": "[http://yourdomain.com/uploads/user_id/profile.jpg](http://yourdomain.com/uploads/user_id/profile.jpg)"
        }
        ```
    * **`400 Bad Request`**: Invalid file type/size, or missing file.
    * **`401 Unauthorized/403 Forbidden`**: Invalid token/insufficient permissions.
    * **`500 Internal Server Error`**: Unexpected server error (e.g., file storage issue).

### 2.4. Generate 2FA Secret

* **Endpoint:** `/api/v1/account/2fa/generate-secret`
* **Method:** `POST`
* **Description:** Generates a 2FA secret for the authenticated user and returns the secret key and a QR code URL.
* **Authentication:** Requires valid JWT in `Authorization: Bearer <token>` header.
* **Permission:** `user:update`
* **Request Body:** None
* **Responses:**
    * **`200 OK`**: 2FA secret generated.
        ```json
        {
          "message": "2FA secret generated. Scan QR code to add to authenticator app.",
          "secret": "ABCDEF1234567890", // The secret string
          "qr_code_url": "otpauth://totp/Zarfolio:user1?secret=ABCDEF1234567890&issuer=Zarfolio"
        }
        ```
    * **`401 Unauthorized/403 Forbidden`**: Invalid token/insufficient permissions.
    * **`409 Conflict`**: 2FA already enabled for this user.
    * **`500 Internal Server Error`**: Unexpected server error.

### 2.5. Enable 2FA

* **Endpoint:** `/api/v1/account/2fa/enable`
* **Method:** `POST`
* **Description:** Verifies a 2FA code and enables 2FA for the authenticated user.
* **Authentication:** Requires valid JWT in `Authorization: Bearer <token>` header.
* **Permission:** `user:update`
* **Request Body:**
    ```json
    {
      "two_fa_code": "123456"
    }
    ```
* **Responses:**
    * **`200 OK`**: 2FA successfully enabled.
        ```json
        { "message": "2FA successfully enabled." }
        ```
    * **`400 Bad Request`**: Invalid 2FA code, or 2FA not setup yet.
    * **`401 Unauthorized/403 Forbidden`**: Invalid token/insufficient permissions.
    * **`500 Internal Server Error`**: Unexpected server error.

### 2.6. Disable 2FA

* **Endpoint:** `/api/v1/account/2fa/disable`
* **Method:** `POST`
* **Description:** Disables 2FA for the authenticated user.
* **Authentication:** Requires valid JWT in `Authorization: Bearer <token>` header.
* **Permission:** `user:update`
* **Request Body:** (May require password or a confirmation code for security)
    ```json
    {
      "password": "UserPassword123" // Or "two_fa_code": "123456"
    }
    ```
* **Responses:**
    * **`200 OK`**: 2FA successfully disabled.
        ```json
        { "message": "2FA successfully disabled." }
        ```
    * **`400 Bad Request`**: Invalid password/code, or 2FA not enabled.
    * **`401 Unauthorized/403 Forbidden`**: Invalid token/insufficient permissions.
    * **`500 Internal Server Error`**: Unexpected server error.

---

## 3. User Management (Admin/Owner Specific)

These endpoints allow an administrator (with appropriate permissions) to manage other users in the system.

### 3.1. Get All Users

* **Endpoint:** `/api/v1/users`
* **Method:** `GET`
* **Description:** Retrieves a paginated list of all users in the system.
* **Authentication:** Requires valid JWT in `Authorization: Bearer <token>` header.
* **Permission:** `user:read` (typically for `Admin`, `Owner`).
* **Query Parameters:**
    * `search` (optional, `string`): Search by username or email.
    * `role` (optional, `string`): Filter by a specific role.
    * `limit` (optional, `integer`): Maximum number of users to return (default: 20).
    * `offset` (optional, `integer`): Number of users to skip for pagination.
* **Responses:**
    * **`200 OK`**: Successfully retrieved the list of users.
        ```json
        {
          "users": [
            {
              "id": "uuid-of-user1",
              "username": "user1",
              "email": "user1@example.com",
              "roles": ["admin"],
              "created_at": "2024-01-01T10:00:00Z",
              "updated_at": "2024-01-01T10:00:00Z"
            },
            { /* ... more users ... */ }
          ],
          "total_count": 50,
          "page_size": 20,
          "page_number": 1
        }
        ```
    * **`401 Unauthorized/403 Forbidden`**: Invalid token/insufficient permissions.
    * **`400 Bad Request`**: Invalid query parameters.
    * **`500 Internal Server Error`**: Unexpected server error.

### 3.2. Get User by ID

* **Endpoint:** `/api/v1/users/{id}`
* **Method:** `GET`
* **Description:** Retrieves detailed information for a specific user.
* **Authentication:** Requires valid JWT in `Authorization: Bearer <token>` header.
* **Permission:** `user:read`
* **Path Parameters:** `id` (`string`, UUID): The unique identifier of the user.
* **Responses:**
    * **`200 OK`**: Successfully retrieved user details.
        ```json
        {
          "id": "uuid-of-user1",
          "username": "user1",
          "email": "user1@example.com",
          "roles": ["admin"],
          "created_at": "2024-01-01T10:00:00Z",
          "updated_at": "2024-01-01T10:00:00Z"
        }
        ```
    * **`404 Not Found`**: User with the specified ID was not found.
    * **`401 Unauthorized/403 Forbidden`**: Invalid token/insufficient permissions.
    * **`500 Internal Server Error`**: Unexpected server error.

### 3.3. Create New User (by Admin)

* **Endpoint:** `/api/v1/users`
* **Method:** `POST`
* **Description:** Creates a new user in the system by an administrator, with specified roles.
* **Authentication:** Requires valid JWT in `Authorization: Bearer <token>` header.
* **Permission:** `user:create`
* **Request Body:**
    ```json
    {
      "username": "new_staff",
      "password": "StaffPassword123",
      "email": "staff@example.com",
      "roles": ["salesperson", "accountant"] 
    }
    ```
* **Responses:**
    * **`201 Created`**: User successfully created.
        ```json
        { "id": "uuid-of-new-user", "message": "User created successfully." }
        ```
    * **`400 Bad Request`**: Invalid input data.
    * **`401 Unauthorized/403 Forbidden`**: Invalid token/insufficient permissions.
    * **`409 Conflict`**: User with this username or email already exists.
    * **`500 Internal Server Error`**: Unexpected server error.

### 3.4. Update User Details (by Admin)

* **Endpoint:** `/api/v1/users/{id}`
* **Method:** `PUT` (for full replacement) or `PATCH` (for partial update)
* **Description:** Updates an existing user's details (username, email, etc.) by an administrator.
* **Authentication:** Requires valid JWT in `Authorization: Bearer <token>` header.
* **Permission:** `user:update`
* **Path Parameters:** `id` (`string`, UUID): The unique identifier of the user to update.
* **Request Body:** (Example for PUT/PATCH. Fields not sent might be set to default/null or ignored for PATCH)
    ```json
    {
      "username": "updated_staff_name",
      "email": "updated_staff@example.com",
      // Roles are updated via a separate endpoint: /users/{id}/roles
    }
    ```
* **Responses:**
    * **`200 OK`**: User details updated successfully.
        ```json
        { "message": "User details updated successfully." }
        ```
    * **`400 Bad Request`**: Invalid input data.
    * **`404 Not Found`**: User with the specified ID was not found.
    * **`401 Unauthorized/403 Forbidden`**: Invalid token/insufficient permissions.
    * **`409 Conflict`**: New username/email already taken by another user.
    * **`500 Internal Server Error`**: Unexpected server error.

### 3.5. Delete User (Soft Delete by Admin)

* **Endpoint:** `/api/v1/users/{id}`
* **Method:** `DELETE`
* **Description:** Performs a soft delete on a user (sets `is_active` to false) by an administrator. The user record remains in the database for historical purposes.
* **Authentication:** Requires valid JWT in `Authorization: Bearer <token>` header.
* **Permission:** `user:delete`
* **Path Parameters:** `id` (`string`, UUID): The unique identifier of the user to delete.
* **Request Body:** None
* **Responses:**
    * **`200 OK`**: User successfully deactivated.
        ```json
        { "message": "User deactivated successfully." }
        ```
    * **`400 Bad Request`**: If the user cannot be deleted (e.g., self-deletion of last admin).
    * **`404 Not Found`**: User with the specified ID was not found.
    * **`401 Unauthorized/403 Forbidden`**: Invalid token/insufficient permissions.
    * **`500 Internal Server Error`**: Unexpected server error.

### 3.6. Update User Roles (by Admin)

* **Endpoint:** `/api/v1/users/{user_id}/roles`
* **Method:** `PUT`
* **Description:** Updates roles for a specific user by an administrator. This replaces all existing roles with the new list.
* **Authentication:** Requires valid JWT in `Authorization: Bearer <token>` header.
* **Permission:** `user:update` (or a more specific `user:manage_roles` if defined).
* **Path Parameters:** `user_id` (`string`, UUID): The unique identifier of the user whose roles are being updated.
* **Request Body:**
    ```json
    {
      "roles": ["new_role1", "new_role2"] // The new list of roles for the user
    }
    ```
* **Responses:**
    * **`200 OK`**: User roles updated successfully.
        ```json
        { "message": "User roles updated successfully." }
        ```
    * **`400 Bad Request`**: Invalid input (e.g., `user_id` not a valid UUID, invalid role name in the list, empty roles list).
    * **`404 Not Found`**: User with `user_id` not found.
    * **`401 Unauthorized/403 Forbidden`**: Invalid token/insufficient permissions.
    * **`500 Internal Server Error`**: Unexpected server error.

---

## 4. Static Files Proxy

### 4.1. Get Uploaded Files

* **Endpoint:** `/api/v1/uploads/*`
* **Method:** `GET`
* **Description:** Proxies requests for uploaded static files (like profile pictures) from the Profile Manager service.
* **Authentication:** None (Public access).
* **Path Parameters:** `*` (wildcard): Matches any path segment after `/uploads/`.
* **Responses:**
    * **`200 OK`**: File streamed successfully.
    * **`404 Not Found`**: File not found on the backend service.
    * **`502 Bad Gateway`**: Profile Manager service is unreachable or returns an error.
    * **`500 Internal Server Error`**: Proxy error.

---