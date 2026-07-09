# Nayab Transportation Management System - Backend API

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Role-Based Access Control](#role-based-access-control)
- [Testing](#testing)

## 🎯 Overview

Complete backend REST API for a Transportation Management System with features including:

- User authentication & authorization
- Fleet management (vehicles)
- Driver management
- Customer management
- Shipment tracking
- Trip management
- Payment processing
- Maintenance scheduling
- Real-time notifications
- Reports & analytics

## 🛠 Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer + Cloudinary
- **Security**: Helmet, CORS, Rate Limiting, Mongo Sanitize
- **Validation**: express-validator

## 📁 Project Structure

```
backend/
├── config/
│   ├── db.js                 # MongoDB connection
│   └── cloudinary.js         # Cloudinary configuration
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── userController.js     # User management
│   ├── customerController.js # Customer operations
│   ├── driverController.js   # Driver operations
│   ├── vehicleController.js  # Vehicle management
│   ├── shipmentController.js # Shipment handling
│   ├── tripController.js     # Trip tracking
│   ├── maintenanceController.js # Maintenance records
│   ├── paymentController.js  # Payment processing
│   ├── notificationController.js # Notifications
│   └── reportController.js   # Reports & analytics
├── models/
│   ├── User.js              # User schema
│   ├── Customer.js          # Customer schema
│   ├── Driver.js            # Driver schema
│   ├── Vehicle.js           # Vehicle schema
│   ├── Shipment.js          # Shipment schema
│   ├── Trip.js              # Trip schema
│   ├── Maintenance.js       # Maintenance schema
│   ├── Payment.js           # Payment schema
│   └── Notification.js      # Notification schema
├── routes/
│   ├── authRoutes.js        # Auth endpoints
│   ├── userRoutes.js        # User endpoints
│   ├── customerRoutes.js    # Customer endpoints
│   ├── driverRoutes.js      # Driver endpoints
│   ├── vehicleRoutes.js     # Vehicle endpoints
│   ├── shipmentRoutes.js    # Shipment endpoints
│   ├── tripRoutes.js        # Trip endpoints
│   ├── maintenanceRoutes.js # Maintenance endpoints
│   ├── paymentRoutes.js     # Payment endpoints
│   ├── notificationRoutes.js # Notification endpoints
│   └── reportRoutes.js      # Report endpoints
├── middleware/
│   ├── authMiddleware.js    # JWT verification
│   ├── roleMiddleware.js    # Role-based access
│   ├── uploadMiddleware.js  # File upload handling
│   └── errorMiddleware.js   # Error handling
├── utils/
│   ├── generateToken.js     # JWT token generator
│   └── validation.js        # Validation utilities
├── server.js                # Entry point
├── package.json             # Dependencies
└── .env                     # Environment variables
```

## 📦 Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB
- Cloudinary account (for file uploads)

### Steps

1. **Navigate to backend directory**

```bash
cd backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**
   Create or update `.env` file with your credentials (see Environment Variables section)

4. **Start the server**

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ntms?retryWrites=true&w=majority

# Server
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_secure_secret_key_here
JWT_EXPIRE=30d

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

**Important Security Notes:**

- Change `JWT_SECRET` to a strong, random string in production
- Never commit `.env` file to version control
- Use environment-specific secrets for production

## 🚀 Running the Server

### Development Mode

```bash
npm run dev
```

Server runs on `http://localhost:5000` with auto-restart on file changes.

### Production Mode

```bash
npm start
```

### Verify Server is Running

Open browser and go to: `http://localhost:5000`

You should see:

```json
{
  "message": "Nayab Transportation Management System API",
  "version": "1.0.0",
  "status": "Running",
  "endpoints": { ... }
}
```

## 🔗 API Endpoints

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint                | Description       | Access  |
| ------ | ----------------------- | ----------------- | ------- |
| POST   | `/auth/register`        | Register new user | Public  |
| POST   | `/auth/login`           | User login        | Public  |
| GET    | `/auth/me`              | Get current user  | Private |
| PUT    | `/auth/update-password` | Update password   | Private |

### User Management

| Method | Endpoint            | Description         | Access |
| ------ | ------------------- | ------------------- | ------ |
| GET    | `/users`            | Get all users       | Admin  |
| GET    | `/users/:id`        | Get user by ID      | Admin  |
| POST   | `/users`            | Create user         | Admin  |
| PUT    | `/users/:id`        | Update user         | Admin  |
| DELETE | `/users/:id`        | Delete user         | Admin  |
| PUT    | `/users/:id/status` | Update user status  | Admin  |
| GET    | `/users/stats`      | Get user statistics | Admin  |

### Customer Management

| Method | Endpoint                   | Description            | Access   |
| ------ | -------------------------- | ---------------------- | -------- |
| GET    | `/customers`               | Get all customers      | Admin    |
| GET    | `/customers/:id`           | Get customer by ID     | Admin    |
| GET    | `/customers/profile/me`    | Get own profile        | Customer |
| PUT    | `/customers/profile/me`    | Update own profile     | Customer |
| PUT    | `/customers/:id`           | Update customer        | Admin    |
| DELETE | `/customers/:id`           | Delete customer        | Admin    |
| GET    | `/customers/:id/shipments` | Get customer shipments | Admin    |

### Driver Management

| Method | Endpoint              | Description           | Access           |
| ------ | --------------------- | --------------------- | ---------------- |
| GET    | `/drivers`            | Get all drivers       | Admin/Dispatcher |
| GET    | `/drivers/available`  | Get available drivers | Admin/Dispatcher |
| GET    | `/drivers/:id`        | Get driver by ID      | Admin/Dispatcher |
| POST   | `/drivers`            | Create driver         | Admin            |
| PUT    | `/drivers/:id`        | Update driver         | Admin            |
| DELETE | `/drivers/:id`        | Delete driver         | Admin            |
| PUT    | `/drivers/:id/status` | Update driver status  | Admin/Driver     |

### Vehicle Management

| Method | Endpoint               | Description            | Access           |
| ------ | ---------------------- | ---------------------- | ---------------- |
| GET    | `/vehicles`            | Get all vehicles       | Admin/Dispatcher |
| GET    | `/vehicles/:id`        | Get vehicle by ID      | Admin/Dispatcher |
| POST   | `/vehicles`            | Create vehicle         | Admin            |
| PUT    | `/vehicles/:id`        | Update vehicle         | Admin            |
| DELETE | `/vehicles/:id`        | Delete vehicle         | Admin            |
| PUT    | `/vehicles/:id/status` | Update vehicle status  | Admin            |
| GET    | `/vehicles/stats`      | Get vehicle statistics | Admin            |

### Shipment Management

| Method | Endpoint                | Description           | Access            |
| ------ | ----------------------- | --------------------- | ----------------- |
| GET    | `/shipments`            | Get shipments         | All authenticated |
| GET    | `/shipments/:id`        | Get shipment by ID    | All authenticated |
| POST   | `/shipments`            | Create shipment       | Customer          |
| PUT    | `/shipments/:id/assign` | Assign driver/vehicle | Admin/Dispatcher  |
| PATCH  | `/shipments/:id/status` | Update status         | All authenticated |
| DELETE | `/shipments/:id`        | Cancel shipment       | Admin/Customer    |
| GET    | `/shipments/stats`      | Get statistics        | Admin/Dispatcher  |

### Trip Management

| Method | Endpoint                | Description         | Access            |
| ------ | ----------------------- | ------------------- | ----------------- |
| GET    | `/trips`                | Get all trips       | Admin/Dispatcher  |
| GET    | `/trips/my-trips`       | Get driver's trips  | Driver            |
| GET    | `/trips/:id`            | Get trip by ID      | All authenticated |
| PATCH  | `/trips/:id/status`     | Update trip status  | Driver            |
| PATCH  | `/trips/:id/location`   | Update GPS location | Driver            |
| POST   | `/trips/:id/checkpoint` | Add checkpoint      | Driver            |
| POST   | `/trips/:id/incident`   | Report incident     | Driver            |
| PUT    | `/trips/:id/expenses`   | Update expenses     | Driver            |

### Maintenance Management

| Method | Endpoint                          | Description              | Access |
| ------ | --------------------------------- | ------------------------ | ------ |
| GET    | `/maintenance`                    | Get all records          | Admin  |
| GET    | `/maintenance/:id`                | Get record by ID         | Admin  |
| POST   | `/maintenance`                    | Create record            | Admin  |
| PUT    | `/maintenance/:id`                | Update record            | Admin  |
| DELETE | `/maintenance/:id`                | Delete record            | Admin  |
| GET    | `/maintenance/vehicle/:vehicleId` | Get vehicle history      | Admin  |
| GET    | `/maintenance/upcoming`           | Get upcoming maintenance | Admin  |
| GET    | `/maintenance/stats`              | Get statistics           | Admin  |

### Payment Management

| Method | Endpoint                         | Description           | Access            |
| ------ | -------------------------------- | --------------------- | ----------------- |
| GET    | `/payments`                      | Get all payments      | Admin/Customer\*  |
| GET    | `/payments/:id`                  | Get payment by ID     | All authenticated |
| POST   | `/payments`                      | Create payment        | Admin/Customer    |
| PUT    | `/payments/:id/status`           | Update payment status | Admin             |
| PUT    | `/payments/:id`                  | Update payment        | Admin             |
| DELETE | `/payments/:id`                  | Delete payment        | Admin             |
| GET    | `/payments/shipment/:shipmentId` | Get shipment payments | All authenticated |
| GET    | `/payments/stats`                | Get statistics        | Admin             |

\*Customers see only their own payments

### Notification Management

| Method | Endpoint                       | Description              | Access            |
| ------ | ------------------------------ | ------------------------ | ----------------- |
| GET    | `/notifications`               | Get user's notifications | All authenticated |
| GET    | `/notifications/unread-count`  | Get unread count         | All authenticated |
| GET    | `/notifications/:id`           | Get notification by ID   | All authenticated |
| POST   | `/notifications`               | Create notification      | Admin             |
| PUT    | `/notifications/:id/read`      | Mark as read             | All authenticated |
| PUT    | `/notifications/mark-all-read` | Mark all as read         | All authenticated |
| DELETE | `/notifications/:id`           | Delete notification      | All authenticated |
| DELETE | `/notifications/clear-all`     | Clear read notifications | All authenticated |

### Reports & Analytics

| Method | Endpoint                       | Description             | Access |
| ------ | ------------------------------ | ----------------------- | ------ |
| GET    | `/reports/dashboard`           | Get dashboard stats     | Admin  |
| GET    | `/reports/financial`           | Get financial report    | Admin  |
| GET    | `/reports/driver-performance`  | Get driver performance  | Admin  |
| GET    | `/reports/vehicle-utilization` | Get vehicle utilization | Admin  |
| GET    | `/reports/monthly`             | Get monthly report      | Admin  |

## 🔐 Authentication

### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "03001234567",
  "role": "customer"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Using the Token

Include the JWT token in the Authorization header for protected routes:

```http
GET /api/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 👥 Role-Based Access Control

### Roles

1. **Admin** - Full system access
   - All CRUD operations
   - User management
   - Reports and analytics

2. **Dispatcher** - Operations management
   - View vehicles and drivers
   - Assign drivers to shipments
   - Track shipments

3. **Driver** - Trip execution
   - View assigned trips
   - Update trip status
   - Update location
   - Report incidents

4. **Customer** - Shipment creation
   - Create shipments
   - Track shipments
   - View own data

## 🧪 Testing

### Using Postman

1. **Import Collection**
   - Create a new collection in Postman
   - Set base URL variable: `{{baseURL}}` = `http://localhost:5000/api`

2. **Test Authentication**

   ```
   POST {{baseURL}}/auth/register
   POST {{baseURL}}/auth/login
   ```

3. **Save Token**
   - Copy token from login response
   - Add to collection variables: `{{token}}`
   - Or use Authorization tab: Bearer Token

4. **Test Protected Routes**
   ```
   GET {{baseURL}}/users
   Authorization: Bearer {{token}}
   ```

### Example Test Scenarios

#### Scenario 1: Customer Creates Shipment

```http
# 1. Register as customer
POST /api/auth/register
{
  "name": "ABC Company",
  "email": "abc@company.com",
  "password": "password123",
  "phone": "03001234567",
  "role": "customer"
}

# 2. Login
POST /api/auth/login
{
  "email": "abc@company.com",
  "password": "password123"
}

# 3. Create shipment
POST /api/shipments
Authorization: Bearer <token>
{
  "pickupLocation": {
    "address": "123 Main St",
    "city": "Karachi"
  },
  "destination": {
    "address": "456 Park Ave",
    "city": "Lahore"
  },
  "cargoDetails": {
    "type": "Electronics",
    "weight": 500,
    "description": "Laptop shipment"
  },
  "scheduledPickupDate": "2024-12-01"
}
```

#### Scenario 2: Admin Manages Fleet

```http
# 1. Login as admin
POST /api/auth/login

# 2. Add vehicle
POST /api/vehicles
{
  "plateNumber": "ABC-123",
  "model": "Hino 300",
  "type": "truck",
  "capacity": { "weight": 5000, "unit": "kg" },
  "year": 2023,
  "insurance": {
    "expiryDate": "2025-12-31"
  }
}

# 3. Create driver
POST /api/drivers
{
  "userId": "<user_id>",
  "fullName": "Driver Name",
  "licenseNumber": "LIC123456",
  "licenseExpiry": "2025-12-31",
  "experience": 5
}
```

#### Scenario 3: Dispatcher Assigns Shipment

```http
# 1. Get available drivers
GET /api/drivers/available

# 2. Get available vehicles
GET /api/vehicles?available=true

# 3. Assign to shipment
PUT /api/shipments/<shipment_id>/assign
{
  "driverId": "<driver_id>",
  "vehicleId": "<vehicle_id>"
}
```

## 📊 Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email already exists"
    }
  ]
}
```

### Paginated Response

```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "pages": 5,
  "currentPage": 1,
  "data": [ ... ]
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Helmet**: Security headers
- **CORS**: Configured for frontend origin
- **Rate Limiting**: Prevents brute force attacks
- **Mongo Sanitize**: Prevents NoSQL injection
- **Input Validation**: Server-side validation
- **Role-Based Access**: Granular permission control

## 🐛 Common Issues

### Issue: MongoDB Connection Failed

**Solution**: Check MONGO_URI in .env file and ensure MongoDB Atlas allows your IP address

### Issue: Token Invalid/Expired

**Solution**: Login again to get a new token

### Issue: CORS Error

**Solution**: Ensure FRONTEND_URL in .env matches your frontend URL

### Issue: File Upload Failed

**Solution**: Verify Cloudinary credentials in .env file

## 📝 Notes

- All timestamps are in UTC
- Coordinates format: `[longitude, latitude]`
- Currency: PKR (Pakistani Rupee)
- Distance unit: kilometers
- Weight unit: kg or ton
- Phone format: 10-15 digits

## 🤝 Contributing

For questions or issues, contact the development team.

## 📄 License

Proprietary - Nayab Transportation Management System
