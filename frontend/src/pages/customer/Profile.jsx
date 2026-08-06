import React, { useState, useContext, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Lock, Save } from "lucide-react";
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
    address: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch full customer profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/customers/profile/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data && response.data.success && response.data.data) {
          const customer = response.data.data;
          setProfileData({
            name: customer.userId?.name || "",
            email: customer.userId?.email || "",
            phone: customer.userId?.phone || "",
            address: customer.address?.street || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch customer profile:", error);
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
        `${import.meta.env.VITE_API_URL}/customers/profile/me`,
        {
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          address: {
            street: profileData.address,
          },
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
          address: updated.address?.street || "",
        });
        toast.success("Profile updated successfully");
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-600 mt-1">Manage your account settings</p>
      </div>

      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-8 text-white">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
            <User className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user?.name || "User"}</h2>
            <p className="text-amber-100 mt-1">{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
              {user?.role || "Customer"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-6 py-3 font-medium transition ${
            activeTab === "profile"
              ? "text-amber-600 border-b-2 border-amber-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Profile Information
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`px-6 py-3 font-medium transition ${
            activeTab === "password"
              ? "text-amber-600 border-b-2 border-amber-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Change Password
        </button>
      </div>

      {activeTab === "profile" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-8 shadow-sm border border-slate-200"
        >
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </motion.div>
      )}

      {activeTab === "password" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-8 shadow-sm border border-slate-200"
        >
          <form onSubmit={handlePasswordUpdate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-5 h-5" />
              {loading ? "Updating..." : "Change Password"}
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default Profile;
