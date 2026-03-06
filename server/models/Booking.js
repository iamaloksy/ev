const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: String,
  station: String,
  time: String
});

module.exports = mongoose.model("Booking", bookingSchema);
