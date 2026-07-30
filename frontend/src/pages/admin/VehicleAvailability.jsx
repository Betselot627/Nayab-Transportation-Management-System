import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Clock,
  Info,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import Badge from "../../components/common/Badge";

const VehicleAvailability = () => {
  const [view, setView] = useState("month"); // 'month' | 'week' | 'day'
  const [timeFilter, setTimeFilter] = useState("all"); // 'all' | 'morning' | 'afternoon' | 'evening'
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Selected event popup details
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Mock Booked/Scheduled Vehicle Events
  const [events, setEvents] = useState([
    { id: 1, title: "Toyota Hiace [Booked]", vehicle: "Toyota Hiace (AA-12345)", driver: "Abebe Kebede", date: "2026-08-01", timeSlot: "morning", type: "booked", desc: "Addis Ababa → Adama cargo delivery" },
    { id: 2, title: "Isuzu Truck [Booked]", vehicle: "Isuzu Truck (AA-67890)", driver: "Meseret Haile", date: "2026-08-02", timeSlot: "afternoon", type: "booked", desc: "Adama → Hawassa heavy transit" },
    { id: 3, title: "Mercedes Sprinter [Maintenance]", vehicle: "Mercedes Sprinter (AA-44556)", driver: "N/A", date: "2026-08-01", timeSlot: "all-day", type: "maintenance", desc: "Engine overhaul diagnostics at Bole Garage" },
    { id: 4, title: "Hino 500 [Available]", vehicle: "Hino 500 (AA-11223)", driver: "Dawit Tesfaye", date: "2026-08-03", timeSlot: "morning", type: "available", desc: "Fleet standby availability" },
    { id: 5, title: "Mitsubishi Canter [Booked]", vehicle: "Mitsubishi Canter (AA-78901)", driver: "Solomon Girma", date: "2026-07-31", timeSlot: "evening", type: "booked", desc: "Mekelle localized retail delivery" },
    { id: 6, title: "Volvo FH16 [Maintenance]", vehicle: "Volvo FH16 (AA-55667)", driver: "N/A", date: "2026-08-05", timeSlot: "all-day", type: "maintenance", desc: "Tire replacements and brake pads check" },
  ]);

  // Helpers to calculate calendar dates
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDay, totalDays };
  };

  const { firstDay, totalDays } = getDaysInMonth(selectedDate);

  const prevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  // Month navigation labels
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getEventColor = (type) => {
    switch (type) {
      case "available":
        return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/40";
      case "booked":
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/40";
      case "maintenance":
        return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/40";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Filter events matching active filters
  const getFilteredEventsForDate = (dateStr) => {
    return events.filter((e) => {
      const matchesDate = e.date === dateStr;
      const matchesTime = timeFilter === "all" || e.timeSlot === timeFilter || e.timeSlot === "all-day";
      return matchesDate && matchesTime;
    });
  };

  // Render Calendar Grid based on View Mode
  const renderCalendar = () => {
    if (view === "month") {
      const dayCells = [];
      // Empty buffer cells
      for (let i = 0; i < firstDay; i++) {
        dayCells.push(<div key={`empty-${i}`} className="min-h-24 bg-gray-50/50 dark:bg-gray-900/10 border border-gray-150 dark:border-gray-800/50"></div>);
      }

      // Active day cells
      for (let day = 1; day <= totalDays; day++) {
        const currentDayStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const dayEvents = getFilteredEventsForDate(currentDayStr);

        dayCells.push(
          <div key={`day-${day}`} className="min-h-28 bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-850 p-2 space-y-1.5 hover:shadow-inner transition-shadow flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{day}</span>
            <div className="space-y-1 overflow-y-auto max-h-20 flex-1">
              {dayEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border cursor-pointer truncate ${getEventColor(evt.type)}`}
                  title={evt.title}
                >
                  {evt.title}
                </div>
              ))}
            </div>
          </div>
        );
      }
      return <div className="grid grid-cols-7 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">{dayCells}</div>;
    }

    // Week View Mode
    if (view === "week") {
      const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return (
        <div className="grid grid-cols-7 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-950 p-4 gap-4">
          {weekdays.map((dayName, idx) => {
            const tempDate = new Date(selectedDate);
            tempDate.setDate(tempDate.getDate() - tempDate.getDay() + idx);
            const dateStr = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, "0")}-${String(tempDate.getDate()).padStart(2, "0")}`;
            const dayEvents = getFilteredEventsForDate(dateStr);

            return (
              <div key={idx} className="space-y-3 min-h-60 flex flex-col border-r border-gray-100 dark:border-gray-850 last:border-none pr-2">
                <div className="text-center pb-2 border-b border-gray-100 dark:border-gray-850">
                  <p className="text-xs text-gray-400 font-semibold uppercase">{dayName.slice(0, 3)}</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-white mt-1">{tempDate.getDate()}</p>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {dayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`text-[10px] font-semibold p-2 rounded-lg border cursor-pointer space-y-1 ${getEventColor(evt.type)}`}
                    >
                      <p className="truncate font-bold">{evt.title}</p>
                      <p className="text-[8px] text-gray-500">{evt.vehicle}</p>
                    </div>
                  ))}
                  {dayEvents.length === 0 && (
                    <p className="text-[10px] text-center text-gray-400 py-6">No Bookings</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Day View Mode
    if (view === "day") {
      const currentDayStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
      const dayEvents = getFilteredEventsForDate(currentDayStr);
      
      return (
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4 shadow-sm max-w-lg mx-auto">
          <div className="pb-3 border-b border-gray-150 dark:border-gray-800 text-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
          </div>

          <div className="space-y-3">
            {dayEvents.length > 0 ? (
              dayEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center gap-4 transition-transform hover:translate-x-1 ${getEventColor(evt.type)}`}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm truncate">{evt.title}</h4>
                    <p className="text-xs mt-1 text-gray-500">{evt.vehicle}</p>
                    <p className="text-[10px] mt-1 italic text-gray-500">{evt.desc}</p>
                  </div>
                  <Badge variant={evt.type === "available" ? "success" : evt.type === "booked" ? "info" : "error"} className="capitalize">
                    {evt.type}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-gray-400 italic">
                No fleet events booked for this day.
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Event Details Modal popup */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setSelectedEvent(null)}>
          <div className="relative bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-up space-y-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg border ${getEventColor(selectedEvent.type)}`}>
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-md font-bold text-gray-900 dark:text-white capitalize">
                {selectedEvent.title}
              </h3>
            </div>
            
            <div className="space-y-2.5 text-sm text-gray-650 dark:text-gray-300 border-y border-gray-100 dark:border-gray-800 py-4">
              <p><strong>Vehicle:</strong> {selectedEvent.vehicle}</p>
              <p><strong>Driver:</strong> {selectedEvent.driver}</p>
              <p><strong>Time Slot:</strong> {selectedEvent.timeSlot}</p>
              <p><strong>Description:</strong> {selectedEvent.desc}</p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vehicle Availability</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Display, sort and filter all booked vehicles on the fleet scheduler calendar.
          </p>
        </div>
        
        {/* Toggle Scheduler Views */}
        <div className="flex border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden self-start sm:self-auto bg-white dark:bg-gray-950">
          {["month", "week", "day"].map((vName) => (
            <button
              key={vName}
              onClick={() => setView(vName)}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                view === vName
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850"
              }`}
            >
              {vName}
            </button>
          ))}
        </div>
      </div>

      {/* Filters and Navigation */}
      <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Navigation Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-2 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-md font-bold text-gray-800 dark:text-white min-w-32 text-center">
            {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Legend indicator */}
          <div className="flex items-center gap-3 text-xs pr-4 border-r border-gray-250 dark:border-gray-800">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-green-500"></span> Available</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Booked</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500"></span> Maintenance</span>
          </div>

          {/* Filter by Time slot */}
          <div className="flex items-center gap-1.5 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent">
            <Clock className="w-4 h-4 text-gray-400" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="text-xs bg-transparent focus:outline-none border-none text-gray-700 dark:text-gray-300 font-semibold"
            >
              <option value="all">All Times</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </div>
        </div>
      </div>

      {/* Weekday headers for Month/Week Views */}
      {(view === "month" || view === "week") && (
        <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50/75 dark:bg-gray-900/50 py-3 rounded-lg border border-gray-150 dark:border-gray-800">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>
      )}

      {/* Render Dynamic Calendar View Grid */}
      <div className="transition-all duration-300">{renderCalendar()}</div>
    </div>
  );
};

export default VehicleAvailability;
export { VehicleAvailability };
