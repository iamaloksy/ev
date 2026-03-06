const mongoose = require("mongoose");

const stationSchema = new mongoose.Schema({
  name: String,
  location: String,
  totalSlots: Number,
  occupiedSlots: Number,
  pricePerHour: { type: Number, default: 50 }
});

module.exports = mongoose.model("Station", stationSchema);
