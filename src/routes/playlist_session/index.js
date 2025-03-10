const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../../middleware/auth.middleware");
const spotifyAuthMiddleware = require("../../middleware/spotifyAuth.middleware");
const PlaylistSessionController = require("../../controllers/playlist_session.controller");
const SpotifyService = require("../../services/spotify.service");

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

router.get(
  "/:sessionId/users",
  verifyFirebaseToken,
  spotifyAuthMiddleware,
  PlaylistSessionController.getSessionUsers
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
router.post(
  "/create-playlist",
  verifyFirebaseToken,
  spotifyAuthMiddleware,
  PlaylistSessionController.createPlaylist
);

module.exports = router;
