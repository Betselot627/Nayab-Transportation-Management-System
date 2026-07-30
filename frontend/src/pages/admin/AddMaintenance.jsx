import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { vehicleService } from "../../services/vehicleService";
import { Upload, X, ChevronDown, ArrowLeft, Calendar, Wrench } from "lucide-react";
import toast from "react-hot-toast";

const AddMaintenance = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    vehicle: "",
    maintenanceType: "",
    description: "",
    cost: "",
    garage: "",
    serviceDate: new Date().toISOString().split("T")[0],
    nextServiceDate: "",
    status: "Pending",
  });

  const [vehicles, setVehicles] = useState([]);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [documents, setDocuments] = useState([]);

  // Load vehicles dropdown list
  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const res = await vehicleService.getAllVehicles();
      if (res && res.data && res.data.length > 0) {
        setVehicles(res.data.map(v => ({ id: v._id, label: `${v.manufacturer} ${v.model} (${v.plateNumber})` })));
      } else {
        setVehicles([
          { id: "v1", label: "Toyota Hiace (AA-12345)" },
          { id: "v2", label: "Isuzu Truck (AA-67890)" },
          { id: "v3", label: "Mercedes Sprinter (AA-44556)" },
          { id: "v4", label: "Hino 500 (AA-11223)" },
        ]);
      }

      if (isEditMode) {
        loadMaintenanceData();
      }
    } catch (err) {
      console.warn("Failed to load vehicle entries:", err);
    }
  };

  const loadMaintenanceData = () => {
    // Simulated editing records matching
    const mockDB = [
      { id: 1, vehicle: "v1", maintenanceType: "Oil & Filter Change", description: "Standard synthetic oil change and fuel filters replaced.", cost: "4500", garage: "Sheger Auto Care", serviceDate: "2026-07-28", nextServiceDate: "2026-10-28", status: "Completed" },
      { id: 2, vehicle: "v2", maintenanceType: "Tire Rotation", description: "Rotate and balance rear axle tires.", cost: "12000", garage: "Bole Garage", serviceDate: "2026-07-30", nextServiceDate: "2026-08-15", status: "In Progress" },
    ];
    const match = mockDB.find((m) => String(m.id) === String(id));
    if (match) {
      setFormData({
        vehicle: match.vehicle,
        maintenanceType: match.maintenanceType,
        description: match.description,
        cost: match.cost,
        garage: match.garage,
        serviceDate: match.serviceDate,
        nextServiceDate: match.nextServiceDate,
        status: match.status,
      });
      setInvoiceFile({
        name: "invoice_receipt_72.pdf",
        size: "125.4 KB",
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInvoiceUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setInvoiceFile({
        name: file.name,
        size: (file.size / 1024).toFixed(2) + " KB",
      });
      toast.success("Invoice receipt attached!");
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
    toast.success(`${files.length} diagnostic logs uploaded!`);
  };

  const removeDocument = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
    toast.error("Document removed");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API write
    toast.success(isEditMode ? "Maintenance logs updated (Simulated)" : "Maintenance visit logged (Simulated)");
    navigate("/admin/maintenance");
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header and Back navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/maintenance")}
          className="p-2 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? "Edit Maintenance Record" : "Log Vehicle Maintenance"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isEditMode ? "Modify repair descriptions, costs or next inspection dates." : "Record spare replacement, services, and garage receipts."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core fields */}
        <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-md font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            Maintenance Service Sheet
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Vehicle Selection Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Vehicle <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="vehicle"
                  value={formData.vehicle}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none text-gray-700 dark:text-gray-300"
                >
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            {/* Maintenance Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Maintenance Type / Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="maintenanceType"
                value={formData.maintenanceType}
                onChange={handleInputChange}
                required
                placeholder="Oil & Filter Change"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Service Garage */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Service Garage / Shop <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="garage"
                value={formData.garage}
                onChange={handleInputChange}
                required
                placeholder="Sheger Auto Care"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Service Cost (ETB) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Service Cost (ETB) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleInputChange}
                required
                placeholder="4500"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Service Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Service Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="serviceDate"
                value={formData.serviceDate}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 dark:text-gray-300"
              />
            </div>

            {/* Next Service Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Next Service Alarm Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="nextServiceDate"
                value={formData.nextServiceDate}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 dark:text-gray-300"
              />
            </div>

            {/* Service Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Repair Status <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none text-gray-700 dark:text-gray-300"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            {/* Empty grid space for alignment */}
            <div></div>

            {/* Repair Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Service Repair Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                placeholder="Specify broken parts replaced or standard mechanical diagnostics details..."
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Media & Docs Upload Panels */}
        <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-md font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            Invoice & Service Documentation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice Upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Garage Invoice / Receipt
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-blue-500 dark:hover:border-blue-450 transition-colors bg-gray-50/50 dark:bg-gray-900/10">
                {invoiceFile ? (
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl">
                    <div className="min-w-0 flex-1 pr-3 text-left">
                      <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">
                        {invoiceFile.name}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{invoiceFile.size}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInvoiceFile(null)}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Upload Service Invoice
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG up to 5MB</p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleInvoiceUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Document Upload Zone */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Supporting Service Documents
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-blue-500 dark:hover:border-blue-450 transition-colors bg-gray-50/50 dark:bg-gray-900/10 mb-4">
                <label className="cursor-pointer block">
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Upload Repair Log Documents
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG up to 10MB</p>
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
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl"
                    >
                      <div className="min-w-0 flex-1 pr-3 text-left">
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
            {isEditMode ? "Save Maintenance Logs" : "Record Maintenance Work"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/maintenance")}
            className="flex-1 py-3 border border-gray-350 dark:border-gray-700 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-850 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMaintenance;
export { AddMaintenance };
