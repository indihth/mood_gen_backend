require("dotenv").config();
const express = require("express");
const { initializeFirebase } = require("./config/firebase.config");
const SpotifyWebApi = require("spotify-web-api-node");

const app = express();
const port = process.env.PORT || 3000;

initializeFirebase();

// Apply middleware for session
app.use(sessionMiddleware);

// Apply routes?
app.use("/api", routes);

module.exports = app;
