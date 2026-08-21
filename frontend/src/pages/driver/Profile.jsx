import React, { useState, useContext, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Award,
  Lock,
  Save,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Camera,
  Trash2,
  Eye,
  Calendar,
  Truck,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import api from "../../services/api";

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [assignedVehicle, setAssignedVehicle] = useState(null);

  const fileInputRef = useRef(null);
  const cnicInputRef = useRef(null);
  const medicalInputRef = useRef(null);
  const licenseInputRef = useRef(null);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    licenseExpiry: "",
    experience: 0,
    profileImage: "",
    licenseImage: "",
    cnic: "",
    medicalCertificate: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch full driver profile and assigned vehicles on mount
  const fetchProfile = async () => {
    try {
      const response = await api.get("/drivers/profile/me");
      if (response.data && response.data.success && response.data.data) {
        const driver = response.data.data;
        setProfileData({
          name: driver.userId?.name || "",
          email: driver.userId?.email || "",
          phone: driver.userId?.phone || "",
          licenseNumber: driver.licenseNumber || "",
          licenseExpiry: driver.licenseExpiry
            ? driver.licenseExpiry.split("T")[0]
            : "",
          experience: driver.experience || 0,
          profileImage: driver.userId?.profileImage || "",
          licenseImage: driver.licenseImage || "",
          cnic: driver.documents?.cnic || "",
          medicalCertificate: driver.documents?.medicalCertificate || "",
        });
      }

      // Fetch driver registered vehicle
      const vehicleRes = await api.get("/vehicles");
      if (vehicleRes.data && vehicleRes.data.success && vehicleRes.data.data) {
        const myVehicles = vehicleRes.data.data;
        const activeVeh =
          myVehicles.find((v) => v.approvalStatus === "approved") ||
          myVehicles[0];
        setAssignedVehicle(activeVeh || null);
      }
    } catch (error) {
      console.error("Failed to fetch driver profile:", error);
      toast.error("Failed to fetch profile credentials");
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

  // Convert files to base64 Data URLs
  const handleFileChange = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return toast.error("File size cannot exceed 2MB");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prev) => ({ ...prev, [field]: reader.result }));
        toast.success("Document attached! Click Save Changes to apply.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put(
        "/drivers/profile/me",
        {
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          licenseNumber: profileData.licenseNumber,
          licenseExpiry: profileData.licenseExpiry || undefined,
          experience: Number(profileData.experience),
          fullName: profileData.name,
          profileImage: profileData.profileImage,
          licenseImage: profileData.licenseImage,
          documents: {
            cnic: profileData.cnic || undefined,
            medicalCertificate: profileData.medicalCertificate || undefined,
          },
        },
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
        toast.success("Driver profile saved successfully!");
        fetchProfile();
      }
    } catch (error) {
      console.error(error);
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
      await api.put("/auth/update-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("Password updated successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-1 min-h-screen bg-slate-50 dark:bg-gray-900 transition-colors duration-300">
      <Toaster position="top-right" />

      {/* Header Banner */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 transition-colors duration-300">
        <div
          className="relative group cursor-pointer"
          onClick={() => fileInputRef.current.click()}
        >
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-green-700 bg-slate-50 flex items-center justify-center shadow">
            {profileData.profileImage ? (
              <img
                src={profileData.profileImage}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-slate-400" />
            )}
          </div>
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileChange("profileImage", e)}
            className="hidden"
            accept="image/*"
          />
        </div>

        <div className="text-center md:text-left space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {profileData.name || "Driver Name"}
          </h1>
          <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">
            Registered Driver
          </p>
          <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold">
            Manage credentials, license metadata, and upload CNIC and Medical
            papers.
          </p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b dark:border-gray-700 gap-1 overflow-x-auto">
        {[
          {
            id: "profile",
            label: "Driver Details",
            icon: <User className="w-4 h-4" />,
          },
          {
            id: "documents",
            label: "Documents Hub",
            icon: <FileText className="w-4 h-4" />,
          },
          {
            id: "password",
            label: "Change Password",
            icon: <Lock className="w-4 h-4" />,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id
                ? "border-green-700 dark:border-green-400 text-green-700 dark:text-green-400 font-extrabold"
                : "border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab contents */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
        {activeTab === "profile" && (
          <div className="space-y-6">
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    <User className="w-4 h-4 text-green-700 dark:text-green-400" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-700/20 dark:focus:ring-green-500/20 focus:border-green-700 dark:focus:border-green-500 focus:outline-none transition text-slate-800 dark:text-white"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-green-700 dark:text-green-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-700/20 dark:focus:ring-green-500/20 focus:border-green-700 dark:focus:border-green-500 focus:outline-none transition text-slate-800 dark:text-white"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-green-700 dark:text-green-400" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-700/20 dark:focus:ring-green-500/20 focus:border-green-700 dark:focus:border-green-500 focus:outline-none transition text-slate-800 dark:text-white"
                  />
                </div>

                {/* License Number */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-green-700 dark:text-green-400" />
                    Driver License Number
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={profileData.licenseNumber}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-700/20 dark:focus:ring-green-500/20 focus:border-green-700 dark:focus:border-green-500 focus:outline-none transition text-slate-800 dark:text-white"
                  />
                </div>

                {/* License Expiry Date */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-green-700" />
                    License Expiry Date
                  </label>
                  <input
                    type="date"
                    name="licenseExpiry"
                    value={profileData.licenseExpiry}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-4 py-3 border border-slate-250 rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-green-700/20 focus:border-green-700 focus:outline-none transition text-slate-800"
                  />
                </div>

                {/* Experience Years */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-green-700" />
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={profileData.experience}
                    onChange={handleProfileChange}
                    required
                    min="0"
                    className="w-full px-4 py-3 border border-slate-250 rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-green-700/20 focus:border-green-700 focus:outline-none transition text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition text-xs shadow-md disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Saving Changes..." : "Save Profile Details"}
                </button>
              </div>
            </form>

            {/* Vehicle Information Row (If Applicable) as requested */}
            {assignedVehicle && (
              <div className="pt-6 border-t space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Registered Vehicle specs
                </h3>
                <div className="bg-slate-50 border p-5 rounded-2xl flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="p-4 bg-green-50 text-green-700 border rounded-2xl shrink-0">
                    <Truck className="w-8 h-8" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 text-xs">
                    <div>
                      <p className="font-bold text-slate-400">
                        Manufacturer & Model
                      </p>
                      <p className="font-semibold text-slate-800 mt-1">
                        {assignedVehicle.manufacturer} {assignedVehicle.model}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-400">Plate Number</p>
                      <p className="font-semibold text-slate-800 mt-1">
                        {assignedVehicle.plateNumber}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-400">Cargo Type</p>
                      <p className="font-semibold text-slate-800 mt-1 capitalize">
                        {assignedVehicle.type}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-400">
                        Approval Status
                      </p>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-1 capitalize ${
                          assignedVehicle.approvalStatus === "approved"
                            ? "bg-green-105 text-green-800 border-green-200"
                            : "bg-yellow-105 text-yellow-800 border-yellow-200"
                        }`}
                      >
                        {assignedVehicle.approvalStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "documents" && (
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* License Document */}
              <div className="border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-4">
                <div className="w-full h-32 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-dashed">
                  {profileData.licenseImage ? (
                    <img
                      src={profileData.licenseImage}
                      alt="License"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <FileText className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-500">
                        License Document
                      </span>
                    </div>
                  )}
                </div>
                <div className="w-full space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">
                    Driver License Photo
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Required for verification of driving credentials.
                  </p>
                  <button
                    type="button"
                    onClick={() => licenseInputRef.current.click()}
                    className="w-full py-2 bg-slate-105 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-green-700" /> Attach
                    Photo
                  </button>
                  <input
                    type="file"
                    ref={licenseInputRef}
                    onChange={(e) => handleFileChange("licenseImage", e)}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              </div>

              {/* CNIC Card */}
              <div className="border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-4">
                <div className="w-full h-32 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-dashed">
                  {profileData.cnic ? (
                    <img
                      src={profileData.cnic}
                      alt="CNIC"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <FileText className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-500">
                        CNIC Identity Document
                      </span>
                    </div>
                  )}
                </div>
                <div className="w-full space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">
                    National ID / CNIC
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Required for official identity registration.
                  </p>
                  <button
                    type="button"
                    onClick={() => cnicInputRef.current.click()}
                    className="w-full py-2 bg-slate-105 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-green-700" /> Attach
                    CNIC
                  </button>
                  <input
                    type="file"
                    ref={cnicInputRef}
                    onChange={(e) => handleFileChange("cnic", e)}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              </div>

              {/* Medical Certificate */}
              <div className="border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-4">
                <div className="w-full h-32 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-dashed">
                  {profileData.medicalCertificate ? (
                    <img
                      src={profileData.medicalCertificate}
                      alt="Medical Certificate"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <FileText className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-500">
                        Medical Certificate
                      </span>
                    </div>
                  )}
                </div>
                <div className="w-full space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">
                    Medical Fitness Certificate
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Required to prove physical and health capability.
                  </p>
                  <button
                    type="button"
                    onClick={() => medicalInputRef.current.click()}
                    className="w-full py-2 bg-slate-105 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-green-700" /> Attach
                    Document
                  </button>
                  <input
                    type="file"
                    ref={medicalInputRef}
                    onChange={(e) => handleFileChange("medicalCertificate", e)}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition text-xs shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? "Saving Documents..." : "Save Uploaded Documents"}
              </button>
            </div>
          </form>
        )}

        {activeTab === "password" && (
          <form onSubmit={handlePasswordUpdate} className="space-y-6">
            <div className="space-y-4 max-w-md">
              {/* Current Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-4 py-3 border border-slate-250 rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-green-700/20 focus:border-green-700 focus:outline-none transition text-slate-800"
                />
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-4 py-3 border border-slate-250 rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-green-700/20 focus:border-green-700 focus:outline-none transition text-slate-800"
                />
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-4 py-3 border border-slate-250 rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-green-700/20 focus:border-green-700 focus:outline-none transition text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition text-xs shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? "Updating..." : "Update Security Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
export { Profile };
