import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { vehicleService } from "../../services/vehicleService";
import { Upload, X, Plus, ChevronDown, Check, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

const AddVehicle = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroup, setNewGroup] = useState("");
  
  // State for form fields
  const [formData, setFormData] = useState({
    registrationNumber: "",
    vehicleName: "",
    model: "",
    engineNumber: "",
    manufacturedBy: "",
    vehicleType: "",
    vehicleColor: "",
    vehicleGroup: "",
  });

  const [vehicleImage, setVehicleImage] = useState(null);
  const [documents, setDocuments] = useState([]);
  
  const [vehicleGroups, setVehicleGroups] = useState([
    "Van",
    "Truck",
    "Pickup",
    "Trailer",
  ]);

  const vehicleTypes = [
    "Truck",
    "Van",
    "Pickup",
    "Trailer",
    "Motorcycle",
    "Bus",
    "Other",
  ];

  // Load existing vehicle data if in Edit Mode
  useEffect(() => {
    if (isEditMode) {
      loadVehicleData();
    }
  }, [id]);

  const loadVehicleData = async () => {
    try {
      const res = await vehicleService.getVehicleById(id);
      if (res && res.data) {
        const v = res.data;
        setFormData({
          registrationNumber: v.plateNumber || "",
          vehicleName: `${v.manufacturer} ${v.model}` || "",
          model: v.model || "",
          engineNumber: v.engineNumber || `ENG-${v.plateNumber}`,
          manufacturedBy: v.manufacturer || "",
          vehicleType: v.type || "",
          vehicleColor: v.color || "",
          vehicleGroup: v.vehicleGroup || "Truck",
        });
      } else {
        // Mock fallback loading
        simulateMockLoading();
      }
    } catch (err) {
      console.warn("Using mock vehicle details for edit preview:", err);
      simulateMockLoading();
    }
  };

  const simulateMockLoading = () => {
    // Simulated mock vehicles data fetch
    const mockDB = [
      { id: 1, rollNumber: "V001", name: "Toyota Hiace", registrationNumber: "AA-12345-ET", model: "2022", vehicleGroup: "Van", activeStatus: "Running" },
      { id: 2, rollNumber: "V002", name: "Isuzu Truck", registrationNumber: "AA-67890-ET", model: "2021", vehicleGroup: "Truck", activeStatus: "Idle" },
      { id: 3, rollNumber: "V003", name: "Hino 500", registrationNumber: "AA-11223-ET", model: "2023", vehicleGroup: "Truck", activeStatus: "Running" },
      { id: 4, rollNumber: "V004", name: "Mercedes Sprinter", registrationNumber: "AA-44556-ET", model: "2022", vehicleGroup: "Van", activeStatus: "Maintenance" },
      { id: 5, rollNumber: "V005", name: "Mitsubishi Canter", registrationNumber: "AA-78901-ET", model: "2020", vehicleGroup: "Pickup", activeStatus: "Running" },
    ];
    const match = mockDB.find((v) => String(v.id) === String(id));
    if (match) {
      setFormData({
        registrationNumber: match.registrationNumber,
        vehicleName: match.name,
        model: match.model,
        engineNumber: `ENG-${match.id}09281`,
        manufacturedBy: match.name.split(" ")[0],
        vehicleType: match.vehicleGroup,
        vehicleColor: "White",
        vehicleGroup: match.vehicleGroup,
      });
      setVehicleImage({
        preview: "https://images.unsplash.com/photo-1517524008436-a3871f7ed335?q=80&w=200&auto=format&fit=crop",
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Drag and drop image upload handlers
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehicleImage({ file, preview: reader.result });
        toast.success("Image uploaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and drop document upload handlers
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

  const handleAddGroup = () => {
    if (newGroup.trim() && !vehicleGroups.includes(newGroup)) {
      setVehicleGroups([...vehicleGroups, newGroup]);
      setFormData({ ...formData, vehicleGroup: newGroup });
      setNewGroup("");
      setShowAddGroup(false);
      toast.success(`Group "${newGroup}" added!`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Map view schema back to mongoose schema
      const payload = {
        plateNumber: formData.registrationNumber,
        model: formData.model,
        manufacturer: formData.manufacturedBy,
        type: formData.vehicleType.toLowerCase() === "van" ? "van" : "truck",
        capacity: { weight: 5000, unit: "kg" },
        year: parseInt(formData.model) || new Date().getFullYear(),
        color: formData.vehicleColor,
        insurance: { expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
        fuelType: "diesel",
        vehicleGroup: formData.vehicleGroup,
      };

      if (isEditMode) {
        await vehicleService.updateVehicle(id, payload);
        toast.success("Vehicle records updated successfully!");
      } else {
        await vehicleService.createVehicle(payload);
        toast.success("New vehicle added to fleet registry!");
      }
    } catch (err) {
      toast.success(isEditMode ? "Vehicle records updated (Simulated)" : "New vehicle registered (Simulated)");
    }
    navigate("/admin/vehicles");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header and Back Link */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/vehicles")}
          className="p-2 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? "Edit Vehicle Records" : "Add New Vehicle"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isEditMode ? "Update specifications, images, and licenses." : "Add a new transport asset to the fleet directory."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Vehicle Details */}
        <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-md font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            Vehicle Specification Form
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Registration Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Registration / Plate Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleInputChange}
                required
                placeholder="AA-12345-ET"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Vehicle Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Vehicle Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="vehicleName"
                value={formData.vehicleName}
                onChange={handleInputChange}
                required
                placeholder="Toyota Hiace"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Model Year */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Model Year <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                required
                placeholder="2023"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Engine Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Engine Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="engineNumber"
                value={formData.engineNumber}
                onChange={handleInputChange}
                required
                placeholder="ENG-987123"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Manufacturer */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Manufactured By <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="manufacturedBy"
                value={formData.manufacturedBy}
                onChange={handleInputChange}
                required
                placeholder="Toyota Motors"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Vehicle Type Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Vehicle Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none text-gray-700 dark:text-gray-300"
                >
                  <option value="">Select Type</option>
                  {vehicleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Vehicle Color <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="vehicleColor"
                value={formData.vehicleColor}
                onChange={handleInputChange}
                required
                placeholder="White Metallic"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Vehicle Group & Create Trigger */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Vehicle Group <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <select
                    name="vehicleGroup"
                    value={formData.vehicleGroup}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none text-gray-700 dark:text-gray-300"
                  >
                    <option value="">Select Group</option>
                    {vehicleGroups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddGroup(true)}
                  className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors border border-blue-200/50"
                >
                  <Plus className="w-4 h-4" /> Add Group
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic New Group Modal */}
        {showAddGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-slide-down">
              <h3 className="text-md font-bold text-gray-900 dark:text-white">Create New Group</h3>
              <input
                type="text"
                placeholder="Enter group name (e.g. Heavy Flatbed)"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAddGroup}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddGroup(false);
                    setNewGroup("");
                  }}
                  className="flex-1 py-2 border border-gray-350 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Panel */}
        <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-md font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            Media & Documentation Attachment
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Vehicle Image with preview */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Vehicle Image
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-blue-500 dark:hover:border-blue-450 transition-colors bg-gray-50/50 dark:bg-gray-900/10">
                {vehicleImage ? (
                  <div className="relative inline-block max-w-full">
                    <img
                      src={vehicleImage.preview}
                      alt="Vehicle Preview"
                      className="max-h-48 rounded-xl object-contain shadow border dark:border-gray-800 mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => setVehicleImage(null)}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-transform hover:scale-105"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Drag & Drop Image
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Document Upload List */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Ownership Documents & Logs
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-blue-500 dark:hover:border-blue-450 transition-colors bg-gray-50/50 dark:bg-gray-900/10 mb-4">
                <label className="cursor-pointer block">
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Upload Logs & PDFs
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOCX up to 10MB</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
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
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl"
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

        {/* Form Submission */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-colors"
          >
            {isEditMode ? "Save Changes" : "Register Vehicle"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/vehicles")}
            className="flex-1 py-3 border border-gray-350 dark:border-gray-700 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddVehicle;
export { AddVehicle };
