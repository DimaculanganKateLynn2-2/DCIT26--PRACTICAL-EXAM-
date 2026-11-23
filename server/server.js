
require("dotenv").config();
const petRoutes = require("./routes/petRoutes");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json({ limit: "10kb" }));
app.use("/api/pets", petRoutes);

// Basic test route
app.get("/", (req, res) => {
  res.json({
    message: "VetCare Meadow API is running!"
  });
});

// Backend health check
app.get("/api/health", (req, res) => {
  res.json({
    server: "running",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected"
  });
});

async function startServer() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI in server/.env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "vetcare_meadow"
    });

    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(
        `VetCare Meadow backend running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
