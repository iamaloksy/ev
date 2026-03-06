const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.send("User Registered");
});

router.post("/login", async (req, res) => {
  const user = await User.findOne(req.body);
  res.send(user ? "Login Success" : "Invalid Credentials");
});

module.exports = router;
