require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const IS_SERVERLESS = Boolean(process.env.VERCEL);
const app = express();
const server = IS_SERVERLESS ? null : http.createServer(app);
const io = IS_SERVERLESS
  ? {
      emit: () => {},
      on: () => {},
      off: () => {}
    }
  : new Server(server, {
      cors: { origin: "*" }
    });

app.use(cors());
app.use(express.json());

const CLIENT_BUILD_PATH = path.join(__dirname, "build");
const CLIENT_INDEX_PATH = path.join(CLIENT_BUILD_PATH, "index.html");

const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 5000);
const MONGODB_URI = process.env.MONGODB_URI;

const defaultStations = [
  { name: "FastCharge One", location: "City Center", totalSlots: 8, occupiedSlots: 2, pricePerHour: 120 },
  { name: "GreenPlug Hub", location: "Mall Road", totalSlots: 6, occupiedSlots: 1, pricePerHour: 110 },
  { name: "Airport Spark", location: "Airport", totalSlots: 10, occupiedSlots: 4, pricePerHour: 150 },
  { name: "Tech Volt Point", location: "Tech Park", totalSlots: 12, occupiedSlots: 3, pricePerHour: 130 }
];

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const stationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  totalSlots: { type: Number, required: true, min: 1 },
  occupiedSlots: { type: Number, default: 0, min: 0 },
  pricePerHour: { type: Number, default: 0, min: 0 }
});

const bookingSchema = new mongoose.Schema({
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: "Station", required: true },
  stationName: { type: String, required: true },
  location: { type: String, required: true },
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true, lowercase: true, trim: true },
  status: {
    type: String,
    enum: ["active", "released-by-admin", "auto-released"],
    default: "active"
  },
  createdAt: { type: Date, default: Date.now },
  releasedAt: { type: Date, default: null }
});

const Client = mongoose.model("Client", clientSchema);
const Admin = mongoose.model("Admin", adminSchema);
const Station = mongoose.model("Station", stationSchema);
const Booking = mongoose.model("Booking", bookingSchema);

let seedCompleted = false;
let dbConnectPromise = null;

async function ensureSeedStations() {
  const count = await Station.countDocuments();
  if (count === 0) {
    await Station.insertMany(defaultStations);
  }
}

function sanitizeUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    if (!seedCompleted) {
      await ensureSeedStations();
      seedCompleted = true;
    }
    return;
  }

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in .env");
  }

  if (!dbConnectPromise) {
    dbConnectPromise = mongoose
      .connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
      .then(async () => {
        if (!seedCompleted) {
          await ensureSeedStations();
          seedCompleted = true;
        }
      })
      .catch((err) => {
        dbConnectPromise = null;
        throw err;
      });
  }

  await dbConnectPromise;
}

if (IS_SERVERLESS) {
  app.use(async (req, res, next) => {
    try {
      await connectToDatabase();
      next();
    } catch (err) {
      console.error("Database connection failed:", err.message);
      res.status(500).json({ ok: false, message: "Database unavailable" });
    }
  });
}

io.on("connection", socket => {
  console.log("User connected:", socket.id);
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    message: "Server is running",
    mongo: {
      connected: mongoose.connection.readyState === 1,
      database: mongoose.connection.name
    }
  });
});

app.get("/stations", async (req, res) => {
  const stations = await Station.find().lean();
  res.json(stations);
});

app.get("/bookings", async (req, res) => {
  const bookings = await Booking.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json(bookings);
});

app.post("/book", async (req, res) => {
  const { stationId, clientName, clientEmail } = req.body;
  if (!stationId) {
    return res.status(400).send("stationId is required");
  }

  const normalizedName = String(clientName || "").trim();
  const normalizedEmail = String(clientEmail || "").trim().toLowerCase();
  if (!normalizedName || !normalizedEmail) {
    return res.status(400).send("clientName and clientEmail are required");
  }

  const station = await Station.findById(stationId);

  if (!station) {
    return res.status(404).send("Station not found");
  }

  if (station.occupiedSlots >= station.totalSlots) {
    return res.status(400).send("Full");
  }

  station.occupiedSlots += 1;
  await station.save();

  const booking = await Booking.create({
    stationId: station._id,
    stationName: station.name,
    location: station.location,
    clientName: normalizedName,
    clientEmail: normalizedEmail,
    status: "active"
  });

  io.emit("update", await Station.find().lean());
  io.emit("booking:update", {
    type: "created",
    bookingId: booking._id,
    stationId: station._id
  });

  res.json({ message: "Booked", bookingId: booking._id });
});

