const express = require("express");
const router = express.Router();
const Client = require("../models/Client");
const Station = require("../models/Station");

router.post("/book", async (req,res)=>{
  const {name,car,phone,station} = req.body;

  const s = await Station.findOne({name:station});
  if(s.occupiedSlots >= s.totalSlots){
    return res.send("No slots available");
  }

  s.occupiedSlots++;
  await s.save();

  const client = new Client({
    name,car,phone,station,slot:s.occupiedSlots
  });

  await client.save();
  res.send("Booked Successfully");
});

module.exports = router;
