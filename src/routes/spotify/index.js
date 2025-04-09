// src/routes/spotify/index.js
const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../../middleware/auth.middleware");
const spotifyAuthMiddleware = require("../../middleware/spotifyAuth.middleware");
const sessionMiddleware = require("../../middleware/session.middleware");
const SpotifyService = require("../../services/spotify.services");
const UserService = require("../../services/user.services");
const { spotifyApi, scopes } = require("../../config/spotify.config");
const SpotifyController = require("../../controllers/spotify.controller");
const TokenService = require("../../services/token.services");

// initial point for users to authenticate
router.get("/login", verifyFirebaseToken, SpotifyController.login);

// Spotify redirects user back to this endpoint after auth, with access token
router.get("/callback", SpotifyController.callback);

// Create playlist
router.post(
  "/playlist",
  verifyFirebaseToken,
  spotifyAuthMiddleware,
  SpotifyController.createPlaylist
);

// Get a playlist
router.get(
  "/playlist",
  verifyFirebaseToken,
  spotifyAuthMiddleware,
  SpotifyController.getPlaylist
);

// Get top tracks
router.get(
  "/top",
  verifyFirebaseToken,
  spotifyAuthMiddleware,
  SpotifyController.getTopTracks
);

// TODO: Add a route to refresh the access token and update Firestore

module.exports = router;
