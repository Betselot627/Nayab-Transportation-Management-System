# NTMS - Transport Management System

A comprehensive Transport Management System built with React (frontend) and Node.js/Express (backend).

## Project Structure

```
nayab/
├── backend/          # Node.js/Express backend
│   ├── config/       # Prisma client + Mongoose-style db adapter
│   ├── controllers/  # Route controllers
│   ├── middleware/   # Custom middleware
│   ├── models/       # Data models (via config/dbAdapter.js)
│   ├── prisma/       # Prisma schema (PostgreSQL)
│   ├── routes/       # API routes
│   ├── services/     # External services (Chapa payments)
│   ├── .env          # Environment variables (not committed)
│   ├── package.json
│   └── server.js     # Entry point
│
├── frontend/         # React frontend
│   ├── public/       # Static assets
│   ├── src/
│   │   ├── assets/   # Images, icons, logos
│   │   ├── components/
│   │   │   ├── common/     # Reusable components
│   │   │   ├── dashboard/  # Dashboard components
│   │   │   └── forms/      # Form components
│   │   ├── context/        # React context
│   │   ├── hooks/          # Custom hooks
│   │   ├── layouts/        # Layout components
│   │   ├── pages/          # Page components
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── customer/
│   │   │   ├── dispatcher/
│   │   │   ├── driver/
│   │   │   └── public/
│   │   ├── routes/         # Route configuration
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   ├── .env
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## Getting Started

### Backend Setup

```bash
cd backend
npm install
npm start
```

Backend runs on: http://localhost:5002

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:5173

## Environment Variables

### Backend (.env)

```
DATABASE_URL=your_postgresql_connection_string
PORT=5002
NODE_ENV=development
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000/api
```

## User Roles

- **Admin**: Full system access
- **Dispatcher**: Manage bookings and assignments
- **Driver**: View and update trips
- **Customer**: Book and track shipments

## Technologies Used

### Backend

- Node.js
- Express
- PostgreSQL (Neon) via Prisma
- JWT Authentication
- Chapa Payment Gateway

### Frontend

- React 19
- React Router
- Tailwind CSS
- Axios
- Vite

## License

MIT
