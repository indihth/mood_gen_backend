// src/routes/spotify/index.js
const express = require("express");
const router = express.Router();
const { verifyFirebaseToken } = require("../../middleware/auth.middleware");
const spotifyAuthMiddleware = require("../../middleware/spotifyAuth.middleware");
const SpotifyService = require("../../services/spotify.service");
const UserService = require("../../services/user.service");
const { spotifyApi, scopes } = require("../../config/spotify.config");

// initial point for users to authenticate
router.get("/login", (req, res) => {
  // router.get("/login", verifyFirebaseToken, (req, res) => {
  // req.session.userId = req.user.uid; // Set the user ID in the session
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

// Spotify redirects user back to this endpoint after auth, with access token
router.get("/callback", async (req, res) => {
  // Check if user is logged in
  let userId = "80"; // Hardcoded for testing, will be dynamic later

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
    const accessTokenData = await SpotifyService.getAccessToken(req.query.code);
    // console log accessTokenData to see what it looks like
    console.log(`accessTokenData: ${accessTokenData}`);
    await UserService.saveSpotifyToken(userId, accessTokenData);

    res.send("Success!");
  } catch (error) {
    console.error("Error getting Tokens:", error);
    res.send(`Error getting Tokens: ${error}`);
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
router.get("/playlists", spotifyAuthMiddleware, (req, res) => {
  spotifyApi
    .getUserPlaylists()
    .then((data) => {
      res.json(data.body);
    })
    .catch((err) => {
      console.error("Error fetching playlists:", err);
      res.status(500).send(`Error fetching playlists: ${err.message}`);
    });
});

// Example route to get user's playlists
router.get("/top", spotifyAuthMiddleware, (req, res) => {
  spotifyApi
    // Get the current user's top artists or tracks based on calculated affinity (ref: Spotify).
    .getMyTopTracks({ time_range: "short_term", limit: 50 })
    .then((data) => {
      // map the data to only return the track name and artist
      const mappedData = data.body.items.map((track) => {
        return {
          name: track.name,
          artist: track.artists[0].name,
          // album: track.album.name,
          // id: track.id,
        };
      });

      // Send both the mapped items and total count in the response
      res.json({
        items: mappedData,
        total: data.body.total,
      });
    })
    .catch((err) => {
      console.error("Error fetching top tracks:", err);
      res.status(500).send(`Error fetching top tracks: ${err.message}`);
    });
});

// TODO: Add a route to refresh the access token and update Firestore

module.exports = router;
