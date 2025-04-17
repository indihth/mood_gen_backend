const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../../middleware/auth.middleware");
const UserController = require("../../controllers/user.controller");

router.get(
  "/spotify-status",
  verifyFirebaseToken,
  UserController.getSpotifyConnectStatus
);

module.exports = router;
