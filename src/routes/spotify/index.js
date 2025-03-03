// src/routes/spotify/index.js
const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../../middleware/auth.middleware");
const spotifyAuthMiddleware = require("../../middleware/spotifyAuth.middleware");
const sessionMiddleware = require("../../middleware/session.middleware");
const SpotifyService = require("../../services/spotify.service");
const UserService = require("../../services/user.service");
const { spotifyApi, scopes } = require("../../config/spotify.config");
const SpotifyController = require("../../controllers/spotify.controller");
const TokenService = require("../../services/token.service");

// initial point for users to authenticate
router.get("/login", verifyFirebaseToken, (req, res) => {
  // req.session.userId = req.user.uid; // Set the user ID in the session

  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

// Spotify redirects user back to this endpoint after auth, with access token
router.get("/callback", async (req, res) => {
  // Check if user is logged in
  let userId = req.session.uid; // Hardcoded for testing, will be dynamic later

  // let userId = req.session.userId;
  // if (!userId) {
  //   userId = "60";
  //   return res.status(401).json({ error: "Session expired" });
  // }

  const error = req.query.error;
  //   const code = req.query.code;

  if (error) {
    console.error("Callback Error:", error);
    res.send(`Callback Error: ${error}`);
    return;
  }

  try {
    const accessTokenData = await TokenService.getAccessToken(req.query.code);
    // console log accessTokenData to see what it looks like
    console.log(`accessTokenData: ${accessTokenData}`);
    // await UserService.saveSpotifyToken(userId, accessTokenData);

    // res.send("Success!");
    res.redirect(`spotifyauth://callback?success=true`); // redirects to mobile app with success
  } catch (error) {
    console.error("Error getting Tokens:", error);
    // res.send(`Error getting Tokens: ${error}`);
    res.redirect(
      `spotifyauth://callback?error=${encodeURIComponent(error.toString())}`
    ); // redirects to mobile app with error message
  }
});

router.get("/artist-top-tracks", spotifyAuthMiddleware, async (req, res) => {
  spotifyApi
    .getArtistTopTracks("0oSGxfWSnnOXhD2fKuz2Gy", "GB")
    .then((data) => {
      const mappedData = data.body.items.map((track) => {
        return {
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          id: track.id,
        };
      });
      res.json(mappedData);
    })
    .catch((err) => {
      console.error("Error fetching artist top tracks:", err);
      res.status(500).send(`Error fetching artist top tracks: ${err.message}`);
    });
});

// Example route to get user's playlists
router.get(
  "/playlists",
  verifyFirebaseToken,
  spotifyAuthMiddleware,
  (req, res) => {
    spotifyApi
      .getUserPlaylists()
      .then((data) => {
        res.json(data.body);
      })
      .catch((err) => {
        console.error("Error fetching playlists:", err);
        res.status(500).send(`Error fetching playlists: ${err.message}`);
      });
  }
);

// Refactored route to use controller
router.get(
  "/top",
  verifyFirebaseToken,
  spotifyAuthMiddleware,
  SpotifyController.getTopTracks
);

// TODO: Add a route to refresh the access token and update Firestore

module.exports = router;
