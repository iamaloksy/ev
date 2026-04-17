require("dotenv").config();
const mongoose = require("mongoose");

function buildSourceUri(targetUri) {
  const parsed = new URL(targetUri);
  parsed.pathname = "/test";
  return parsed.toString();
}

async function migrate() {
  const targetUri = process.env.MONGODB_URI;

  if (!targetUri) {
    throw new Error("MONGODB_URI is missing in .env");
  }

  const sourceUri = process.env.MONGODB_SOURCE_URI || buildSourceUri(targetUri);

  const sourceConn = await mongoose.createConnection(sourceUri).asPromise();
  const targetConn = await mongoose.createConnection(targetUri).asPromise();

  const userSchema = new mongoose.Schema(
    {
      name: String,
      email: String,
      password: String,
      createdAt: Date
    },
    { strict: false }
  );

  const stationSchema = new mongoose.Schema(
    {
      name: String,
      location: String,
      totalSlots: Number,
      occupiedSlots: Number,
      pricePerHour: Number
    },
    { strict: false }
  );

  const SourceClient = sourceConn.model("Client", userSchema, "clients");
  const SourceAdmin = sourceConn.model("Admin", userSchema, "admins");
  const SourceStation = sourceConn.model("Station", stationSchema, "stations");

  const TargetClient = targetConn.model("Client", userSchema, "clients");
  const TargetAdmin = targetConn.model("Admin", userSchema, "admins");
  const TargetStation = targetConn.model("Station", stationSchema, "stations");

  const [sourceClients, sourceAdmins, sourceStations] = await Promise.all([
    SourceClient.find().lean(),
    SourceAdmin.find().lean(),
    SourceStation.find().lean()
  ]);

  let clientUpserts = 0;
  for (const client of sourceClients) {
    await TargetClient.updateOne(
      { email: String(client.email || "").toLowerCase().trim() },
      {
        $set: {
          name: client.name,
          email: String(client.email || "").toLowerCase().trim(),
          password: client.password,
          createdAt: client.createdAt || new Date()
        }
      },
      { upsert: true }
    );
    clientUpserts += 1;
  }

  let adminUpserts = 0;
  for (const admin of sourceAdmins) {
    await TargetAdmin.updateOne(
      { email: String(admin.email || "").toLowerCase().trim() },
      {
        $set: {
          name: admin.name,
          email: String(admin.email || "").toLowerCase().trim(),
          password: admin.password,
          createdAt: admin.createdAt || new Date()
        }
      },
      { upsert: true }
    );
    adminUpserts += 1;
  }

  let stationUpserts = 0;
  for (const station of sourceStations) {
    await TargetStation.updateOne(
      { name: station.name, location: station.location },
      {
        $set: {
          totalSlots: Number(station.totalSlots || 0),
          occupiedSlots: Number(station.occupiedSlots || 0),
          pricePerHour: Number(station.pricePerHour || 0)
        }
      },
      { upsert: true }
    );
    stationUpserts += 1;
  }

  const [finalClients, finalAdmins, finalStations] = await Promise.all([
    TargetClient.countDocuments(),
    TargetAdmin.countDocuments(),
    TargetStation.countDocuments()
  ]);

  console.log("Migration completed");
  console.log(`Source DB: ${sourceConn.name}`);
  console.log(`Target DB: ${targetConn.name}`);
  console.log(`Clients migrated: ${clientUpserts}`);
  console.log(`Admins migrated: ${adminUpserts}`);
  console.log(`Stations migrated: ${stationUpserts}`);
  console.log(`Target totals -> clients: ${finalClients}, admins: ${finalAdmins}, stations: ${finalStations}`);

  await sourceConn.close();
  await targetConn.close();
}

migrate().catch(err => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
