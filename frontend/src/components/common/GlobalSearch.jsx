import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Truck, Users, Calendar, ArrowRight, X } from "lucide-react";

const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState({
    vehicles: [],
    drivers: [],
    customers: [],
    bookings: [],
  });
  
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Mock index database for global searching
  const mockDB = {
    vehicles: [
      { id: "V001", name: "Toyota Hiace", registration: "AA-12345-ET", path: "/admin/vehicles" },
      { id: "V002", name: "Isuzu Truck", registration: "AA-67890-ET", path: "/admin/vehicles" },
      { id: "V003", name: "Hino 500", registration: "AA-11223-ET", path: "/admin/vehicles" },
      { id: "V004", name: "Mercedes Sprinter", registration: "AA-44556-ET", path: "/admin/vehicles" },
      { id: "V005", name: "Mitsubishi Canter", registration: "AA-78901-ET", path: "/admin/vehicles" },
    ],
    drivers: [
      { id: "D001", name: "Abebe Kebede", license: "DL-908123", path: "/admin/drivers" },
      { id: "D002", name: "Meseret Haile", license: "DL-671234", path: "/admin/drivers" },
      { id: "D003", name: "Dawit Tesfaye", license: "DL-112233", path: "/admin/drivers" },
      { id: "D004", name: "Tigist Alemayehu", license: "DL-445566", path: "/admin/drivers" },
    ],
    customers: [
      { id: "C001", name: "Almaz Belay", phone: "+251911223344", path: "/admin/customers" },
      { id: "C002", name: "Bekele Zewde", phone: "+251912445566", path: "/admin/customers" },
      { id: "C003", name: "Marta Kassa", phone: "+251913778899", path: "/admin/customers" },
    ],
    bookings: [
      { id: "B001", name: "Booking B001", route: "Addis Ababa → Adama", path: "/admin/bookings" },
      { id: "B002", name: "Booking B002", route: "Hawassa → Addis Ababa", path: "/admin/bookings" },
      { id: "B003", name: "Booking B003", route: "Bahir Dar → Gondar", path: "/admin/bookings" },
    ],
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ vehicles: [], drivers: [], customers: [], bookings: [] });
      return;
    }

    const term = query.toLowerCase();
    
    const filteredVehicles = mockDB.vehicles.filter(
      (v) => v.name.toLowerCase().includes(term) || v.registration.toLowerCase().includes(term)
    );

    const filteredDrivers = mockDB.drivers.filter(
      (d) => d.name.toLowerCase().includes(term) || d.license.toLowerCase().includes(term)
    );

    const filteredCustomers = mockDB.customers.filter(
      (c) => c.name.toLowerCase().includes(term) || c.phone.includes(term)
    );

    const filteredBookings = mockDB.bookings.filter(
      (b) => b.id.toLowerCase().includes(term) || b.route.toLowerCase().includes(term)
    );

    setResults({
      vehicles: filteredVehicles,
      drivers: filteredDrivers,
      customers: filteredCustomers,
      bookings: filteredBookings,
    });
  }, [query]);

  const handleSelect = (path) => {
    navigate(path);
    setIsOpen(false);
    setQuery("");
  };

  const hasResults =
    results.vehicles.length > 0 ||
    results.drivers.length > 0 ||
    results.customers.length > 0 ||
    results.bookings.length > 0;

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Global search (Vehicles, Drivers, Bookings...)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2 bg-gray-100 hover:bg-gray-200/75 dark:bg-gray-800 dark:hover:bg-gray-700/75 border border-transparent focus:border-blue-500 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults({ vehicles: [], drivers: [], customers: [], bookings: [] });
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[32rem] overflow-y-auto animate-slide-down">
          {hasResults ? (
            <div className="p-2 space-y-3">
              {/* Vehicles */}
              {results.vehicles.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    Vehicles
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {results.vehicles.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => handleSelect(v.path)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center justify-between text-sm transition-colors duration-150 group"
                      >
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{v.name}</span>
                          <span className="text-xs text-gray-500 ml-2">[{v.registration}]</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-150" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Drivers */}
              {results.drivers.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Drivers
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {results.drivers.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => handleSelect(d.path)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center justify-between text-sm transition-colors duration-150 group"
                      >
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{d.name}</span>
                          <span className="text-xs text-gray-500 ml-2">License: {d.license}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-150" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers */}
              {results.customers.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Customers
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {results.customers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelect(c.path)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center justify-between text-sm transition-colors duration-150 group"
                      >
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                          <span className="text-xs text-gray-500 ml-2">{c.phone}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-150" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bookings */}
              {results.bookings.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Bookings
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {results.bookings.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleSelect(b.path)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center justify-between text-sm transition-colors duration-150 group"
                      >
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{b.id}</span>
                          <span className="text-xs text-gray-500 ml-2">{b.route}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-150" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No matching records for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
