// server.js
const express = require("express");
// const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./src/routes/auth");
const spotifyRoutes = require("./src/routes/spotify");
const firebaseRoutes = require("./src/routes/firebase");
const { initializeFirebaseApp } = require("./src/services/firebaseServices");

// Load environment variables
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

initializeFirebaseApp();

// Middleware
app.use(cors()); // allow cross-origin requests
app.use(express.json()); // parse JSON bodies

// routes
app.use("/auth", authRoutes);
app.use("/spotify", spotifyRoutes);
app.use("/firebase", firebaseRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
