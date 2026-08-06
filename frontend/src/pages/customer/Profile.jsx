import React, { useState, useContext, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Save,
  Camera,
  Building,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const fileInputRef = useRef(null);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    companyName: "",
    profileImage: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch customer profile
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/customers/profile/me`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data && response.data.success && response.data.data) {
        const customer = response.data.data;
        setProfileData({
          name: customer.userId?.name || "",
          email: customer.userId?.email || "",
          phone: customer.userId?.phone || "",
          address: customer.address?.street || "",
          companyName: customer.companyName || "",
          profileImage: customer.userId?.profileImage || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch customer profile:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  // Base64 file reader
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return toast.error("Photo size cannot exceed 2MB");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prev) => ({ ...prev, profileImage: reader.result }));
        toast.success("Profile photo attached! Click Save Changes to apply.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/customers/profile/me`,
        {
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          address: {
            street: profileData.address,
          },
          companyName: profileData.companyName,
          profileImage: profileData.profileImage,
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
          profileImage:
            updated.userId?.profileImage || profileData.profileImage,
        });
        toast.success("Profile details updated successfully!");
        fetchProfile();
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
      toast.error("Passwords do not match");
      return;
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
      toast.success("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      <Toaster position="top-right" />

      {/* Header Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          My Profile
        </h1>
        <p className="text-slate-600 dark:text-gray-400 mt-1">
          Manage your customer credentials, profile photo, and password.
        </p>
      </div>

      {/* Profile Header Block */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 rounded-2xl p-8 text-white shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div
          className="relative group cursor-pointer"
          onClick={() => fileInputRef.current.click()}
        >
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 bg-purple-800 flex items-center justify-center shadow">
            {profileData.profileImage ? (
              <img
                src={profileData.profileImage}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-white/80" />
            )}
          </div>
          <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            className="hidden"
            accept="image/*"
          />
        </div>

        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-2xl font-bold">{profileData.name || "User"}</h2>
          <p className="text-purple-100 text-sm font-semibold uppercase tracking-wide">
            Customer Partner
          </p>
          <span className="inline-block mt-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
            {profileData.companyName || "Personal Account"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-6 py-3 font-semibold text-sm transition ${
            activeTab === "profile"
              ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 font-extrabold"
              : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200"
          }`}
        >
          Profile Information
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`px-6 py-3 font-semibold text-sm transition ${
            activeTab === "password"
              ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 font-extrabold"
              : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200"
          }`}
        >
          Change Password
        </button>
      </div>

      {/* Profile Info Form */}
      {activeTab === "profile" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300"
        >
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
                  <User className="w-4 h-4 inline mr-2 text-slate-400 dark:text-gray-500" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 outline-none text-sm transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
                  <Mail className="w-4 h-4 inline mr-2 text-slate-400 dark:text-gray-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 outline-none text-sm transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
                  <Phone className="w-4 h-4 inline mr-2 text-slate-400 dark:text-gray-500" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 outline-none text-sm transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
                  <Building className="w-4 h-4 inline mr-2 text-slate-400 dark:text-gray-500" />
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={profileData.companyName}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 outline-none text-sm transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
                  <MapPin className="w-4 h-4 inline mr-2 text-slate-400 dark:text-gray-500" />
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 outline-none text-sm transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-xl font-semibold transition flex items-center gap-2 disabled:opacity-50 shadow-sm text-sm"
              >
                <Save className="w-4 h-4" />
                {loading ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Password Tab */}
      {activeTab === "password" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300"
        >
          <form onSubmit={handlePasswordUpdate} className="space-y-6">
            <div className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
                  <Lock className="w-4 h-4 inline mr-2 text-slate-400 dark:text-gray-500" />
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 outline-none text-sm transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
                  <Lock className="w-4 h-4 inline mr-2 text-slate-400 dark:text-gray-500" />
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 outline-none text-sm transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
                  <Lock className="w-4 h-4 inline mr-2 text-slate-400 dark:text-gray-500" />
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 outline-none text-sm transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-xl font-semibold transition flex items-center gap-2 disabled:opacity-50 shadow-sm text-sm"
              >
                <Lock className="w-4 h-4" />
                {loading ? "Updating Password..." : "Change Password"}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default Profile;
