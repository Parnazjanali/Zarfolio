# API Contract: User Authentication

This document outlines the API contract for user authentication within the system.

---

## 1. Login Endpoint

**Allows users to authenticate and receive a JSON Web Token (JWT) for subsequent authorized requests.**

### Endpoint Details

* **HTTP Method:** `POST`
* **URL Path:** `/api/v1/auth/login`

### Request

* **Headers:**
    * `Content-Type: application/json`
* **Body (JSON):**
    ```json
    {
      "username": "string",  
      "password": "string"   
    }
    ```
* **Description:**
    This request is sent by the frontend to authenticate a user.

### Response (Success)

* **HTTP Status Code:** `200 OK`
* **Headers:**
    * `Content-Type: application/json`
* **Body (JSON):**
    ```json
    {
      "message": "string",       // A success message (e.g., "Login successful")
      "token": "string",         // The generated JWT token for subsequent authorized requests
      "user": {                  // Details of the authenticated user
        "id": "string",          // Unique user ID (UUID format)
        "username": "string",    // User's username
        "email": "string",       // User's email address
        "role": "string"         // User's role (e.g., "admin", "user", "manager")
      },
      "exp": "number"            // JWT expiration time as a Unix timestamp
    }
    ```
* **Description:**
    Returns a success message, the JWT token, and essential user details upon successful authentication.

### Response (Errors)

* **HTTP Status Code:** `400 Bad Request`
    * **Body (JSON):**
        ```json
        {
          "message": "string", // e.g., "Invalid request body format", "Username and password are required"
          "code": "400"
        }
        ```
    * **Description:**
        Returned if the request format is incorrect or essential fields are missing/empty.

* **HTTP Status Code:** `401 Unauthorized`
    * **Body (JSON):**
        ```json
        {
          "message": "string", // "Invalid username or password", "Invalid or expired token."
          "code": "401"
        }
        ```
    * **Description:**
        Returned if authentication fails due to incorrect credentials or an invalid/expired JWT token (for protected routes).

* **HTTP Status Code:** `503 Service Unavailable`
    * **Body (JSON):**
        ```json
        {
          "message": "string", // "Authentication service is temporarily unavailable. Please try again later."
          "code": "503"
        }
        ```
    * **Description:**
        Returned if a downstream service (e.g., Profile Manager) is unreachable or unavailable.

* **HTTP Status Code:** `500 Internal Server Error`
    * **Body (JSON):**
        ```json
        {
          "message": "string", // "Internal server error during authentication"
          "code": "500"
        }
        ```
    * **Description:**
        Returned for any unexpected internal server errors during the authentication process.

---

## 2. Register Endpoint (Brief Overview)

*(This section is a brief placeholder. A full contract for Register would follow a similar detailed structure as Login.)*

**Allows new users to create an account.**

### Endpoint Details

* **HTTP Method:** `POST`
* **URL Path:** `/api/v1/register/user`

### Request (Body JSON)

```json
{
  "username": "string",  // Desired username
  "password": "string",   // Desired password (plaintext)
  "email": "string"       // User's email
}

