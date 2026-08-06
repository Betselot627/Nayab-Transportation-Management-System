import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Calendar, Clock, RotateCcw, ArrowRight, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

const TrackingHistory = () => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routePolylineRef = useRef(null);
  const stopMarkersRef = useRef([]);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Search parameters
  const [vehicle, setVehicle] = useState("V001");
  const [driver, setDriver] = useState("D001");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Trip stats state
  const [tripStats, setTripStats] = useState({
    distance: "148.5 km",
    stops: 3,
    startTime: "08:15 AM",
    endTime: "11:45 AM",
    route: "Addis Ababa → Bishoftu → Adama Hub",
  });

  // Mock Route Coordinates Database
  const routeDB = {
    V001: [
      [9.0122, 38.7578], // Addis Ababa
      [8.95, 38.85],
      [8.87, 38.98], // Bishoftu Stop
      [8.72, 39.12],
      [8.54, 39.26], // Adama Hub
    ],
    V002: [
      [8.54, 39.26], // Adama
      [8.35, 39.15],
      [8.10, 39.02],
      [7.65, 38.72],
      [7.05, 38.48], // Hawassa
    ],
  };

  // Load Leaflet dynamically via CDN script injection
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = window.L;
    
    // Default Addis coordinates
    const map = L.map(mapContainerRef.current).setView([9.0122, 38.7578], 10);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Initial render
    plotHistoryRoute();
  }, [leafletLoaded]);

  // Plots route polylines and stop pins on map
  const plotHistoryRoute = () => {
    const L = window.L;
    if (!L || !mapInstanceRef.current) return;

    // Clear previous line
    if (routePolylineRef.current) {
      mapInstanceRef.current.removeLayer(routePolylineRef.current);
    }
    // Clear previous stop markers
    stopMarkersRef.current.forEach((m) => mapInstanceRef.current.removeLayer(m));
    stopMarkersRef.current = [];

    const coordinates = routeDB[vehicle] || routeDB.V001;

    // Draw route line
    const polyline = L.polyline(coordinates, { color: "#3b82f6", weight: 5, opacity: 0.8 }).addTo(mapInstanceRef.current);
    routePolylineRef.current = polyline;

    // Center map view on route
    mapInstanceRef.current.fitBounds(polyline.getBounds());

    // Pin markers for start, end, and stops
    const startPin = L.marker(coordinates[0]).addTo(mapInstanceRef.current).bindPopup("<b>Trip Start</b><br>Origin point");
    const endPin = L.marker(coordinates[coordinates.length - 1]).addTo(mapInstanceRef.current).bindPopup("<b>Trip Destination</b><br>Arrival point");
    
    stopMarkersRef.current = [startPin, endPin];

    // Intermediate stops check
    if (coordinates.length > 2) {
      const midIdx = Math.floor(coordinates.length / 2);
      const stopPin = L.marker(coordinates[midIdx]).addTo(mapInstanceRef.current).bindPopup("<b>Rest/Refuel Stop</b>");
      stopMarkersRef.current.push(stopPin);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    plotHistoryRoute();

    // Adjust stats conditionally based on dropdown selections
    if (vehicle === "V001") {
      setTripStats({
        distance: "148.5 km",
        stops: 3,
        startTime: "08:15 AM",
        endTime: "11:45 AM",
        route: "Addis Ababa → Bishoftu → Adama Hub",
      });
    } else {
      setTripStats({
        distance: "275.2 km",
        stops: 4,
        startTime: "06:00 AM",
        endTime: "12:30 PM",
        route: "Adama Hub → Ziway → Shashamane → Hawassa",
      });
    }
    toast.success("History route log rendered successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tracking History</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review historical route logs, travel distances, and duration details of previous dispatches.
        </p>
      </div>

      {/* Query controls form */}
      <form onSubmit={handleSearch} className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          
          {/* Select Vehicle */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Vehicle</label>
            <select
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 dark:text-gray-300 font-semibold"
            >
              <option value="V001">Toyota Hiace (V001)</option>
              <option value="V002">Isuzu Truck (V002)</option>
              <option value="V003">Hino 500 (V003)</option>
            </select>
          </div>

          {/* Select Driver */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Driver</label>
            <select
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 dark:text-gray-300 font-semibold"
            >
              <option value="D001">Abebe Kebede</option>
              <option value="D002">Meseret Haile</option>
              <option value="D003">Dawit Tesfaye</option>
            </select>
          </div>

          {/* Choose Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Travel Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 dark:text-gray-300"
            />
          </div>

          {/* Submit Trigger */}
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors duration-150 shadow-sm"
          >
            <Search className="w-4 h-4" /> Load Route Log
          </button>
        </div>
      </form>

      {/* Metrics Summary and Map Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[65vh]">
        {/* Route Details Panel */}
        <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6 overflow-y-auto h-full">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-3">
            Trip Analytics Summary
          </h3>

          <div className="space-y-4">
            
            {/* Route path */}
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Route History</span>
              <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                {tripStats.route}
              </p>
            </div>

            {/* Distance Travelled */}
            <div className="flex justify-between items-center py-3 border-y border-gray-100 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-500">Distance Travelled</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> {tripStats.distance}
              </span>
            </div>

            {/* Total Stops */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-500">Total Stops</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {tripStats.stops} Stops
              </span>
            </div>

            {/* Start Time */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> Start Time
              </span>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {tripStats.startTime}
              </span>
            </div>

            {/* End Time */}
            <div className="flex justify-between items-center py-3">
              <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> End Time
              </span>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {tripStats.endTime}
              </span>
            </div>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="lg:col-span-2 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm h-full relative">
          {!leafletLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-sm text-gray-500">
              Loading OpenStreetMap Canvas overlay...
            </div>
          ) : null}
          <div ref={mapContainerRef} className="w-full h-full z-10"></div>
        </div>
      </div>
    </div>
  );
};

export default TrackingHistory;
export { TrackingHistory };
