// src/routes/spotify/index.js
const express = require("express");
const router = express.Router();
const { verifyFirebaseToken } = require("../../middleware/auth.middleware");
const SpotifyService = require("../../services/spotify.service");
const { spotifyApi, scopes } = require("../../config/spotify.config");

// initial point for users to authenticate
router.get("/login", verifyFirebaseToken, (req, res) => {
  req.session.userId = req.user.uid; // Set the user ID in the session
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

// OLD CODE
// router.get("/login", verifyFirebaseToken, (req, res) => {
//   req.session.userId = req.user.uid;
//   const spotifyAuthUrl = SpotifyService.generateAuthUrl();
//   res.redirect(spotifyAuthUrl);
// });

// Spotify redirects user back to this endpoint after auth, with access token
router.get("/callback", async (req, res) => {
  // Check if user is logged in
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: "Session expired" });
  }

  const error = req.query.error;
  //   const code = req.query.code;

  if (error) {
    console.error("Callback Error:", error);
    res.send(`Callback Error: ${error}`);
    return;
  }

  try {
    const accessTokenData = await SpotifyService.getAccessToken(req.query.code);
    await UserService.saveSpotifyToken(userId, accessTokenData);

    //  OLD CODE
    //   spotifyApi
    //     .authorizationCodeGrant(code)
    //     .then((data) => {
    //       const access_token = data.body["access_token"];
    //       const refresh_token = data.body["refresh_token"];
    //       const expires_in = data.body["expires_in"];

    //       // set access tokens to the api object
    //       spotifyApi.setAccessToken(access_token);
    //       spotifyApi.setRefreshToken(refresh_token);

    //       // upload the tokens to Firestore
    //       const dataUpload = {
    //         userId: 1,
    //         access_token: access_token,
    //         refresh_token: refresh_token,
    //         expires_in: expires_in,
    //       };
    //       uploadData(dataUpload);

    console.log(`access_token: ${accessTokenData.access_token}`);
    res.send("Success!");
  } catch (error) {
    console.error("Error getting Tokens:", error);
    res.send(`Error getting Tokens: ${error}`);
  }
});

// OLD CODE
// router.get("/callback", async (req, res) => {
//   const userId = req.session.userId;
//   if (!userId) {
//     return res.status(401).json({ error: "Session expired" });
//   }

//   try {
//     const accessToken = await SpotifyService.getAccessToken(req.query.code);
//     await UserService.saveSpotifyToken(userId, accessToken);
//     res.redirect("your-app://success");
//   } catch (error) {
//     next(error);
//   }
// });

// TODO: Add a route to refresh the access token and update Firestore

module.exports = router;
