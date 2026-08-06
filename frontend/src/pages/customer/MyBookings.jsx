import { useState, useEffect } from "react";
import { shipmentService } from "../../services/shipmentService";
import {
  Package,
  Search,
  Loader,
  MapPin,
  Calendar,
  Eye,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const MyBookings = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedShipment, setSelectedShipment] = useState(null);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);

      const response = await shipmentService.getAllShipments();

      setShipments(response.data || []);
    } catch (err) {
      console.error("Failed to fetch shipments:", err);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      assigned: "bg-indigo-100 text-indigo-800",
      picked_up: "bg-purple-100 text-purple-800",
      in_transit: "bg-cyan-100 text-cyan-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return colors[status] || "bg-slate-100 text-slate-800";
  };


  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch = (shipment.shipmentNumber || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      shipment.status === filterStatus;

    return matchesSearch && matchesFilter;
  });


  return (
    <div className="min-h-screen bg-slate-50 p-6">

      <Toaster position="top-right" />


      {/* Header */}
      <div className="mb-8">

        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          My Bookings
        </h1>

        <p className="text-slate-600">
          View and manage all your shipment bookings
        </p>

      </div>



      {/* Search & Filter */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">

        <div className="flex flex-col md:flex-row gap-4">


          <div className="flex-1 relative">

            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"
            />

            <input
              type="text"
              placeholder="Search by tracking number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

          </div>



          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          >

            <option value="all">
              All Status
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="in_transit">
              In Transit
            </option>

            <option value="delivered">
              Delivered
            </option>

          </select>


        </div>

      </div>





      {/* Loading */}
      {loading ? (

        <div className="flex justify-center py-20">

          <Loader className="w-8 h-8 text-amber-500 animate-spin" />

        </div>


      ) : filteredShipments.length === 0 ? (


        <div className="text-center py-16 bg-white rounded-xl">

          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />

          <p className="text-slate-500 text-lg">
            No bookings found
          </p>

        </div>


      ) : (


        <div className="grid gap-4">

          {filteredShipments.map((s, i) => (

            <motion.div
              key={s._id}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: i * 0.1,
              }}
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition"
            >


              <div className="flex flex-col md:flex-row justify-between gap-4">


                <div className="space-y-3 flex-1">


                  <div className="flex items-center gap-3">


                    <span className="text-sm font-mono text-slate-500">
                      #{s.shipmentNumber}
                    </span>



                    <span
                      className={`${getStatusColor(
                        s.status
                      )} px-3 py-1 rounded-full text-xs font-medium`}
                    >

                      {s.status}

                    </span>


                  </div>




                  <div className="grid md:grid-cols-2 gap-4">


                    <LocationItem
                      iconColor="text-green-500"
                      title="Pickup"
                      value={s.pickupLocation}
                    />


                    <LocationItem
                      iconColor="text-red-500"
                      title="Delivery"
                      value={s.deliveryLocation}
                    />


                  </div>




                  <div className="flex items-center gap-4 text-sm text-slate-600">


                    <div className="flex items-center gap-1">

                      <Calendar className="w-4 h-4" />

                      {new Date(
                        s.createdAt
                      ).toLocaleDateString()}

                    </div>



                    <div className="flex items-center gap-1">

                      <Package className="w-4 h-4" />

                      {s.cargoWeight || "N/A"} kg

                    </div>


                  </div>


                </div>




                <button
                  onClick={() => setSelectedShipment(s)}
                  className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2"
                >

                  <Eye className="w-4 h-4" />

                  View

                </button>


              </div>


            </motion.div>


          ))}


        </div>


      )}







      {/* Modal */}

      {selectedShipment && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">


          <motion.div
            initial={{
              scale: 0.9,
            }}
            animate={{
              scale: 1,
            }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full"
          >


            <div className="flex justify-between items-start mb-6">


              <div>

                <h2 className="text-2xl font-bold">
                  Shipment Details
                </h2>


                <p className="text-slate-500 mt-1">

                  #{selectedShipment.shipmentNumber}

                </p>


              </div>



              <button
                onClick={() =>
                  setSelectedShipment(null)
                }
                className="text-slate-400"
              >

                <X className="w-6 h-6" />

              </button>


            </div>




            <div className="grid md:grid-cols-2 gap-4">


              <DetailItem
                label="Status"
                value={selectedShipment.status}
              />


              <DetailItem
                label="Created"
                value={new Date(
                  selectedShipment.createdAt
                ).toLocaleDateString()}
              />


              <DetailItem
                label="Pickup"
                value={selectedShipment.pickupLocation}
              />


              <DetailItem
                label="Delivery"
                value={selectedShipment.deliveryLocation}
              />


              <DetailItem
                label="Weight"
                value={`${selectedShipment.cargoWeight || "N/A"} kg`}
              />


              <DetailItem
                label="Type"
                value={selectedShipment.cargoType || "N/A"}
              />


            </div>


          </motion.div>


        </div>

      )}



    </div>
  );
};




// Components

const LocationItem = ({
  title,
  value,
  iconColor,
}) => (

  <div className="flex items-start gap-2">

    <MapPin
      className={`w-4 h-4 ${iconColor} mt-1`}
    />

    <div>

      <p className="text-xs text-slate-500">
        {title}
      </p>

      <p className="text-sm font-medium">
        {value}
      </p>

    </div>

  </div>

);



const DetailItem = ({
  label,
  value,
}) => (

  <div>

    <p className="text-sm text-slate-500 mb-1">
      {label}
    </p>

    <p className="font-medium">
      {value}
    </p>

  </div>

);



export default MyBookings;