const express = require("express");
const router = express.Router();
const spotifyApi = require("../config/spotifyClient");

// Middleware to check and set the access token
router.use((req, res, next) => {
  const accessToken = spotifyApi.getAccessToken();
  //   res.send("Spotify API:", accessToken);
  if (!accessToken) {
    return res.status(401).send("No token provided");
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
