# 🛒 MarketLink API — Backend Documentation

Welcome to the **MarketLink** REST API! This service powers the MarketLink platform, connecting local farmers, market managers, and customers. It handles authentication, role-based access control (RBAC), market geolocation, farmer inventory management, pre-order workflows, ratings/reviews, and customer favorites.

---

## 🚀 Quick Start & Setup

### Base URL
```text
http://localhost:3001/api



### Authentication Header
Most endpoints require a valid JSON Web Token (JWT) passed in the Authorization header:
Authorization: Bearer <YOUR_JWT_TOKEN>



---

## 👥 User Roles & Access Control

The API enforces strict Role-Based Access Control (RBAC):

- **customer**: Can browse markets/products, place pre-orders, leave reviews, and manage favorites.
- **farmer**: Can create and manage inventory, accept/update incoming pre-orders, update stall profiles, and respond to customer reviews.
- **admin**: Full platform control (create, update, and remove markets or products).

---

## 📋 API Endpoints Summary

### 🔑 1. Authentication & Account (`/api`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/register` | Public | Register a new user (customer, farmer, or admin). |
| POST | `/api/login` | Public | Authenticate user and receive JWT token + user object. |
| GET | `/api/user/profile` | Authenticated | Retrieve current user profile and populate favorites. |
| PUT | `/api/farmer/profile` | Farmer | Update farmer stall details, operating days, and location. |
| POST | `/api/user/favorites` | Customer | Toggle a farmer or product in customer favorites list. |

### 🏪 2. Markets (`/api/markets`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/markets` | Public | Fetch all active markets. Supports day filter: `?day=Saturday`. |
| GET | `/api/markets/:id` | Public | Get details for a single market by ID. |
| POST | `/api/markets` | Admin | Create a new market (name, address, lat/lng, hours). |
| PUT | `/api/markets/:id` | Admin | Update market operating details or status. |
| DELETE | `/api/markets/:id` | Admin | Remove a market from the system. |

### 🌽 3. Products & Inventory (`/api/products`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/products` | Public | Fetch available products with filters (see Query Parameters below). |
| GET | `/api/products/:id` | Public | Fetch single product with populated farmer details. |
| GET | `/api/farmer/products` | Farmer | Fetch current farmer's own inventory (including out-of-stock items). |
| POST | `/api/products` | Farmer | Add a new product to inventory. |
| PUT | `/api/products/:id` | Farmer | Update stock, pricing, or product availability. |
| DELETE | `/api/products/:id` | Farmer / Admin | Delete product (farmers can only delete their own). |

#### 🔍 Product Filter Query Parameters (`GET /api/products`)
- `category`: Filter by category (e.g., Vegetables, Fruits, Dairy).
- `farmerId`: Filter by a specific farmer's MongoDB ID.
- `minPrice` / `maxPrice`: Filter within price bounds.
- `search`: Case-insensitive keyword search by name (e.g., `?search=tomato`).

### 📦 4. Pre-Orders & Fulfillment (`/api/orders`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/orders` | Customer | Place a new pre-order (automatically validates & deducts stock). |
| GET | `/api/customer/orders` | Customer | View customer order history. |
| GET | `/api/farmer/orders` | Farmer | View incoming orders + revenue dashboard metrics. |
| PATCH | `/api/orders/:id/status` | Farmer / Customer | Update order status (see lifecycle below). |

#### 🔄 Order Status Lifecycle
- `placed`: Initial state set when customer submits an order.
- `accepted`: Farmer acknowledges order.
- `ready_for_pickup`: Order packed and waiting at market stall.
- `completed`: Customer collected order.
- `cancelled` / `declined`: Cancelled by customer or declined by farmer (automatically restores product stock).

### ⭐ 5. Reviews & Ratings (`/api/reviews`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/reviews` | Customer | Post a rating (1–5) and comment for a farmer/product. |
| GET | `/api/farmers/:id/reviews` | Public | Get all customer reviews for a specific farmer. |
| POST | `/api/reviews/:id/respond` | Farmer | Reply to a specific review left on your stall. |

### 🤖 6. Assistant Route (`/api/ai/assistant`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/ai/assistant` | Public | Simple pattern assistant returning operating hours & active products. |

---

## 🛠 Sample Payload Formats

### 1. User Registration (`POST /api/register`)
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

### 2. Place Order (`POST /api/orders`)
```json
{
  "farmerId": "65f1a2b3c4d5e6f7a8b9c0d1",
  "marketId": "65f1a2b3c4d5e6f7a8b9c0d2",
  "pickupDate": "2026-10-15",
  "pickupTimeSlot": "09:00 AM - 11:00 AM",
  "note": "Please pick fresh ripe tomatoes",
  "items": [
    {
      "productId": "65f1a2b3c4d5e6f7a8b9c0d3",
      "quantity": 2
    }
  ]
}
```

### 3. Update Order Status (`PATCH /api/orders/:id/status`)
```json
{
  "status": "accepted"
}
```

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