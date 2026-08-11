import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AdminDataProvider } from "./context/AdminDataContext";
import { Toaster } from "react-hot-toast";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import DispatcherLayout from "./layouts/DispatcherLayout";
import DriverLayout from "./layouts/DriverLayout";
import CustomerLayout from "./layouts/CustomerLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import Loading from "./components/common/Loading";
import ScrollToTop from "./components/common/ScrollToTop";
import TestDarkMode from "./pages/TestDarkMode";

// Public Pages
const Home = lazy(() => import("./pages/public/Home"));
const About = lazy(() => import("./pages/public/About"));
const Contact = lazy(() => import("./pages/public/Contact"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const NotFound = lazy(() => import("./pages/public/NotFound"));

// Payment Flow Pages (Chapa Callback & Verification)
const PaymentSuccess = lazy(() => import("./pages/payment/PaymentSuccess"));
const PaymentFailed = lazy(() => import("./pages/payment/PaymentFailed"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Users = lazy(() => import("./pages/admin/Users"));
const Vehicles = lazy(() => import("./pages/admin/Vehicles"));
const AddVehicle = lazy(() => import("./pages/admin/AddVehicle"));
const Drivers = lazy(() => import("./pages/admin/Drivers"));
const AddDriver = lazy(() => import("./pages/admin/AddDriver"));
const Shipments = lazy(() => import("./pages/admin/Shipments"));
const CustomerManagement = lazy(
  () => import("./pages/admin/CustomerManagement"),
);
const AddCustomer = lazy(() => import("./pages/admin/AddCustomer"));
const BookingManagement = lazy(() => import("./pages/admin/BookingManagement"));
const AddBooking = lazy(() => import("./pages/admin/AddBooking"));
const MaintenanceManagement = lazy(
  () => import("./pages/admin/MaintenanceManagement"),
);
const AddMaintenance = lazy(() => import("./pages/admin/AddMaintenance"));
const VehicleAvailability = lazy(
  () => import("./pages/admin/VehicleAvailability"),
);
const LiveTracking = lazy(() => import("./pages/admin/LiveTracking"));
const TrackingHistory = lazy(() => import("./pages/admin/TrackingHistory"));
const Payments = lazy(() => import("./pages/admin/Payments"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const Settings = lazy(() => import("./pages/admin/Settings"));

// Dispatcher Pages
const DispatcherDashboard = lazy(
  () => import("./pages/dispatcher/DispatcherDashboard"),
);
const Bookings = lazy(() => import("./pages/dispatcher/Bookings"));
const AssignVehicle = lazy(() => import("./pages/dispatcher/AssignVehicle"));
const AssignDriver = lazy(() => import("./pages/dispatcher/AssignDriver"));
const TrackTrips = lazy(() => import("./pages/dispatcher/TrackTrips"));

// Driver Pages
const DriverDashboard = lazy(() => import("./pages/driver/DriverDashboard"));
const MyTrips = lazy(() => import("./pages/driver/MyTrips"));
const MyVehicles = lazy(() => import("./pages/driver/MyVehicles"));
const RegisterVehicle = lazy(() => import("./pages/driver/RegisterVehicle"));
const TripDetails = lazy(() => import("./pages/driver/TripDetails"));
const UpdateStatus = lazy(() => import("./pages/driver/UpdateStatus"));
const DriverProfile = lazy(() => import("./pages/driver/Profile"));

// Customer Pages
const CustomerDashboard = lazy(
  () => import("./pages/customer/CustomerDashboard"),
);
const BookShipment = lazy(() => import("./pages/customer/BookShipment"));
const MyBookings = lazy(() => import("./pages/customer/MyBookings"));
const PaymentHistory = lazy(() => import("./pages/customer/PaymentHistory"));
const TrackShipment = lazy(() => import("./pages/customer/TrackShipment"));
const Profile = lazy(() => import("./pages/customer/Profile"));
const ShipmentDetails = lazy(() => import("./pages/customer/ShipmentDetails"));

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Toaster position="top-right" />
      <AuthProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/test-dark-mode" element={<TestDarkMode />} />

            {/* Payment Return & Verification Routes */}
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failed" element={<PaymentFailed />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={["admin"]}>
                    <AdminDataProvider>
                      <AdminLayout />
                    </AdminDataProvider>
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
              <Route path="payments" element={<PaymentHistory />} />
              <Route path="track-shipment" element={<TrackShipment />} />
              <Route path="profile" element={<Profile />} />
              <Route
                path="shipment-details/:id"
                element={<ShipmentDetails />}
              />
            </Route>

            {/* 404 Catch-All Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
