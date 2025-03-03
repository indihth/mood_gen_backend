// src/routes/index.js
const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./auth/auth");
const spotifyRoutes = require("./spotify/index");
const playlistSessionRoutes = require("./playlist_session/index");

// Define path prefixes for different route categories
router.use("/auth", authRoutes); // All authentication-related routes will be under /api/auth/*
router.use("/spotify", spotifyRoutes); // All Spotify-related routes will be under /api/spotify/*
router.use("/playlist-sessions", playlistSessionRoutes); // All playlist session-related routes will be under /api/playlist-session/*

// You might also want to add a simple health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

module.exports = router;
