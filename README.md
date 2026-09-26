# 🛒 MarketLink API — Backend Documentation

Welcome to the **MarketLink** REST API! This service powers the MarketLink platform, connecting local farmers, market managers, and customers. It handles authentication, role-based access control (RBAC), market geolocation, farmer inventory management, pre-order workflows, ratings/reviews, and customer favorites.

---

## Base URL
```
http://localhost:3001/api
```

## Authentication Header
Most endpoints require a valid JSON Web Token (JWT) passed in the Authorization header:
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

## User Roles
- **customer** — browse markets/products, place pre-orders, leave reviews, manage favorites
- **farmer** — manage inventory, handle incoming pre-orders, update stall profile, respond to reviews
- **admin** — full platform control over markets and products

---

# API Summary and Quick Nav

Below is the complete catalog of APIs available on MarketLink, sequentially numbered.

## Public Endpoints
1. [Register User](#1-register-user) ( `POST` `/api/register` )
2. [Login](#2-login) ( `POST` `/api/login` )
3. [Get All Markets](#3-get-all-markets) ( `GET` `/api/markets` )
4. [Get Market by ID](#4-get-market-by-id) ( `GET` `/api/markets/:id` )
5. [Get All Products](#5-get-all-products) ( `GET` `/api/products` )
6. [Get Product by ID](#6-get-product-by-id) ( `GET` `/api/products/:id` )
7. [Get Farmer Reviews](#7-get-farmer-reviews) ( `GET` `/api/farmers/:id/reviews` )
8. [AI Assistant](#8-ai-assistant) ( `POST` `/api/ai/assistant` )

## Authenticated — Customer Endpoints
9. [Get User Profile](#9-get-user-profile) ( `GET` `/api/user/profile` )
10. [Toggle Favorite](#10-toggle-favorite) ( `POST` `/api/user/favorites` )
11. [Place Order](#11-place-order) ( `POST` `/api/orders` )
12. [Get Customer Orders](#12-get-customer-orders) ( `GET` `/api/customer/orders` )
13. [Post a Review](#13-post-a-review) ( `POST` `/api/reviews` )

## Authenticated — Farmer Endpoints
14. [Update Farmer Profile](#14-update-farmer-profile) ( `PUT` `/api/farmer/profile` )
15. [Get Farmer's Own Products](#15-get-farmers-own-products) ( `GET` `/api/farmer/products` )
16. [Add Product](#16-add-product) ( `POST` `/api/products` )
17. [Update Product](#17-update-product) ( `PUT` `/api/products/:id` )
18. [Delete Product](#18-delete-product) ( `DELETE` `/api/products/:id` )
19. [Get Farmer Orders](#19-get-farmer-orders) ( `GET` `/api/farmer/orders` )
20. [Update Order Status](#20-update-order-status) ( `PATCH` `/api/orders/:id/status` )
21. [Respond to a Review](#21-respond-to-a-review) ( `POST` `/api/reviews/:id/respond` )

## Admin Endpoints
22. [Create Market](#22-create-market) ( `POST` `/api/markets` )
23. [Update Market](#23-update-market) ( `PUT` `/api/markets/:id` )
24. [Delete Market](#24-delete-market) ( `DELETE` `/api/markets/:id` )
25. [Get Admin Dashboard Analytics](#25-get-admin-dashboard-analytics) ( `GET` `/api/admin/dashboard` )
26. [Get All Users](#26-get-all-users) ( `GET` `/api/admin/users` )
27. [Update User](#27-update-user) ( `PUT` `/api/admin/users/:id` )
28. [Delete User](#28-delete-user) ( `DELETE` `/api/admin/users/:id` )

---

# Endpoint Details

## 1. Register User
Creates a new user account as a customer, farmer, or admin.

- **Endpoint**: `POST /api/register`
- **Authentication**: Not required (Public)
- **Request Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "password": "securepassword123",
  "role": "farmer",
  "phone": "+2348000000000"
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "email": "jane@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "farmer",
    "phone": "+2348000000000"
  }
}
```
- **Error Responses**: `400` (missing/invalid fields, email already registered)

---

## 2. Login
Authenticates a user and returns a JWT token.

- **Endpoint**: `POST /api/login`
- **Authentication**: Not required (Public)
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "securepassword123"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "<JWT_TOKEN>",
    "user": {
      "id": "65f1a2b3c4d5e6f7a8b9c0d1",
      "email": "jane@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "farmer"
    }
  }
}
```
- **Error Responses**: `400` (missing fields), `401` (invalid credentials)

---

## 3. Get All Markets
Fetches all active markets. Supports filtering by operating day.

- **Endpoint**: `GET /api/markets`
- **Authentication**: Not required (Public)
- **Query Parameters**:
  - `day` — filter markets open on a given day (e.g. `?day=Saturday`)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Markets retrieved.",
  "data": [
    {
      "id": "65f1a2b3c4d5e6f7a8b9c0d2",
      "name": "Downtown Farmers Market",
      "address": "12 Market St, Dallas, TX",
      "lat": 32.7767,
      "lng": -96.7970,
      "operatingDays": ["Saturday", "Sunday"],
      "hours": "08:00 AM - 02:00 PM"
    }
  ]
}
```

---

## 4. Get Market by ID
Fetches details for a single market.

- **Endpoint**: `GET /api/markets/:id`
- **Authentication**: Not required (Public)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Market retrieved.",
  "data": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d2",
    "name": "Downtown Farmers Market",
    "address": "12 Market St, Dallas, TX",
    "lat": 32.7767,
    "lng": -96.7970,
    "operatingDays": ["Saturday", "Sunday"],
    "hours": "08:00 AM - 02:00 PM"
  }
}
```
- **Error Responses**: `404` (market not found)

---

## 5. Get All Products
Fetches available products, with optional filters.

- **Endpoint**: `GET /api/products`
- **Authentication**: Not required (Public)
- **Query Parameters**:
  - `category` — e.g. `Vegetables`, `Fruits`, `Dairy`
  - `farmerId` — filter by a specific farmer's ID
  - `minPrice` / `maxPrice` — filter within a price range
  - `search` — case-insensitive keyword search by name (e.g. `?search=tomato`)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Products retrieved.",
  "data": [
    {
      "id": "65f1a2b3c4d5e6f7a8b9c0d3",
      "name": "Roma Tomatoes",
      "category": "Vegetables",
      "price": 3.5,
      "quantityAvailable": 40,
      "farmerId": "65f1a2b3c4d5e6f7a8b9c0d1"
    }
  ]
}
```

---

## 6. Get Product by ID
Fetches a single product with populated farmer details.

- **Endpoint**: `GET /api/products/:id`
- **Authentication**: Not required (Public)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Product retrieved.",
  "data": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d3",
    "name": "Roma Tomatoes",
    "category": "Vegetables",
    "price": 3.5,
    "quantityAvailable": 40,
    "farmer": {
      "id": "65f1a2b3c4d5e6f7a8b9c0d1",
      "firstName": "Jane",
      "lastName": "Doe",
      "stallName": "Jane's Greens"
    }
  }
}
```
- **Error Responses**: `404` (product not found)

---

## 7. Get Farmer Reviews
Gets all customer reviews left for a specific farmer.

- **Endpoint**: `GET /api/farmers/:id/reviews`
- **Authentication**: Not required (Public)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Reviews retrieved.",
  "data": [
    {
      "id": "65f1a2b3c4d5e6f7a8b9c0d4",
      "rating": 5,
      "comment": "Fresh produce, quick pickup!",
      "customerName": "John Smith",
      "farmerResponse": null,
      "createdAt": "2026-09-12T10:00:00Z"
    }
  ]
}
```

---

## 8. AI Assistant
A simple pattern-based assistant that returns operating hours and active products.

- **Endpoint**: `POST /api/ai/assistant`
- **Authentication**: Not required (Public)
- **Request Body**:
```json
{
  "message": "What markets are open on Saturday?"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Assistant response generated.",
  "data": {
    "reply": "Downtown Farmers Market is open Saturday from 08:00 AM to 02:00 PM."
  }
}
```

---

## 9. Get User Profile
Retrieves the profile information linked to the authenticated user.

- **Endpoint**: `GET /api/user/profile`
- **Authentication**: Required (JWT Bearer)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "User profile retrieved.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "phone_number": "+123456789",
    "username": "john_doe",
    "first_name": "John",
    "last_name": "Doe",
    "role": "customer",
    "city": "Dallas",
    "country": "USA",
    "favorites": ["65f1a2b3c4d5e6f7a8b9c0d1"],
    "is_verified": true
  }
}
```
- **Error Responses**: `401` (missing/invalid token)

---

## 10. Toggle Favorite
Adds or removes a farmer/product from the customer's favorites list.

- **Endpoint**: `POST /api/user/favorites`
- **Authentication**: Required (JWT Bearer, Customer)
- **Request Body**:
```json
{
  "targetId": "65f1a2b3c4d5e6f7a8b9c0d1",
  "targetType": "farmer"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Favorites updated.",
  "data": {
    "favorites": ["65f1a2b3c4d5e6f7a8b9c0d1"]
  }
}
```

---

## 11. Place Order
Places a new pre-order. Automatically validates and deducts stock.

- **Endpoint**: `POST /api/orders`
- **Authentication**: Required (JWT Bearer, Customer)
- **Request Body**:
```json
{
  "farmerId": "65f1a2b3c4d5e6f7a8b9c0d1",
  "marketId": "65f1a2b3c4d5e6f7a8b9c0d2",
  "pickupDate": "2026-10-15",
  "pickupTimeSlot": "09:00 AM - 11:00 AM",
  "note": "Please pick fresh ripe tomatoes",
  "items": [
    { "productId": "65f1a2b3c4d5e6f7a8b9c0d3", "quantity": 2 }
  ]
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Order placed successfully.",
  "data": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d5",
    "status": "placed",
    "totalAmount": 7.0,
    "pickupDate": "2026-10-15",
    "pickupTimeSlot": "09:00 AM - 11:00 AM"
  }
}
```
- **Error Responses**: `400` (insufficient stock, missing fields)

---

## 12. Get Customer Orders
Views the authenticated customer's order history.

- **Endpoint**: `GET /api/customer/orders`
- **Authentication**: Required (JWT Bearer, Customer)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Orders retrieved.",
  "data": [
    {
      "id": "65f1a2b3c4d5e6f7a8b9c0d5",
      "status": "ready_for_pickup",
      "totalAmount": 7.0,
      "pickupDate": "2026-10-15"
    }
  ]
}
```

---

## 13. Post a Review
Posts a rating (1–5) and comment for a farmer/product.

- **Endpoint**: `POST /api/reviews`
- **Authentication**: Required (JWT Bearer, Customer)
- **Request Body**:
```json
{
  "farmerId": "65f1a2b3c4d5e6f7a8b9c0d1",
  "rating": 5,
  "comment": "Fresh produce, quick pickup!"
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Review posted.",
  "data": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d4",
    "rating": 5,
    "comment": "Fresh produce, quick pickup!"
  }
}
```

---

## 14. Update Farmer Profile
Updates farmer stall details, operating days, and location.

- **Endpoint**: `PUT /api/farmer/profile`
- **Authentication**: Required (JWT Bearer, Farmer)
- **Request Body**:
```json
{
  "stallName": "Jane's Greens",
  "operatingDays": ["Saturday", "Sunday"],
  "location": { "lat": 32.7767, "lng": -96.7970 }
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Farmer profile updated.",
  "data": {
    "stallName": "Jane's Greens",
    "operatingDays": ["Saturday", "Sunday"]
  }
}
```

---

## 15. Get Farmer's Own Products
Fetches the current farmer's full inventory, including out-of-stock items.

- **Endpoint**: `GET /api/farmer/products`
- **Authentication**: Required (JWT Bearer, Farmer)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Inventory retrieved.",
  "data": [
    {
      "id": "65f1a2b3c4d5e6f7a8b9c0d3",
      "name": "Roma Tomatoes",
      "quantityAvailable": 0,
      "isAvailable": false
    }
  ]
}
```

---

## 16. Add Product
Adds a new product to the farmer's inventory.

- **Endpoint**: `POST /api/products`
- **Authentication**: Required (JWT Bearer, Farmer)
- **Request Body**:
```json
{
  "name": "Roma Tomatoes",
  "category": "Vegetables",
  "price": 3.5,
  "quantityAvailable": 40
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Product added.",
  "data": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d3",
    "name": "Roma Tomatoes",
    "price": 3.5,
    "quantityAvailable": 40
  }
}
```

---

## 17. Update Product
Updates stock, pricing, or availability of an existing product.

- **Endpoint**: `PUT /api/products/:id`
- **Authentication**: Required (JWT Bearer, Farmer — own products only)
- **Request Body**:
```json
{
  "price": 3.0,
  "quantityAvailable": 25
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Product updated.",
  "data": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d3",
    "price": 3.0,
    "quantityAvailable": 25
  }
}
```

---

## 18. Delete Product
Deletes a product. Farmers can only delete their own products.

- **Endpoint**: `DELETE /api/products/:id`
- **Authentication**: Required (JWT Bearer, Farmer / Admin)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Product deleted."
}
```
- **Error Responses**: `403` (not the product owner), `404` (product not found)

---

## 19. Get Farmer Orders
Views incoming orders and revenue dashboard metrics.

- **Endpoint**: `GET /api/farmer/orders`
- **Authentication**: Required (JWT Bearer, Farmer)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Orders retrieved.",
  "data": {
    "orders": [
      {
        "id": "65f1a2b3c4d5e6f7a8b9c0d5",
        "status": "accepted",
        "totalAmount": 7.0
      }
    ],
    "revenue": {
      "totalOrders": 12,
      "totalRevenue": 84.5
    }
  }
}
```

---

## 20. Update Order Status
Updates an order's status through its lifecycle.

- **Endpoint**: `PATCH /api/orders/:id/status`
- **Authentication**: Required (JWT Bearer, Farmer / Customer)
- **Request Body**:
```json
{
  "status": "accepted"
}
```
- **Order Status Lifecycle**:
  - `placed` — initial state when customer submits an order
  - `accepted` — farmer acknowledges order
  - `ready_for_pickup` — order packed and waiting at stall
  - `completed` — customer collected order
  - `cancelled` / `declined` — cancelled by customer or declined by farmer (stock automatically restored)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Order status updated.",
  "data": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d5",
    "status": "accepted"
  }
}
```

---

## 21. Respond to a Review
Replies to a specific review left on the farmer's stall.

- **Endpoint**: `POST /api/reviews/:id/respond`
- **Authentication**: Required (JWT Bearer, Farmer)
- **Request Body**:
```json
{
  "response": "Thanks so much for the kind words!"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Response added.",
  "data": {
    "reviewId": "65f1a2b3c4d5e6f7a8b9c0d4",
    "farmerResponse": "Thanks so much for the kind words!"
  }
}
```

---

## 22. Create Market
Creates a new market.

- **Endpoint**: `POST /api/markets`
- **Authentication**: Required (JWT Bearer, Admin)
- **Request Body**:
```json
{
  "name": "Downtown Farmers Market",
  "address": "12 Market St, Dallas, TX",
  "lat": 32.7767,
  "lng": -96.7970,
  "operatingDays": ["Saturday", "Sunday"],
  "hours": "08:00 AM - 02:00 PM"
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Market created.",
  "data": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d2",
    "name": "Downtown Farmers Market"
  }
}
```

---

## 23. Update Market
Updates a market's operating details or status.

- **Endpoint**: `PUT /api/markets/:id`
- **Authentication**: Required (JWT Bearer, Admin)
- **Request Body**:
```json
{
  "hours": "07:00 AM - 01:00 PM",
  "status": "active"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Market updated.",
  "data": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d2",
    "hours": "07:00 AM - 01:00 PM",
    "status": "active"
  }
}
```

---

## 24. Delete Market
Removes a market from the system.

- **Endpoint**: `DELETE /api/markets/:id`
- **Authentication**: Required (JWT Bearer, Admin)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Market deleted."
}
```

---

## 25. Get Admin Dashboard Analytics
Returns high-level platform analytics for the admin dashboard (total users, farmers, customers, markets, products, and orders).

- **Endpoint**: `GET /api/admin/dashboard`
- **Authentication**: Required (JWT Bearer, Admin)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 342,
    "totalFarmers": 58,
    "totalCustomers": 280,
    "totalMarkets": 12,
    "totalProducts": 410,
    "totalOrders": 1203
  }
}
```
- **Error Responses**: `401` (missing/invalid token), `403` (not an admin), `500` (`"Error fetching admin dashboard analytics"`)

---

## 26. Get All Users
Fetches all registered users. Supports filtering by role.

- **Endpoint**: `GET /api/admin/users`
- **Authentication**: Required (JWT Bearer, Admin)
- **Query Parameters**:
  - `role` — filter by user role (e.g. `?role=farmer`)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "65f1a2b3c4d5e6f7a8b9c0d1",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@example.com",
      "role": "farmer",
      "isVerified": true,
      "createdAt": "2026-09-01T09:00:00Z"
    },
    {
      "id": "65f1a2b3c4d5e6f7a8b9c0d6",
      "firstName": "John",
      "lastName": "Smith",
      "email": "john@example.com",
      "role": "customer",
      "isVerified": true,
      "createdAt": "2026-08-20T14:30:00Z"
    }
  ]
}
```
- **Note**: Passwords are excluded from the response; results are sorted newest first.
- **Error Responses**: `401`, `403`, `500` (`"Error fetching users list"`)

---

## 27. Update User
Updates a user's role or verification status (e.g., suspend or upgrade a user).

- **Endpoint**: `PUT /api/admin/users/:id`
- **Authentication**: Required (JWT Bearer, Admin)
- **Request Body**:
```json
{
  "role": "farmer",
  "isVerified": false
}
```
  Both fields are optional — send only the ones you want to change.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@example.com",
    "role": "farmer"
  }
}
```
- **Error Responses**: `404` (`"User not found"`), `500` (`"Error updating user profile"`)

---

## 28. Delete User
Deletes a user from the platform.

- **Endpoint**: `DELETE /api/admin/users/:id`
- **Authentication**: Required (JWT Bearer, Admin)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```
- **Error Responses**: `404` (`"User not found"`), `500` (`"Error deleting user"`)

---

## ⚠️ Standard Error Responses

All error responses return standard HTTP status codes with a clean JSON body:
```json
{
  "message": "Error description message here."
}
```

- **400 Bad Request**: Missing required fields or insufficient product inventory.
- **401 Unauthorized**: Missing or malformed Authorization header.
- **403 Forbidden**: Token expired or insufficient role permissions.
- **404 Not Found**: Requested resource does not exist.
- **500 Internal Server Error**: Unexpected database/server issue.
