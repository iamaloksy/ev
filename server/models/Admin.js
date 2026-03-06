const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

// FORCE collection name to be "admins"
module.exports = mongoose.model("Admin", adminSchema, "admins");