app.post("/free", async (req, res) => {
  const { stationId } = req.body;
  if (!stationId) {
    return res.status(400).send("stationId is required");
  }

  const station = await Station.findById(stationId);

  if (!station) {
    return res.status(404).send("Station not found");
  }

  station.occupiedSlots = Math.max(0, station.occupiedSlots - 1);
  await station.save();

  await Booking.findOneAndUpdate(
    { stationId: station._id, status: "active" },
    { $set: { status: "released-by-admin", releasedAt: new Date() } },
    { sort: { createdAt: 1 } }
  );

  io.emit("update", await Station.find().lean());
  io.emit("booking:update", {
    type: "released",
    stationId: station._id
  });

  res.send("Freed");
});

app.post("/set-price", async (req, res) => {
  const { stationId, price } = req.body;
  if (!stationId) {
    return res.status(400).send("stationId is required");
  }

  const nextPrice = Number(price);
  if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
    return res.status(400).send("Invalid price");
  }

  const station = await Station.findById(stationId);

  if (!station) {
    return res.status(404).send("Station not found");
  }

  station.pricePerHour = nextPrice;
  await station.save();
  io.emit("update", await Station.find().lean());

  res.send("Updated");
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const trimmedName = String(name || "").trim();
    const rawPassword = String(password || "").trim();

    if (!trimmedName || !normalizedEmail || !rawPassword) {
      return res.status(400).send("Name, email and password are required");
    }

    const existing = await Client.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).send("User already exists");
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const newClient = await Client.create({
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword
    });

    res.status(201).json({ message: "Registered successfully", user: sanitizeUser(newClient) });
  } catch (err) {
    res.status(500).send("Registration error: " + err.message);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const rawPassword = String(password || "").trim();

    const user = await Client.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).send("Invalid credentials");
    }

    const isValid = await bcrypt.compare(rawPassword, user.password);
    if (!isValid) {
      return res.status(401).send("Invalid credentials");
    }

    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).send("Login error: " + err.message);
  }
});

app.post("/admin-register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const trimmedName = String(name || "").trim();
    const rawPassword = String(password || "").trim();

    if (!trimmedName || !normalizedEmail || !rawPassword) {
      return res.status(400).send("Name, email and password are required");
    }

    const existing = await Admin.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).send("Admin already exists");
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const newAdmin = await Admin.create({
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword
    });

    res.status(201).json({ message: "Admin registered successfully", admin: sanitizeUser(newAdmin) });
  } catch (err) {
    res.status(500).send("Registration error: " + err.message);
  }
});

app.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const rawPassword = String(password || "").trim();

    const admin = await Admin.findOne({ email: normalizedEmail });
    if (!admin) {
      return res.status(401).send("Invalid credentials");
    }

    const isValid = await bcrypt.compare(rawPassword, admin.password);
    if (!isValid) {
      return res.status(401).send("Invalid credentials");
    }

    res.json({ id: admin._id, name: admin.name, email: admin.email });
  } catch (err) {
    res.status(500).send("Login error: " + err.message);
  }
});

if (!IS_SERVERLESS && fs.existsSync(CLIENT_INDEX_PATH)) {
  app.use(express.static(CLIENT_BUILD_PATH));

  // Let React Router handle client-side routes in production builds.
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/socket.io")) {
      return next();
    }

    if (req.path.startsWith("/stations") || req.path.startsWith("/bookings")) {
      return next();
    }

    if (
      req.path.startsWith("/book") ||
      req.path.startsWith("/free") ||
      req.path.startsWith("/set-price") ||
      req.path.startsWith("/register") ||
      req.path.startsWith("/login") ||
      req.path.startsWith("/admin-register") ||
      req.path.startsWith("/admin-login") ||
      req.path.startsWith("/health")
    ) {
      return next();
    }

    return res.sendFile(CLIENT_INDEX_PATH);
  });
}

async function startServer() {
  try {
    await connectToDatabase();

    console.log(`MongoDB connected: ${mongoose.connection.name}`);

    server.listen(PORT, () => {
      console.log(`Realtime server running on ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

mongoose.connection.on("error", err => {
  console.error("MongoDB connection error:", err.message);
});

if (!IS_SERVERLESS) {
  startServer();
}

module.exports = app;
