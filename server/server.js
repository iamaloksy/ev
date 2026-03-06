const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const Admin = require("./models/Admin");
const Client = require("./models/Client");
const Station = require("./models/Station");

const app = express();                 // ✅ missing before
const server = http.createServer(app); // ✅ missing before

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/evsystem")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

/* SOCKET */
io.on("connection", socket => {
  console.log("User connected:", socket.id);
});

/* GET STATIONS */
app.get("/stations", async (req,res)=>{
  res.json(await Station.find());
});

/* BOOK SLOT */
app.post("/book", async (req,res)=>{
  const { stationId } = req.body;

  const s = await Station.findById(stationId);
  if(!s) return res.status(404).send("Station not found");
  if(s.occupiedSlots >= s.totalSlots) return res.status(400).send("Full");

  s.occupiedSlots++;
  await s.save();

  io.emit("update", await Station.find());

  setTimeout(async()=>{
    const st = await Station.findById(stationId);
    if(st && st.occupiedSlots > 0){
      st.occupiedSlots--;
      await st.save();
      io.emit("update", await Station.find());
    }
  },30000);

  res.send("Booked");
});

/* FREE SLOT */
app.post("/free", async (req,res)=>{
  const { stationId } = req.body;

  const s = await Station.findById(stationId);
  if(!s) return res.status(404).send("Station not found");

  s.occupiedSlots = Math.max(0, s.occupiedSlots - 1);
  await s.save();

  io.emit("update", await Station.find());
  res.send("Freed");
});

/* UPDATE PRICE */
app.post("/set-price", async (req,res)=>{
  const { stationId, price } = req.body;

  const s = await Station.findById(stationId);
  if(!s) return res.status(404).send("Station not found");

  s.pricePerHour = Number(price);
  await s.save();

  io.emit("update", await Station.find());
  res.send("Updated");
});

/* CLIENT AUTH */
app.post("/register", async (req,res)=>{
  const { name, email, password } = req.body;
  await Client.create({ name, email, password });
  res.send("Registered");
});

app.post("/login", async (req,res)=>{
  const { email, password } = req.body;
  const user = await Client.findOne({ email, password });
  if(!user) return res.status(401).send("Invalid login");
  res.json({ name: user.name });
});

/* ADMIN AUTH (SIMPLE LIKE CLIENT) */

// ADMIN LOGIN (same as client)
app.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email, password });

    if (!admin) {
      return res.status(401).send("Invalid login");
    }

    res.json({
      name: admin.name,
      email: admin.email
    });

  } catch (err) {
    res.status(500).send("Server error");
  }
});



server.listen(5000, ()=>{
  console.log("Realtime server running on 5000");
});
