import React, { useState, useContext, useEffect } from "react";
import { User, Mail, Phone, Award, Lock, Save, FileText } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    experience: 0,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch full driver profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/drivers/profile/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data && response.data.success && response.data.data) {
          const driver = response.data.data;
          setProfileData({
            name: driver.userId?.name || "",
            email: driver.userId?.email || "",
            phone: driver.userId?.phone || "",
            licenseNumber: driver.licenseNumber || "",
            experience: driver.experience || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch driver profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/drivers/profile/me`,
        {
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          licenseNumber: profileData.licenseNumber,
          experience: Number(profileData.experience),
          fullName: profileData.name, // backend maps both fullName and name
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data && response.data.success) {
        const updated = response.data.data;
        setUser({
          ...user,
          name: updated.userId?.name || updated.name,
          email: updated.userId?.email || updated.email,
          phone: updated.userId?.phone || updated.phone,
        });
        toast.success("Driver profile updated successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/auth/update-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Password updated successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-1">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Driver Profile Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your personal driver profile, license credentials, and account password.
        </p>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all duration-200 ${
            activeTab === "profile"
              ? "border-blue-600 text-blue-600 dark:text-blue-500 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <User className="w-4 h-4" />
          Driver Details
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all duration-200 ${
            activeTab === "password"
              ? "border-blue-600 text-blue-600 dark:text-blue-500 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Lock className="w-4 h-4" />
          Change Password
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        {activeTab === "profile" && (
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-gray-400" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-350 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 dark:text-white"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-gray-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-350 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 dark:text-white"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-gray-400" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-350 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 dark:text-white"
                />
              </div>

              {/* License Number */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Driver License Number
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={profileData.licenseNumber}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-350 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 dark:text-white"
                />
              </div>

              {/* Experience Years */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-gray-400" />
                  Years of Experience
                </label>
                <input
                  type="number"
                  name="experience"
                  value={profileData.experience}
                  onChange={handleProfileChange}
                  required
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-350 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {activeTab === "password" && (
          <form onSubmit={handlePasswordUpdate} className="space-y-6">
            <div className="space-y-4 max-w-md">
              {/* Current Password */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-350 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 dark:text-white"
                />
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-350 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 dark:text-white"
                />
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-350 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
