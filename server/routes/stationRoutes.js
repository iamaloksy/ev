const express = require("express");
const router = express.Router();
const Station = require("../models/Station");

router.get("/", async (req, res) => {
  res.json(await Station.find());
});

router.get("/seed", async (req, res) => {
  await Station.deleteMany();

  await Station.insertMany([
    { name: "EV Hub Central", location: "City Center", totalSlots: 6, occupiedSlots: 2 },
    { name: "Green Charge Point", location: "Mall Road", totalSlots: 5, occupiedSlots: 1 },
    { name: "PowerGo Station", location: "Airport Area", totalSlots: 8, occupiedSlots: 3 },
    { name: "Volt FastCharge", location: "Tech Park", totalSlots: 4, occupiedSlots: 1 }
  ]);

  res.send("Stations Added");
});

module.exports = router;
