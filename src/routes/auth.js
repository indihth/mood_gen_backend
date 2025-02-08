const express = require("express");
const router = express.Router();
require("dotenv").config();
const { uploadData } = require("../services/firebaseServices");
const spotifyApi = require("../config/spotifyClient");

// initial point for users to authenticate
router.get("/login", (req, res) => {
  const scopes = [
    "playlist-modify-public", // Allow creating public playlists
    "playlist-modify-private", // Allow creating private playlists
    "user-read-private", // Read user profile
    "user-read-email", // Read user email
  ];
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

// spotify redirects user back to this endpoint after auth, with access token
router.get("/callback", (req, res) => {
  const error = req.query.error;
  const code = req.query.code;
  const state = req.query.state;

  if (error) {
    console.error("Callback Error:", error);
    res.send(`Callback Error: ${error}`);
    return;
  }

  spotifyApi
    .authorizationCodeGrant(code)
    .then((data) => {
      const access_token = data.body["access_token"];
      const refresh_token = data.body["refresh_token"];
      const expires_in = data.body["expires_in"];

      // set access tokens to the api object
      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      // upload the tokens to Firestore
      const dataUpload = {
        userId: 1,
        access_token: access_token,
        refresh_token: refresh_token,
        expires_in: expires_in,
      };
      uploadData(dataUpload);

      console.log(`access_token: ${access_token}`);
      res.send("Success!");
    })
    .catch((error) => {
      console.error("Error getting Tokens:", error);
      res.send(`Error getting Tokens: ${error}`);
    });
});

// TODO: Add a route to refresh the access token and update Firestore

module.exports = router;
