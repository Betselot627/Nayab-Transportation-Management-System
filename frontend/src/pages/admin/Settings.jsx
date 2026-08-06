import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import {
  User,
  Lock,
  Eye,
  Bell,
  Languages,
  Sun,
  Moon,
  Upload,
  X,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const Settings = () => {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'security' | 'appearance' | 'notifications'
  
  // Theme state loaded from local storage
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("ntms_theme");
    return saved === "dark" || document.documentElement.classList.contains("dark");
  });

  // Profile fields state
  const [profile, setProfile] = useState({
    name: user?.name || "Admin User",
    email: user?.email || "admin@ntms.com",
    phone: user?.phone || "+251911223344",
  });

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const [profilePic, setProfilePic] = useState({
    preview: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150",
  });

  // Password fields state
  const [security, setSecurity] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notifications checkboxes state
  const [notifs, setNotifs] = useState({
    emailLicenseExpiry: true,
    emailMaintenanceDue: true,
    emailBookingChange: true,
    pushBookingChange: true,
    pushVehicleReturned: false,
  });

  // Language settings state
  const [language, setLanguage] = useState("en"); // 'en' | 'am'

  // Effect to handle Document class dark styling
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("ntms_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("ntms_theme", "light");
    }
  }, [isDark]);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSecurityChange = (e) => {
    setSecurity({ ...security, [e.target.name]: e.target.value });
  };

  const handleNotifChange = (e) => {
    setNotifs({ ...notifs, [e.target.name]: e.target.checked });
  };

  const handlePicUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic({ file, preview: reader.result });
        toast.success("Profile photo updated!");
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/users/${user._id}`,
        {
          name: profile.name,
          phone: profile.phone,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data && response.data.success) {
        setUser({
          ...user,
          name: profile.name,
          phone: profile.phone,
        });
        toast.success("Profile information updated successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (security.newPassword !== security.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/auth/update-password`,
        {
          currentPassword: security.oldPassword,
          newPassword: security.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Security password changed successfully!");
      setSecurity({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    }
  };

  const savePreferences = () => {
    toast.success("System preferences updated successfully!");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage system configurations, notifications, profile picture, and app theme preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar Tabs */}
        <div className="md:col-span-1 flex flex-row md:flex-col gap-1 border-b md:border-b-0 md:border-r border-gray-150 dark:border-gray-800 pb-4 md:pb-0 md:pr-4 overflow-x-auto whitespace-nowrap scrollbar-none select-none">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2.5 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              activeTab === "profile"
                ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:bg-gray-105 dark:hover:bg-gray-850 hover:text-gray-700"
            }`}
          >
            <User className="w-4 h-4" /> Profile Info
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2.5 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              activeTab === "security"
                ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:bg-gray-105 dark:hover:bg-gray-850 hover:text-gray-700"
            }`}
          >
            <Lock className="w-4 h-4" /> Password Change
          </button>
          <button
            onClick={() => setActiveTab("appearance")}
            className={`flex items-center gap-2.5 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              activeTab === "appearance"
                ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:bg-gray-105 dark:hover:bg-gray-850 hover:text-gray-700"
            }`}
          >
            <Sun className="w-4 h-4" /> Theme & Lang
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-2.5 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              activeTab === "notifications"
                ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:bg-gray-105 dark:hover:bg-gray-850 hover:text-gray-700"
            }`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>
        </div>

        {/* Tab Canvas panels */}
        <div className="md:col-span-3 bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm min-h-96">
          
          {/* TAB 1: Profile */}
          {activeTab === "profile" && (
            <form onSubmit={saveProfile} className="space-y-6">
              <h2 className="text-md font-bold text-gray-850 dark:text-white border-b border-gray-100 dark:border-gray-850 pb-3">
                Update Profile details
              </h2>

              <div className="flex flex-col sm:flex-row items-center gap-6 pb-4">
                {/* Photo upload and preview */}
                <div className="relative">
                  <img
                    src={profilePic.preview}
                    alt="Profile preview"
                    className="w-24 h-24 rounded-full object-cover shadow border dark:border-gray-800"
                  />
                  {profilePic.file && (
                    <button
                      type="button"
                      onClick={() => setProfilePic({ preview: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150" })}
                      className="absolute -top-1 -right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="text-center sm:text-left space-y-2">
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-bold cursor-pointer border border-blue-200/50">
                    <Upload className="w-4 h-4" /> Change Profile Pic
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePicUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-gray-400">JPG or PNG up to 2MB. Recommendation: 250x250px square portrait.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-450 dark:text-gray-400 uppercase tracking-wider mb-2">Display Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-450 dark:text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-450 dark:text-gray-400 uppercase tracking-wider mb-2">Mobile Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
              >
                Save Details
              </button>
            </form>
          )}

          {/* TAB 2: Password security */}
          {activeTab === "security" && (
            <form onSubmit={updatePassword} className="space-y-6">
              <h2 className="text-md font-bold text-gray-850 dark:text-white border-b border-gray-100 dark:border-gray-850 pb-3">
                Change Password
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-450 dark:text-gray-400 uppercase tracking-wider mb-2">Current Password</label>
                  <input
                    type="password"
                    name="oldPassword"
                    value={security.oldPassword}
                    onChange={handleSecurityChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-450 dark:text-gray-400 uppercase tracking-wider mb-2">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={security.newPassword}
                    onChange={handleSecurityChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-450 dark:text-gray-400 uppercase tracking-wider mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={security.confirmPassword}
                    onChange={handleSecurityChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
              >
                Change Password
              </button>
            </form>
          )}

          {/* TAB 3: Theme and Language Appearance */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <h2 className="text-md font-bold text-gray-850 dark:text-white border-b border-gray-100 dark:border-gray-850 pb-3">
                Theme and Language
              </h2>

              <div className="space-y-6">
                {/* Theme toggle */}
                <div className="flex justify-between items-center py-4 border-b border-gray-100 dark:border-gray-850">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-850 dark:text-white">Dark Mode Theme</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Toggle system color styles.</p>
                  </div>
                  <button
                    onClick={() => setIsDark(!isDark)}
                    className="p-3 border border-gray-300 dark:border-gray-700 rounded-2xl hover:bg-gray-55 dark:hover:bg-gray-850 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </button>
                </div>

                {/* Language Select */}
                <div className="flex justify-between items-center py-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-850 dark:text-white">Language Settings</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Update displayed text language.</p>
                  </div>
                  <div className="relative w-44">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none text-gray-700 dark:text-gray-300"
                    >
                      <option value="en">English (US)</option>
                      <option value="am">Amharic (አማርኛ)</option>
                    </select>
                    <Languages className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                onClick={savePreferences}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl mt-6"
              >
                Save Preferences
              </button>
            </div>
          )}

          {/* TAB 4: Notification Settings */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-md font-bold text-gray-850 dark:text-white border-b border-gray-100 dark:border-gray-850 pb-3">
                Notification Alerts
              </h2>

              <div className="space-y-4">
                {/* Driver License Expiry */}
                <label className="flex items-start gap-3 py-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="emailLicenseExpiry"
                    checked={notifs.emailLicenseExpiry}
                    onChange={handleNotifChange}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700 rounded mt-1"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">Driver License Expiration warnings</span>
                    <p className="text-xs text-gray-400 mt-0.5">Send alerts 30 days before driver licenses expire.</p>
                  </div>
                </label>

                {/* Maintenance Alarms */}
                <label className="flex items-start gap-3 py-2 cursor-pointer select-none border-t border-gray-100 dark:border-gray-850 pt-4">
                  <input
                    type="checkbox"
                    name="emailMaintenanceDue"
                    checked={notifs.emailMaintenanceDue}
                    onChange={handleNotifChange}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700 rounded mt-1"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">Maintenance Due notifications</span>
                    <p className="text-xs text-gray-400 mt-0.5">Alert on the dashboard homepage when vehicle service is due.</p>
                  </div>
                </label>

                {/* Booking modifications */}
                <label className="flex items-start gap-3 py-2 cursor-pointer select-none border-t border-gray-100 dark:border-gray-850 pt-4">
                  <input
                    type="checkbox"
                    name="emailBookingChange"
                    checked={notifs.emailBookingChange}
                    onChange={handleNotifChange}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700 rounded mt-1"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">Booking Creation & Cancellations</span>
                    <p className="text-xs text-gray-400 mt-0.5">Send email log reports on new dispatches or route cancellations.</p>
                  </div>
                </label>
              </div>

              <button
                onClick={savePreferences}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl mt-6"
              >
                Save Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
export { Settings };
