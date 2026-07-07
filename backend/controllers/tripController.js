const Trip = require("../models/Trip");

exports.getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.find().populate("driver vehicle shipment");
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate(
      "driver vehicle shipment",
    );
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTrip = async (req, res) => {
  try {
    const trip = new Trip(req.body);
    await trip.save();
    res.status(201).json(trip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    res.json(trip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
