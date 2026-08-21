import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { vehicleService } from "../../services/vehicleService";
import {
  Upload,
  Camera,
  FileText,
  CircleCheckBig as CheckCircle2,
  CircleAlert as AlertCircle,
  Trash2,
  Image,
  Truck,
  ArrowLeft,
  ShieldCheck,
  Clock,
} from "lucide-react";
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
      if (file.size > 3 * 1024 * 1024) {
        return toast.error("Photo size cannot exceed 3MB");
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
      if (file.size > 4 * 1024 * 1024) {
        return toast.error("Document size cannot exceed 4MB");
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
      const imagesArray = Object.values(vehiclePhotos).filter(Boolean);

      const vehicleData = {
        plateNumber: formData.plateNumber.toUpperCase().trim(),
        model: formData.model.trim(),
        manufacturer: formData.manufacturer.trim(),
        type: formData.type,
        year: Number(formData.year),
        color: formData.color.trim(),
        capacity: {
          weight: Number(formData.capacityWeight),
          unit: formData.capacityUnit,
        },
        fuelType: formData.fuelType,
        insurance: {
          company: formData.insuranceCompany || undefined,
          policyNumber: formData.insurancePolicyNumber || undefined,
          expiryDate: formData.insuranceExpiryDate || undefined,
          document: documents.insurance || undefined,
        },
        registration: {
          number: formData.registrationNumber || undefined,
          expiryDate: formData.registrationExpiryDate || undefined,
          document: documents.registration || undefined,
        },
        inspectionDocument: documents.inspection || undefined,
        supportingDocuments: documents.other ? [documents.other] : [],
        images: imagesArray,
        notes: formData.notes || undefined,
      };

      const response = await vehicleService.registerVehicle(vehicleData);

      setSuccess(
        response.message ||
          "Vehicle registered successfully! Submitted for Admin review."
      );
      toast.success("Vehicle registered! Awaiting Admin approval.");

      setTimeout(() => {
        navigate("/driver/my-vehicles");
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to register vehicle";
      setError(msg);
      toast.error(msg);
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
    <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Breadcrumb & Header */}
      <div className="mb-8 space-y-3">
        <button
          onClick={() => navigate("/driver/my-vehicles")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Vehicles</span>
        </button>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Register New Vehicle
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Submit your vehicle specifications, registration papers, and
              inspection certificates for Admin approval.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Workflow: Pending Admin Approval</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 px-4 py-3.5 rounded-2xl mb-6 flex items-center gap-2.5 text-xs font-medium animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 px-4 py-3.5 rounded-2xl mb-6 flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Vehicle Specs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Vehicle Specifications
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Plate Number *
              </label>
              <input
                type="text"
                name="plateNumber"
                value={formData.plateNumber}
                onChange={handleChange}
                required
                placeholder="e.g. 3-AA-12345"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white uppercase font-mono font-bold focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Manufacturer *
              </label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                required
                placeholder="e.g. Isuzu / Toyota"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Model *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                placeholder="e.g. FSR / Dyna / Hino"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Vehicle Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              >
                <option value="truck" className="dark:bg-slate-900">Truck</option>
                <option value="van" className="dark:bg-slate-900">Van</option>
                <option value="pickup" className="dark:bg-slate-900">Pickup</option>
                <option value="trailer" className="dark:bg-slate-900">Trailer</option>
                <option value="other" className="dark:bg-slate-900">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Manufacturing Year *
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              >
                {years.map((y) => (
                  <option key={y} value={y} className="dark:bg-slate-900">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Color *
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                required
                placeholder="e.g. White / Blue"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Weight Capacity *
              </label>
              <input
                type="number"
                name="capacityWeight"
                value={formData.capacityWeight}
                onChange={handleChange}
                required
                min="0"
                step="0.1"
                placeholder="e.g. 5"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Capacity Unit *
              </label>
              <select
                name="capacityUnit"
                value={formData.capacityUnit}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              >
                <option value="ton" className="dark:bg-slate-900">Tons</option>
                <option value="kg" className="dark:bg-slate-900">Kilograms (kg)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Fuel Type *
              </label>
              <select
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              >
                <option value="diesel" className="dark:bg-slate-900">Diesel</option>
                <option value="petrol" className="dark:bg-slate-900">Petrol</option>
                <option value="electric" className="dark:bg-slate-900">Electric</option>
                <option value="hybrid" className="dark:bg-slate-900">Hybrid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Vehicle Photos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Vehicle Photos
              </h2>
              <p className="text-xs text-slate-400">
                Upload clear photos from multiple angles for visual inspection.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            {["front", "back", "left", "right", "interior"].map((pos) => (
              <div
                key={pos}
                onClick={() => refs[pos].current.click()}
                className="relative cursor-pointer border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-3 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-800/40 aspect-square group transition-all"
              >
                {vehiclePhotos[pos] ? (
                  <>
                    <img
                      src={vehiclePhotos[pos]}
                      alt={pos}
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={(e) => removePhoto(pos, e)}
                      className="absolute top-2 right-2 bg-rose-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="space-y-1.5 flex flex-col items-center">
                    <Camera className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                      {pos}
                    </span>
                  </div>
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

        {/* Section 3: Registration & Insurance Documents */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Documents & Certifications
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Registration Book */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Registration Certificate (Libre)
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    Registration / Libre Number
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="e.g. LIB-99120"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    Registration Expiry Date
                  </label>
                  <input
                    type="date"
                    name="registrationExpiryDate"
                    value={formData.registrationExpiryDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div
                  onClick={() => refs.registration.current.click()}
                  className="border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-xl p-3 text-center cursor-pointer bg-white dark:bg-slate-900 transition flex flex-col items-center justify-center space-y-1"
                >
                  {documents.registration ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Registration Document Attached</span>
                      <button
                        type="button"
                        onClick={(e) => removeDoc("registration", e)}
                        className="ml-2 text-rose-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Upload Registration Certificate (PDF/Image)
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    ref={refs.registration}
                    onChange={(e) => handleDocUpload("registration", e)}
                    className="hidden"
                    accept="image/*,.pdf"
                  />
                </div>
              </div>
            </div>

            {/* Insurance Policy */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Insurance Policy
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    Insurance Provider Company
                  </label>
                  <input
                    type="text"
                    name="insuranceCompany"
                    value={formData.insuranceCompany}
                    onChange={handleChange}
                    placeholder="e.g. Ethiopian Insurance Corp"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    name="insurancePolicyNumber"
                    value={formData.insurancePolicyNumber}
                    onChange={handleChange}
                    placeholder="e.g. POL-ETH-8821"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    Insurance Expiry Date *
                  </label>
                  <input
                    type="date"
                    name="insuranceExpiryDate"
                    required
                    value={formData.insuranceExpiryDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div
                  onClick={() => refs.insurance.current.click()}
                  className="border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-xl p-3 text-center cursor-pointer bg-white dark:bg-slate-900 transition flex flex-col items-center justify-center space-y-1"
                >
                  {documents.insurance ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Insurance Document Attached</span>
                      <button
                        type="button"
                        onClick={(e) => removeDoc("insurance", e)}
                        className="ml-2 text-rose-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Upload Insurance Policy (PDF/Image)
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    ref={refs.insurance}
                    onChange={(e) => handleDocUpload("insurance", e)}
                    className="hidden"
                    accept="image/*,.pdf"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Inspection Fitness */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Inspection / Bolo Fitness Certificate
            </h3>
            <div
              onClick={() => refs.inspection.current.click()}
              className="border border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 rounded-2xl p-4 text-center cursor-pointer bg-white dark:bg-slate-900 transition flex flex-col items-center justify-center space-y-1.5"
            >
              {documents.inspection ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Inspection Fitness Certificate Attached</span>
                  <button
                    type="button"
                    onClick={(e) => removeDoc("inspection", e)}
                    className="ml-2 text-rose-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Attach Annual Vehicle Inspection / Bolo Certificate
                  </span>
                </>
              )}
              <input
                type="file"
                ref={refs.inspection}
                onChange={(e) => handleDocUpload("inspection", e)}
                className="hidden"
                accept="image/*,.pdf"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Additional Notes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Additional Vehicle Notes & Specifications
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Special refrigeration, cargo tie-downs, liftgate equipment, or special operational notes..."
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 text-sm cursor-pointer"
          >
            {loading
              ? "Submitting Vehicle Registration..."
              : "Submit for Admin Approval"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/driver/my-vehicles")}
            className="w-full sm:w-auto px-6 py-3.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition text-xs font-bold"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterVehicle;
