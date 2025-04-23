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

router.get("/dashboard", verifyFirebaseToken, UserController.populateDashboard);

module.exports = router;
