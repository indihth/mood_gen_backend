const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../../middleware/auth.middleware");
require("dotenv").config();
const { uploadData } = require("../../services/firebaseServices");
const { spotifyApi, scopes } = require("../../config/spotify.config");

// initial point for users to authenticate
router.get("/login", (req, res) => {
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
        access_token: access_token,
        refresh_token: refresh_token,
        expires_in: expires_in,
      };
      uploadData(dataUpload);

      res.send("Success!");
    })
    .catch((error) => {
      console.error("Error getting Tokens:", error);
      res.send(`Error getting Tokens: ${error}`);
    });
});

// TODO: Add a route to refresh the access token and update Firestore

module.exports = router;
