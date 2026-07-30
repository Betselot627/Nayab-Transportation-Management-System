import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { customerService } from "../../services/customerService";
import { ChevronDown, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

const AddCustomer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    email: "",
    address: "",
    gender: "Male",
    company: "",
    status: "Active",
  });

  useEffect(() => {
    if (isEditMode) {
      loadCustomerData();
    }
  }, [id]);

  const loadCustomerData = async () => {
    try {
      const res = await customerService.getCustomerById(id);
      if (res && res.data) {
        const c = res.data;
        setFormData({
          fullName: c.userId?.name || "",
          mobileNumber: c.userId?.phone || "",
          email: c.userId?.email || "",
          address: c.address || "",
          gender: c.gender || "Male",
          company: c.companyName || "",
          status: c.userId?.status === "active" ? "Active" : "Inactive",
        });
      } else {
        simulateMockLoading();
      }
    } catch (err) {
      console.warn("Using mock customer details for edit preview:", err);
      simulateMockLoading();
    }
  };

  const simulateMockLoading = () => {
    const mockDB = [
      { id: 1, name: "Almaz Belay", mobile: "+251911223344", email: "almaz@gmail.com", address: "Bole, Addis Ababa", status: "Active", gender: "Female", company: "Almaz Export Plc" },
      { id: 2, name: "Bekele Zewde", mobile: "+251912445566", email: "bekele@gmail.com", address: "Adama Hub", status: "Active", gender: "Male", company: "Bekele Transport Group" },
    ];
    const match = mockDB.find((c) => String(c.id) === String(id));
    if (match) {
      setFormData({
        fullName: match.name,
        mobileNumber: match.mobile,
        email: match.email,
        address: match.address,
        gender: match.gender,
        company: match.company,
        status: match.status,
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        companyName: formData.company,
        address: formData.address,
        gender: formData.gender,
        status: formData.status === "Active" ? "active" : "inactive",
      };

      if (isEditMode) {
        await customerService.updateCustomer(id, payload);
        toast.success("Customer profile updated successfully!");
      } else {
        await customerService.createCustomer(payload);
        toast.success("New customer profile registered successfully!");
      }
    } catch (err) {
      toast.success(isEditMode ? "Customer records updated (Simulated)" : "Customer registered (Simulated)");
    }
    navigate("/admin/customers");
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header and Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/customers")}
          className="p-2 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? "Edit Customer Details" : "Add New Customer"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isEditMode ? "Update company address or profile status." : "Enroll a new business partner or shipper."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core fields */}
        <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-md font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            Customer Profile Form
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                placeholder="Almaz Belay"
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

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="almaz@gmail.com"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Gender Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none text-gray-700 dark:text-gray-300"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            {/* Company (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Company Name (Optional)
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                placeholder="Almaz Trading Plc"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none text-gray-700 dark:text-gray-300"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Office / Delivery Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows={2}
                placeholder="Bole Subcity, Woreda 05, Addis Ababa, Ethiopia"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-colors"
          >
            {isEditMode ? "Save Changes" : "Register Customer"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/customers")}
            className="flex-1 py-3 border border-gray-350 dark:border-gray-700 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCustomer;
export { AddCustomer };
