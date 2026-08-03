import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import DispatcherLayout from "./layouts/DispatcherLayout";
import DriverLayout from "./layouts/DriverLayout";
import CustomerLayout from "./layouts/CustomerLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";

import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

import AdminDashboard from "./pages/admin/AdminDashboard";
import Users from "./pages/admin/Users";
import Vehicles from "./pages/admin/Vehicles";
import AddVehicle from "./pages/admin/AddVehicle";
import Drivers from "./pages/admin/Drivers";
import AddDriver from "./pages/admin/AddDriver";
import Shipments from "./pages/admin/Shipments";
import CustomerManagement from "./pages/admin/CustomerManagement";
import AddCustomer from "./pages/admin/AddCustomer";
import BookingManagement from "./pages/admin/BookingManagement";
import AddBooking from "./pages/admin/AddBooking";
import MaintenanceManagement from "./pages/admin/MaintenanceManagement";
import AddMaintenance from "./pages/admin/AddMaintenance";
import VehicleAvailability from "./pages/admin/VehicleAvailability";
import LiveTracking from "./pages/admin/LiveTracking";
import TrackingHistory from "./pages/admin/TrackingHistory";
import Payments from "./pages/admin/Payments";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";

import DispatcherDashboard from "./pages/dispatcher/DispatcherDashboard";
import Bookings from "./pages/dispatcher/Bookings";
import AssignVehicle from "./pages/dispatcher/AssignVehicle";
import AssignDriver from "./pages/dispatcher/AssignDriver";
import TrackTrips from "./pages/dispatcher/TrackTrips";

import DriverDashboard from "./pages/driver/DriverDashboard";
import MyTrips from "./pages/driver/MyTrips";
import TripDetails from "./pages/driver/TripDetails";
import UpdateStatus from "./pages/driver/UpdateStatus";
import RegisterVehicle from "./pages/driver/RegisterVehicle";
import DriverProfile from "./pages/driver/Profile";
import MyVehicles from "./pages/driver/MyVehicles";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import BookShipment from "./pages/customer/BookShipment";
import MyBookings from "./pages/customer/MyBookings";
import TrackShipment from "./pages/customer/TrackShipment";
import Profile from "./pages/customer/Profile";

import ScrollToTop from "./components/common/ScrollToTop";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["admin"]}>
                  <AdminLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="vehicles/add" element={<AddVehicle />} />
            <Route path="vehicles/edit/:id" element={<AddVehicle />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="drivers/add" element={<AddDriver />} />
            <Route path="drivers/edit/:id" element={<AddDriver />} />
            <Route path="customers" element={<CustomerManagement />} />
            <Route path="customers/add" element={<AddCustomer />} />
            <Route path="customers/edit/:id" element={<AddCustomer />} />
            <Route path="bookings" element={<BookingManagement />} />
            <Route path="bookings/add" element={<AddBooking />} />
            <Route path="bookings/edit/:id" element={<AddBooking />} />
            <Route path="maintenance" element={<MaintenanceManagement />} />
            <Route path="maintenance/add" element={<AddMaintenance />} />
            <Route path="maintenance/edit/:id" element={<AddMaintenance />} />
            <Route path="calendar" element={<VehicleAvailability />} />
            <Route path="tracking/live" element={<LiveTracking />} />
            <Route path="tracking/history" element={<TrackingHistory />} />
            <Route path="payments" element={<Payments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="shipments" element={<Shipments />} />
          </Route>

          <Route
            path="/dispatcher"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["dispatcher"]}>
                  <DispatcherLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DispatcherDashboard />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="assign-vehicle" element={<AssignVehicle />} />
            <Route path="assign-driver" element={<AssignDriver />} />
            <Route path="track-trips" element={<TrackTrips />} />
          </Route>

          <Route
            path="/driver"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["driver"]}>
                  <DriverLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DriverDashboard />} />
            <Route path="my-trips" element={<MyTrips />} />
            <Route path="my-vehicles" element={<MyVehicles />} />
            <Route path="register-vehicle" element={<RegisterVehicle />} />
            <Route path="trip-details/:id" element={<TripDetails />} />
            <Route path="update-status/:id" element={<UpdateStatus />} />
            <Route path="profile" element={<DriverProfile />} />
          </Route>

          <Route
            path="/customer"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["customer"]}>
                  <CustomerLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="book-shipment" element={<BookShipment />} />
            <Route path="my-bookings" element={<MyBookings />} />
            <Route path="track-shipment" element={<TrackShipment />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
