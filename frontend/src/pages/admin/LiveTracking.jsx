import { useState, useEffect, useRef } from "react";
import { Truck, Navigation, ShieldCheck, MapPin, Gauge, Clock } from "lucide-react";
import Badge from "../../components/common/Badge";

const LiveTracking = () => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Active tracking vehicle fleet status
  const [trackedVehicles, setTrackedVehicles] = useState([
    { id: 1, name: "Toyota Hiace (V001)", driver: "Abebe Kebede", lat: 9.01, lng: 38.74, speed: 65, status: "Running", destination: "Adama", lastUpdated: "Just now" },
    { id: 2, name: "Isuzu Truck (V002)", driver: "Meseret Haile", lat: 8.98, lng: 38.80, speed: 0, status: "Idle", destination: "Bole Hub", lastUpdated: "3 mins ago" },
    { id: 3, name: "Hino 500 (V003)", driver: "Dawit Tesfaye", lat: 9.05, lng: 38.72, speed: 72, status: "Running", destination: "Hawassa", lastUpdated: "Just now" },
    { id: 4, name: "Volvo Trailer (V007)", driver: "Daniel Alemu", lat: 8.54, lng: 39.26, speed: 80, status: "Running", destination: "Dire Dawa", lastUpdated: "Just now" },
  ]);

  // Load Leaflet dynamically via CDN script injection
  useEffect(() => {
    // If Leaflet is already in window, update state
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    // Inject CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Inject JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup script tags if needed
    };
  }, []);

  // Initialize Map once Leaflet is loaded
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = window.L;
    
    // Addis Ababa Coordinates center
    const map = L.map(mapContainerRef.current).setView([9.0122, 38.7578], 11);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Initialize markers
    trackedVehicles.forEach((vehicle) => {
      const marker = L.marker([vehicle.lat, vehicle.lng]).addTo(map);
      marker.bindPopup(getPopupContent(vehicle));
      markersRef.current[vehicle.id] = marker;
    });

  }, [leafletLoaded]);

  // Update popup template helper
  const getPopupContent = (v) => {
    return `
      <div style="font-family: sans-serif; min-width: 160px; line-height: 1.4;">
        <h4 style="margin: 0 0 4px 0; color: #1e3b8b;">${v.name}</h4>
        <p style="margin: 0; font-size: 11px;"><strong>Driver:</strong> ${v.driver}</p>
        <p style="margin: 0; font-size: 11px;"><strong>Speed:</strong> ${v.speed} km/h</p>
        <p style="margin: 0; font-size: 11px;"><strong>Dest:</strong> ${v.destination}</p>
        <p style="margin: 0; font-size: 11px;"><strong>Status:</strong> <span style="color: ${v.status === 'Running' ? '#10b981' : '#f59e0b'}; font-weight: bold;">${v.status}</span></p>
      </div>
    `;
  };

  // Simulating live coordinates movements every 5 seconds
  useEffect(() => {
    if (!leafletLoaded) return;
    
    const interval = setInterval(() => {
      setTrackedVehicles((prevVehicles) => {
        return prevVehicles.map((v) => {
          if (v.status !== "Running") return v;

          // Increment latitude/longitude by tiny steps to simulate route driving
          const nextLat = v.lat + (Math.random() - 0.5) * 0.005;
          const nextLng = v.lng + (Math.random() - 0.5) * 0.005;
          const nextSpeed = Math.floor(Math.random() * (85 - 55) + 55);

          const updated = {
            ...v,
            lat: nextLat,
            lng: nextLng,
            speed: nextSpeed,
            lastUpdated: "Just now",
          };

          // Update real-time Leaflet markers position on the active map instances
          const markerInstance = markersRef.current[v.id];
          if (markerInstance && window.L) {
            markerInstance.setLatLng([nextLat, nextLng]);
            markerInstance.setPopupContent(getPopupContent(updated));
          }

          return updated;
        });
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [leafletLoaded]);

  const getBadgeVariant = (status) => {
    switch (status.toLowerCase()) {
      case "running":
        return "success";
      case "idle":
        return "warning";
      default:
        return "default";
    }
  };

  const centerOnVehicle = (v) => {
    if (mapInstanceRef.current && window.L) {
      mapInstanceRef.current.setView([v.lat, v.lng], 14);
      markersRef.current[v.id]?.openPopup();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Vehicle Tracking</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Monitor operating vehicle positions and telemetry details on an active map layer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[75vh]">
        {/* Left Side: Vehicle Telemetry Cards */}
        <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-4 overflow-y-auto h-full">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Active Operating Fleet
          </h3>
          <div className="space-y-3">
            {trackedVehicles.map((v) => (
              <div
                key={v.id}
                onClick={() => centerOnVehicle(v)}
                className="p-4 border border-gray-150 dark:border-gray-850 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl hover:shadow-md cursor-pointer transition-all duration-200 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-blue-500" />
                      {v.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">Driver: {v.driver}</p>
                  </div>
                  <Badge variant={getBadgeVariant(v.status)}>{v.status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-650 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-850">
                  <div className="flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-gray-400" />
                    <span>{v.speed} km/h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">Dest: {v.destination}</span>
                  </div>
                  <div className="flex items-center gap-1 col-span-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Last Updated: {v.lastUpdated}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Map Canvas Container */}
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

export default LiveTracking;
export { LiveTracking };
