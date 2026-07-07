const Maintenance = require("../models/Maintenance");

exports.getAllMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.find().populate("vehicle");
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMaintenanceById = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id).populate(
      "vehicle",
    );
    if (!maintenance)
      return res.status(404).json({ message: "Maintenance record not found" });
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createMaintenance = async (req, res) => {
  try {
    const maintenance = new Maintenance(req.body);
    await maintenance.save();
    res.status(201).json(maintenance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!maintenance)
      return res.status(404).json({ message: "Maintenance record not found" });
    res.json(maintenance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findByIdAndDelete(req.params.id);
    if (!maintenance)
      return res.status(404).json({ message: "Maintenance record not found" });
    res.json({ message: "Maintenance record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
