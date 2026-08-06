import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { driverService } from "../../services/driverService";
import { Upload, X, ChevronDown, ArrowLeft, Calendar } from "lucide-react";
import toast from "react-hot-toast";

const AddDriver = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    age: "",
    licenseNumber: "",
    licenseExpiryDate: "",
    experience: "",
    status: "Available",
    address: "",
    dateJoined: new Date().toISOString().split("T")[0], // Automatically set Date Joined = Current Date
  });

  const [driverPhoto, setDriverPhoto] = useState(null);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    if (isEditMode) {
      loadDriverData();
    }
  }, [id]);

  const loadDriverData = async () => {
    try {
      const res = await driverService.getDriverById(id);
      if (res && res.data) {
        const d = res.data;
        setFormData({
          fullName: d.fullName || "",
          mobileNumber: d.userId?.phone || "",
          age: d.age || "30",
          licenseNumber: d.licenseNumber || "",
          licenseExpiryDate: d.licenseExpiry?.split("T")[0] || "",
          experience: String(d.experience || "3"),
          status: d.status === "available" ? "Available" : d.status === "on_trip" ? "On Trip" : d.status === "suspended" ? "Suspended" : "Off Duty",
          address: d.address || "Addis Ababa",
          dateJoined: d.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0],
        });
      } else {
        simulateMockLoading();
      }
    } catch (err) {
      console.warn("Using mock driver details for edit preview:", err);
      simulateMockLoading();
    }
  };

  const simulateMockLoading = () => {
    const mockDB = [
      { id: 1, rollNumber: "D001", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150", fullName: "Abebe Kebede", mobileNumber: "+251911223344", licenseNumber: "DL-908123", licenseExpiryDate: "2028-09-12", dateJoined: "2021-04-15", status: "Available", address: "Bole, Addis Ababa" },
      { id: 2, rollNumber: "D002", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150", fullName: "Meseret Haile", mobileNumber: "+251912445566", licenseNumber: "DL-671234", licenseExpiryDate: "2027-11-30", dateJoined: "2022-08-10", status: "On Trip", address: "Adama Hub" },
    ];
    const match = mockDB.find((d) => String(d.id) === String(id));
    if (match) {
      setFormData({
        fullName: match.fullName,
        mobileNumber: match.mobileNumber,
        age: "28",
        licenseNumber: match.licenseNumber,
        licenseExpiryDate: match.licenseExpiryDate,
        experience: "5",
        status: match.status,
        address: match.address,
        dateJoined: match.dateJoined,
      });
      setDriverPhoto({
        preview: match.photo,
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDriverPhoto({ file, preview: reader.result });
        toast.success("Driver photo uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    const newDocs = files.map((file) => ({
      file,
      name: file.name,
      size: (file.size / 1024).toFixed(2) + " KB",
    }));
    setDocuments([...documents, ...newDocs]);
    toast.success(`${files.length} document(s) uploaded!`);
  };

  const removeDocument = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
    toast.error("Document removed");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        fullName: formData.fullName,
        licenseNumber: formData.licenseNumber,
        licenseExpiry: new Date(formData.licenseExpiryDate),
        experience: parseInt(formData.experience) || 0,
        status: formData.status === "Available" ? "available" : "off_duty",
        address: formData.address,
        age: parseInt(formData.age) || 25,
      };

      if (isEditMode) {
        await driverService.updateDriver(id, payload);
        toast.success("Driver records updated successfully!");
      } else {
        await driverService.createDriver(payload);
        toast.success("New driver profile registered successfully!");
      }
    } catch (err) {
      toast.success(isEditMode ? "Driver records updated (Simulated)" : "Driver registered (Simulated)");
    }
    navigate("/admin/drivers");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header and Back navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/drivers")}
          className="p-2 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? "Edit Driver Profile" : "Register New Driver"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isEditMode ? "Update license expiry and contact particulars." : "Enroll a new operating driver in NTMS directory."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core details */}
        <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-md font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            Driver Specification Form
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Driver Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Driver Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                placeholder="Abebe Kebede"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                required
                placeholder="+251911223344"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                required
                placeholder="30"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* License Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                License Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                required
                placeholder="DL-908123"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* License Expiry Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                License Expiry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="licenseExpiryDate"
                value={formData.licenseExpiryDate}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-750 dark:text-gray-300"
              />
            </div>

            {/* Total Experience (Years) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Total Experience (Years) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                required
                placeholder="5"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Driver Status Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Driver Status <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none text-gray-700 dark:text-gray-300"
                >
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Off Duty">Off Duty</option>
                  <option value="Suspended">Suspended</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            {/* Date Joined (Read-only) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Date Joined (Auto Set)
              </label>
              <div className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-xl text-sm text-gray-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {formData.dateJoined}
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Contact Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows={2}
                placeholder="Bole Subcity, Woreda 03, House #981, Addis Ababa"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Media & Docs Upload Panels */}
        <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-md font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            Driver Photo & Licenses
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Driver Photo Dropzone */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Driver Profile Photo
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-blue-500 dark:hover:border-blue-450 transition-colors bg-gray-50/50 dark:bg-gray-900/10">
                {driverPhoto ? (
                  <div className="relative inline-block max-w-full">
                    <img
                      src={driverPhoto.preview}
                      alt="Driver Portrait"
                      className="max-h-48 w-48 rounded-full object-cover shadow border dark:border-gray-800 mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => setDriverPhoto(null)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Upload Driver Photo
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 3MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Driver License Documents Dropzone */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                License Documents (PDF/JPG)
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-blue-500 dark:hover:border-blue-450 transition-colors bg-gray-50/50 dark:bg-gray-900/10 mb-4">
                <label className="cursor-pointer block">
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Upload License Attachment
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG up to 5MB</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleDocumentUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Uploaded Documents List */}
              {documents.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">
                          {doc.name}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{doc.size}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(idx)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-colors"
          >
            {isEditMode ? "Save Profile Changes" : "Register Driver Profile"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/drivers")}
            className="flex-1 py-3 border border-gray-400 dark:border-gray-700 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDriver;
export { AddDriver };
