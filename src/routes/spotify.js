const express = require("express");
const router = express.Router();
const spotifyApi = require("../config/spotify.config");
const { getSpotifyToken } = require("../services/firebaseServices");

// Middleware to check and set the access token
router.use(async (req, res, next) => {
  const accessToken = spotifyApi.getAccessToken();
  const userId = "VRGke1ULnDGgL4RsHANG"; // Hardcoded for now

  if (!accessToken) {
    try {
      // Check if db has token
      const userToken = await getSpotifyToken(userId);
      console.log("User token:", userToken);
      if (userToken) {
        // Set the access token from db
        spotifyApi.setAccessToken(userToken.access_token);
      } else {
        return res.status(401).send("No token provided");
      }
    } catch (error) {
      console.error("Error getting token:", error);
      return res.status(500).send("Error getting token");
    }
  }
  next();
});

// Define your Spotify routes here
router.get("/", (req, res) => {
  res.send("Spotify route");
});

router.get("/elvis", (req, res) => {
  spotifyApi
    .getArtistAlbums("43ZHCT0cAZBISjO8DG9PnE")
    .then((data) => {
      console.log("Artist albums", data.body);
      res.send(data.body);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send(err);
    });
});

// Example route to get user's playlists
router.get("/playlists", (req, res) => {
  spotifyApi
    .getUserPlaylists()
    .then((data) => {
      res.json(data.body);
    })
    .catch((err) => {
      console.error("Error fetching playlists:", err);
      res.status(500).send("Error fetching playlists");
    });
});

module.exports = router;
