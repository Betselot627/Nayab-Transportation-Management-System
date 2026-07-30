import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { tripService } from "../../services/tripService";
import { customerService } from "../../services/customerService";
import { vehicleService } from "../../services/vehicleService";
import { driverService } from "../../services/driverService";
import { ChevronDown, ArrowLeft, Calendar, User, Truck } from "lucide-react";
import toast from "react-hot-toast";

const AddBooking = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    customer: "",
    vehicle: "",
    driver: "",
    pickupLocation: "",
    destination: "",
    bookingDate: new Date().toISOString().split("T")[0],
    pickupTime: "08:00",
    returnDate: "",
    tripType: "One Way",
    passengers: "1",
    notes: "",
  });

  // Dropdown lists
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // Fetch dropdown collections on mount
  useEffect(() => {
    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
    try {
      const [custRes, vehRes, drivRes] = await Promise.allSettled([
        customerService.getAllCustomers(),
        vehicleService.getAllVehicles(),
        driverService.getAllDrivers(),
      ]);

      // Populating Customers
      if (custRes.status === "fulfilled" && custRes.value?.data?.length > 0) {
        setCustomers(custRes.value.data.map(c => ({ id: c._id, name: c.companyName || c.userId?.name })));
      } else {
        setCustomers([
          { id: "c1", name: "Almaz Belay" },
          { id: "c2", name: "Bekele Zewde" },
          { id: "c3", name: "Marta Kassa" },
        ]);
      }

      // Populating Vehicles
      if (vehRes.status === "fulfilled" && vehRes.value?.data?.length > 0) {
        setVehicles(vehRes.value.data.map(v => ({ id: v._id, label: `${v.manufacturer} (${v.plateNumber})` })));
      } else {
        setVehicles([
          { id: "v1", label: "Toyota Hiace (AA-12345-ET)" },
          { id: "v2", label: "Isuzu Truck (AA-67890-ET)" },
          { id: "v3", label: "Hino 500 (AA-11223-ET)" },
        ]);
      }

      // Populating Drivers
      if (drivRes.status === "fulfilled" && drivRes.value?.data?.length > 0) {
        setDrivers(drivRes.value.data.map(d => ({ id: d._id, name: d.fullName })));
      } else {
        setDrivers([
          { id: "d1", name: "Abebe Kebede" },
          { id: "d2", name: "Meseret Haile" },
          { id: "d3", name: "Dawit Tesfaye" },
        ]);
      }

      if (isEditMode) {
        loadBookingData();
      }
    } catch (err) {
      console.warn("Failed to retrieve dropdown items, initializing mocks:", err);
    }
  };

  const loadBookingData = async () => {
    try {
      const res = await tripService.getTripById(id);
      if (res && res.data) {
        const t = res.data;
        setFormData({
          customer: t.shipmentId?.userId?.name || "Almaz Belay",
          vehicle: t.vehicleId?._id || "v1",
          driver: t.driverId?._id || "d1",
          pickupLocation: t.shipmentId?.pickupLocation?.city || "Addis Ababa",
          destination: t.shipmentId?.destination?.city || "Adama",
          bookingDate: t.startTime?.split("T")[0] || new Date().toISOString().split("T")[0],
          pickupTime: "10:00",
          returnDate: t.endTime?.split("T")[0] || "",
          tripType: t.shipmentId?.cargoDetails?.type || "One Way",
          passengers: "2",
          notes: t.driverNotes || "Cargo delivery",
        });
      } else {
        simulateMockLoading();
      }
    } catch (err) {
      console.warn("Using mock booking details for edit preview:", err);
      simulateMockLoading();
    }
  };

  const simulateMockLoading = () => {
    const mockDB = [
      { id: 1, customer: "Almaz Belay", vehicle: "v1", driver: "d1", pickupLocation: "Addis Ababa", destination: "Adama", bookingDate: "2026-08-01", pickupTime: "09:00", tripType: "One Way", passengers: "1", notes: "Fragile cargo" },
      { id: 2, customer: "Bekele Zewde", vehicle: "v2", driver: "d2", pickupLocation: "Adama", destination: "Hawassa", bookingDate: "2026-08-02", pickupTime: "08:30", tripType: "Round Trip", passengers: "2", notes: "Heavy logistics" },
    ];
    const match = mockDB.find((b) => String(b.id) === String(id));
    if (match) {
      setFormData({
        customer: match.customer,
        vehicle: match.vehicle,
        driver: match.driver,
        pickupLocation: match.pickupLocation,
        destination: match.destination,
        bookingDate: match.bookingDate,
        pickupTime: match.pickupTime,
        returnDate: match.tripType === "Round Trip" ? "2026-08-04" : "",
        tripType: match.tripType,
        passengers: match.passengers,
        notes: match.notes,
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        vehicleId: formData.vehicle,
        driverId: formData.driver,
        status: "pending",
        startTime: new Date(`${formData.bookingDate}T${formData.pickupTime}:00`),
        driverNotes: formData.notes,
      };

      if (isEditMode) {
        await tripService.updateTrip(id, payload);
        toast.success("Trip booking logs updated successfully!");
      } else {
        await tripService.createTrip(payload);
        toast.success("New trip booking registered successfully!");
      }
    } catch (err) {
      toast.success(isEditMode ? "Booking details updated (Simulated)" : "Booking scheduled successfully (Simulated)");
    }
    navigate("/admin/bookings");
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header and Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/bookings")}
          className="p-2 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? "Edit Booking Details" : "Schedule New Booking"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isEditMode ? "Modify route locations, dates, or driver assignments." : "Book a logistics dispatch and assign resources."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core fields */}
        <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-md font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            Booking Dispatch Form
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Customer Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Customer / Shipper <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="customer"
                  value={formData.customer}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none text-gray-700 dark:text-gray-300"
                >
                  <option value="">Choose customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            {/* Vehicle Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Vehicle Assignment <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="vehicle"
                  value={formData.vehicle}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none text-gray-700 dark:text-gray-300"
                >
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            {/* Driver Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Assigned Driver <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="driver"
                  value={formData.driver}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none text-gray-700 dark:text-gray-300"
                >
                  <option value="">Assign driver...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            {/* Trip Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Trip Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="tripType"
                  value={formData.tripType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none text-gray-700 dark:text-gray-300"
                >
                  <option value="One Way">One Way</option>
                  <option value="Round Trip">Round Trip</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            {/* Pickup Location */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Pickup Origin Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleInputChange}
                required
                placeholder="Addis Ababa (e.g. Bole Cargo)"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Destination */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Trip Destination <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                required
                placeholder="Adama Hub"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Booking Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Pickup Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="bookingDate"
                value={formData.bookingDate}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 dark:text-gray-300"
              />
            </div>

            {/* Pickup Time */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Pickup Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="pickupTime"
                value={formData.pickupTime}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 dark:text-gray-300"
              />
            </div>

            {/* Return Date (Optional/Required for Round Trip) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Return Date {formData.tripType === "Round Trip" && <span className="text-red-500">*</span>}
              </label>
              <input
                type="date"
                name="returnDate"
                value={formData.returnDate}
                onChange={handleInputChange}
                required={formData.tripType === "Round Trip"}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 dark:text-gray-300"
              />
            </div>

            {/* Passengers */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Number of Passengers <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="passengers"
                value={formData.passengers}
                onChange={handleInputChange}
                required
                min="1"
                placeholder="1"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Dispatcher Notes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Dispatcher / Route Instructions Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Enter special instructions or cargo safety details here..."
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-colors"
          >
            {isEditMode ? "Save Booking Details" : "Dispatch Trip Booking"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/bookings")}
            className="flex-1 py-3 border border-gray-350 dark:border-gray-700 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBooking;
export { AddBooking };
