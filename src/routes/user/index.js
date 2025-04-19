const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../../middleware/auth.middleware");
const UserController = require("../../controllers/user.controller");

router.post("/create-user", verifyFirebaseToken, UserController.createNewUser);

router.get(
  "/spotify-status",
  verifyFirebaseToken,
  UserController.getSpotifyConnectStatus
);

router.get("/sessions", verifyFirebaseToken, UserController.getUserSessions);

module.exports = router;
