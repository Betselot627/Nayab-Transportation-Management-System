import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { vehicleService } from "../../services/vehicleService";
import { Upload, Camera, FileText, CheckCircle, AlertCircle, Trash2, Image } from "lucide-react";
import toast from "react-hot-toast";

const RegisterVehicle = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    plateNumber: "",
    model: "",
    manufacturer: "",
    type: "truck",
    capacityWeight: "",
    capacityUnit: "ton",
    year: new Date().getFullYear(),
    color: "",
    fuelType: "diesel",
    insuranceExpiryDate: "",
    insuranceCompany: "",
    insurancePolicyNumber: "",
    registrationNumber: "",
    registrationExpiryDate: "",
    notes: "",
  });

  const [vehiclePhotos, setVehiclePhotos] = useState({
    front: "",
    back: "",
    left: "",
    right: "",
    interior: "",
  });

  const [documents, setDocuments] = useState({
    registration: "",
    insurance: "",
    inspection: "",
    other: "",
  });

  // File Inputs Refs
  const refs = {
    front: useRef(),
    back: useRef(),
    left: useRef(),
    right: useRef(),
    interior: useRef(),
    registration: useRef(),
    insurance: useRef(),
    inspection: useRef(),
    other: useRef(),
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handlePhotoUpload = (position, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return toast.error("Photo size cannot exceed 2MB");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehiclePhotos((prev) => ({ ...prev, [position]: reader.result }));
        toast.success(`${position.toUpperCase()} photo attached!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocUpload = (docType, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        return toast.error("Document size cannot exceed 3MB");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocuments((prev) => ({ ...prev, [docType]: reader.result }));
        toast.success(`${docType.toUpperCase()} document attached!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (position, e) => {
    e.stopPropagation();
    setVehiclePhotos((prev) => ({ ...prev, [position]: "" }));
    if (refs[position].current) refs[position].current.value = "";
  };

  const removeDoc = (docType, e) => {
    e.stopPropagation();
    setDocuments((prev) => ({ ...prev, [docType]: "" }));
    if (refs[docType].current) refs[docType].current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Gather photos
      const imagesArray = Object.values(vehiclePhotos).filter(Boolean);

      // Prepare data for API
      const vehicleData = {
        plateNumber: formData.plateNumber.toUpperCase(),
        model: formData.model,
        manufacturer: formData.manufacturer,
        type: formData.type,
        year: Number(formData.year),
        color: formData.color,
        capacity: {
          weight: Number(formData.capacityWeight),
          unit: formData.capacityUnit,
        },
        fuelType: formData.fuelType,
        insurance: {
          company: formData.insuranceCompany,
          policyNumber: formData.insurancePolicyNumber,
          expiryDate: formData.insuranceExpiryDate,
          document: documents.insurance || undefined,
        },
        registration: {
          number: formData.registrationNumber,
          expiryDate: formData.registrationExpiryDate,
          document: documents.registration || undefined,
        },
        inspectionDocument: documents.inspection || undefined,
        supportingDocuments: documents.other ? [documents.other] : [],
        images: imagesArray,
        notes: formData.notes,
      };

      const response = await vehicleService.registerVehicle(vehicleData);

      setSuccess(
        response.message ||
          "Vehicle registered successfully! Awaiting admin approval."
      );
      toast.success("Vehicle registered successfully!");

      // Reset form
      setTimeout(() => {
        navigate("/driver/dashboard");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register vehicle");
      toast.error(err.response?.data?.message || "Failed to register vehicle");
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1989 },
    (_, i) => currentYear - i
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Register Your Vehicle</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Submit your vehicle info, uploads, and certifications for verification and admin activation.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 font-semibold">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Basic Stats Grid */}
        <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b pb-2 border-gray-100 dark:border-gray-900">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">PLATE NUMBER *</label>
              <input
                type="text"
                name="plateNumber"
                value={formData.plateNumber}
                onChange={handleChange}
                required
                placeholder="REG-9912"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">MANUFACTURER *</label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                required
                placeholder="Toyota / Hino"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">MODEL *</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                placeholder="Dyna / Dutro"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">VEHICLE TYPE *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 dark:text-white"
              >
                <option value="truck">Truck</option>
                <option value="van">Van</option>
                <option value="pickup">Pickup</option>
                <option value="trailer">Trailer</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">YEAR *</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 dark:text-white"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">COLOR *</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                required
                placeholder="White"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">WEIGHT CAPACITY *</label>
              <input
                type="number"
                name="capacityWeight"
                value={formData.capacityWeight}
                onChange={handleChange}
                required
                min="0"
                step="0.1"
                placeholder="5"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">CAPACITY UNIT *</label>
              <select
                name="capacityUnit"
                value={formData.capacityUnit}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 dark:text-white"
              >
                <option value="ton">Tons</option>
                <option value="kg">Kilograms (kg)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">FUEL TYPE *</label>
              <select
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 dark:text-white"
              >
                <option value="diesel">Diesel</option>
                <option value="petrol">Petrol</option>
                <option value="cng">CNG</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Media (Vehicle Photos) */}
        <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vehicle Photos</h2>
            <p className="text-xs text-gray-400 mt-1">Please provide clear photos of the vehicle from the following angles.</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {["front", "back", "left", "right", "interior"].map((pos) => (
              <div 
                key={pos} 
                onClick={() => refs[pos].current.click()}
                className="relative cursor-pointer border border-gray-200 dark:border-gray-800 rounded-xl p-3 flex flex-col items-center justify-center text-center space-y-2 hover:border-green-500 transition-all bg-gray-50 dark:bg-gray-900 aspect-square group"
              >
                {vehiclePhotos[pos] ? (
                  <>
                    <img src={vehiclePhotos[pos]} alt={pos} className="w-full h-full object-cover rounded-lg" />
                    <button 
                      onClick={(e) => removePhoto(pos, e)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-700 capitalize">{pos}</span>
                  </>
                )}
                <input 
                  type="file" 
                  ref={refs[pos]} 
                  onChange={(e) => handlePhotoUpload(pos, e)} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Insurance & Registration Credentials & Documents */}
        <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b pb-2 border-gray-100 dark:border-gray-900">
            Documents & Credentials
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Registration details */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-green-500" /> Registration details
              </h3>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Registration Number</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="REG-1001"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-transparent focus:outline-none focus:border-green-500"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Registration Expiry Date</label>
                  <input
                    type="date"
                    name="registrationExpiryDate"
                    value={formData.registrationExpiryDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-transparent focus:outline-none focus:border-green-500"
                  />
                </div>

                <div 
                  onClick={() => refs.registration.current.click()}
                  className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-3 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition flex flex-col items-center justify-center space-y-1.5"
                >
                  {documents.registration ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-green-600">
                      <CheckCircle className="w-4 h-4" /> Registration Document Attached
                      <button onClick={(e) => removeDoc("registration", e)} className="ml-1 text-red-650 hover:underline">Remove</button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-[10px] text-gray-500">Upload Registration Book/Card</span>
                    </>
                  )}
                  <input type="file" ref={refs.registration} onChange={(e) => handleDocUpload("registration", e)} className="hidden" accept="image/*" />
                </div>
              </div>
            </div>

            {/* Insurance details */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-green-500" /> Insurance details
              </h3>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Insurance Company</label>
                  <input
                    type="text"
                    name="insuranceCompany"
                    value={formData.insuranceCompany}
                    onChange={handleChange}
                    placeholder="EFU / Jubilee"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-transparent focus:outline-none focus:border-green-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Policy Number</label>
                  <input
                    type="text"
                    name="insurancePolicyNumber"
                    value={formData.insurancePolicyNumber}
                    onChange={handleChange}
                    placeholder="POL-9923"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-transparent focus:outline-none focus:border-green-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Insurance Expiry Date *</label>
                  <input
                    type="date"
                    name="insuranceExpiryDate"
                    required
                    value={formData.insuranceExpiryDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-transparent focus:outline-none focus:border-green-500"
                  />
                </div>

                <div 
                  onClick={() => refs.insurance.current.click()}
                  className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-3 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition flex flex-col items-center justify-center space-y-1.5"
                >
                  {documents.insurance ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-green-600">
                      <CheckCircle className="w-4 h-4" /> Insurance Certificate Attached
                      <button onClick={(e) => removeDoc("insurance", e)} className="ml-1 text-red-650 hover:underline">Remove</button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-[10px] text-gray-500">Upload Insurance Policy PDF/Image</span>
                    </>
                  )}
                  <input type="file" ref={refs.insurance} onChange={(e) => handleDocUpload("insurance", e)} className="hidden" accept="image/*" />
                </div>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Inspection Document */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-gray-750 dark:text-gray-300">Inspection Certificate</h3>
              <div 
                onClick={() => refs.inspection.current.click()}
                className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition flex flex-col items-center justify-center space-y-2"
              >
                {documents.inspection ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-green-600">
                    <CheckCircle className="w-4 h-4" /> Certificate Attached
                    <button onClick={(e) => removeDoc("inspection", e)} className="ml-1 text-red-650 hover:underline">Remove</button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-[10px] text-gray-500">Attach Vehicle Fitness/Inspection Certificate</span>
                  </>
                )}
                <input type="file" ref={refs.inspection} onChange={(e) => handleDocUpload("inspection", e)} className="hidden" accept="image/*" />
              </div>
            </div>

            {/* Other Supporting Documents */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-gray-750 dark:text-gray-300">Supporting Documentation</h3>
              <div 
                onClick={() => refs.other.current.click()}
                className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition flex flex-col items-center justify-center space-y-2"
              >
                {documents.other ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-green-600">
                    <CheckCircle className="w-4 h-4" /> Document Attached
                    <button onClick={(e) => removeDoc("other", e)} className="ml-1 text-red-650 hover:underline">Remove</button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-[10px] text-gray-500">Attach Any Other Supporting Files</span>
                  </>
                )}
                <input type="file" ref={refs.other} onChange={(e) => handleDocUpload("other", e)} className="hidden" accept="image/*" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Additional Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Any extra comments or special equipment installed on the vehicle..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 dark:text-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? "Registering Vehicle..." : "Register Vehicle"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/driver/dashboard")}
            className="px-6 py-3.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
};

export default RegisterVehicle;
