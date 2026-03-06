const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});

module.exports = mongoose.model("Client", clientSchema);
