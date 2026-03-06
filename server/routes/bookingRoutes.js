const express = require("express");
const Booking = require("../models/Booking");

const router = express.Router();

router.post("/book", async (req, res) => {
  const booking = new Booking(req.body);
  await booking.save();
  res.send("Booking Successful");
});

router.get("/", async (req, res) => {
  const bookings = await Booking.find();
  res.json(bookings);
});

module.exports = router;
