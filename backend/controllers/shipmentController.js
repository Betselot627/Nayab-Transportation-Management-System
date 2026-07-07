const Shipment = require("../models/Shipment");

exports.getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find().populate("customer");
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id).populate(
      "customer",
    );
    if (!shipment)
      return res.status(404).json({ message: "Shipment not found" });
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createShipment = async (req, res) => {
  try {
    const shipment = new Shipment(req.body);
    await shipment.save();
    res.status(201).json(shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!shipment)
      return res.status(404).json({ message: "Shipment not found" });
    res.json(shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndDelete(req.params.id);
    if (!shipment)
      return res.status(404).json({ message: "Shipment not found" });
    res.json({ message: "Shipment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
