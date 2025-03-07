const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../../middleware/auth.middleware");
const spotifyAuthMiddleware = require("../../middleware/spotifyAuth.middleware");
const PlaylistSessionController = require("../../controllers/playlist_session.controller");

// ...existing code...

router.get(
  "/user-data",
  verifyFirebaseToken,
  spotifyAuthMiddleware,
  PlaylistSessionController.getUserData
);

router.get(
  "/get-sessions",
  verifyFirebaseToken,
  spotifyAuthMiddleware,
  PlaylistSessionController.getSessions
);

router.post(
  "/create-session",
  verifyFirebaseToken,
  spotifyAuthMiddleware,
  PlaylistSessionController.createSession
);

router.put(
  "/join-session",
  verifyFirebaseToken,
  spotifyAuthMiddleware,
  PlaylistSessionController.joinSession
);

module.exports = router;
